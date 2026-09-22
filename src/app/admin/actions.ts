"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";

import { adminPath } from "@/lib/admin-routes";

import { db } from "@/lib/db";
import { channelHasVideos, categoryHasVideos } from "@/lib/admin-catalog";
import {
  categories,
  channels,
  comments,
  videoAliases,
  videoCategories,
  videoRelated,
  videos,
} from "../../../drizzle/schema";

export type ActionState = { error?: string } | undefined;

function revalidateCatalog() {
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
}

function required(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) throw new Error(`${key} is required`);
  return value;
}

function optional(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length ? value : null;
}

function lines(formData: FormData, key: string) {
  return String(formData.get(key) ?? "")
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function slugValue(value: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    throw new Error("Slug must be lowercase letters, numbers, and hyphens");
  }
  return value;
}

function numberValue(formData: FormData, key: string) {
  const value = Number(formData.get(key));
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${key} is invalid`);
  return value;
}

async function replaceVideoLinks(videoId: number, formData: FormData) {
  const categoryIds = formData
    .getAll("categoryId")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);
  const aliases = lines(formData, "aliases");
  const relatedSlugs = lines(formData, "relatedSlugs");

  await db.delete(videoCategories).where(eq(videoCategories.videoId, videoId));
  if (categoryIds.length) {
    await db
      .insert(videoCategories)
      .values(categoryIds.map((categoryId) => ({ videoId, categoryId })));
  }

  await db.delete(videoAliases).where(eq(videoAliases.videoId, videoId));
  if (aliases.length) {
    await db.insert(videoAliases).values(aliases.map((alias) => ({ videoId, alias })));
  }

  await db.delete(videoRelated).where(eq(videoRelated.videoId, videoId));
  if (relatedSlugs.length) {
    const relatedVideos = await db
      .select({ id: videos.id, slug: videos.slug })
      .from(videos)
      .where(and(ne(videos.id, videoId)));
    const bySlug = new Map(relatedVideos.map((row) => [row.slug, row.id]));
    const rows = relatedSlugs.flatMap((slug, index) => {
      const relatedVideoId = bySlug.get(slug);
      return relatedVideoId
        ? [{ videoId, relatedVideoId, sortOrder: index }]
        : [];
    });
    if (rows.length) await db.insert(videoRelated).values(rows);
  }
}

async function videoValues(formData: FormData, previousThumbnail?: string) {
  const watchChipLines = lines(formData, "watchChips");
  const thumbnail = required(formData, "thumbnail");
  const values = {
    slug: slugValue(required(formData, "slug")),
    title: required(formData, "title"),
    channelId: numberValue(formData, "channelId"),
    views: required(formData, "views"),
    uploaded: required(formData, "uploaded"),
    duration: required(formData, "duration"),
    likes: required(formData, "likes"),
    commentCount: required(formData, "commentCount"),
    thumbnail,
    poster: optional(formData, "poster"),
    sourceUrl: required(formData, "sourceUrl"),
    description: required(formData, "description"),
    tags: lines(formData, "tags"),
    extraChips: lines(formData, "extraChips"),
    watchChips: watchChipLines.length ? watchChipLines : null,
  };
  if (previousThumbnail === thumbnail) return values;
  const { embedThumbnail } = await import("@/lib/clip-embed");
  return { ...values, embedding: await embedThumbnail(thumbnail) };
}

export async function createChannel(_state: ActionState, formData: FormData) {
  try {
    await db.insert(channels).values({
      name: required(formData, "name"),
      slug: slugValue(required(formData, "slug")),
      avatar: required(formData, "avatar"),
      verified: formData.get("verified") === "on",
      subscribers: required(formData, "subscribers"),
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not create channel" };
  }
  revalidateCatalog();
  redirect(adminPath("/admin/channels"));
}

export async function updateChannel(_state: ActionState, formData: FormData) {
  const id = numberValue(formData, "id");
  try {
    await db
      .update(channels)
      .set({
        name: required(formData, "name"),
        slug: slugValue(required(formData, "slug")),
        avatar: required(formData, "avatar"),
        verified: formData.get("verified") === "on",
        subscribers: required(formData, "subscribers"),
      })
      .where(eq(channels.id, id));
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not update channel" };
  }
  revalidateCatalog();
  redirect(adminPath("/admin/channels"));
}

export async function deleteChannel(formData: FormData) {
  const id = numberValue(formData, "id");
  if (await channelHasVideos(id)) {
    throw new Error("Remove or reassign this channel's videos first");
  }
  await db.delete(channels).where(eq(channels.id, id));
  revalidateCatalog();
  redirect(adminPath("/admin/channels"));
}

export async function createCategory(formData: FormData) {
  await db.insert(categories).values({
    name: required(formData, "name"),
    sortOrder: Number(formData.get("sortOrder") || 0),
  });
  revalidateCatalog();
}

export async function updateCategory(formData: FormData) {
  const id = numberValue(formData, "id");
  await db
    .update(categories)
    .set({
      name: required(formData, "name"),
      sortOrder: Number(formData.get("sortOrder") || 0),
    })
    .where(eq(categories.id, id));
  revalidateCatalog();
}

export async function deleteCategory(formData: FormData) {
  const id = numberValue(formData, "id");
  if (await categoryHasVideos(id)) {
    throw new Error("Remove this category from videos first");
  }
  await db.delete(categories).where(eq(categories.id, id));
  revalidateCatalog();
}

export async function createVideo(_state: ActionState, formData: FormData) {
  try {
    const [created] = await db.insert(videos).values(await videoValues(formData)).returning({
      id: videos.id,
    });
    if (!created) throw new Error("Could not create video");
    await replaceVideoLinks(created.id, formData);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not create video" };
  }
  revalidateCatalog();
  redirect(adminPath("/admin/videos"));
}

export async function updateVideo(_state: ActionState, formData: FormData) {
  const id = numberValue(formData, "id");
  try {
    const [existing] = await db
      .select({ thumbnail: videos.thumbnail })
      .from(videos)
      .where(eq(videos.id, id))
      .limit(1);
    await db
      .update(videos)
      .set(await videoValues(formData, existing?.thumbnail))
      .where(eq(videos.id, id));
    await replaceVideoLinks(id, formData);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not update video" };
  }
  revalidateCatalog();
  redirect(adminPath("/admin/videos"));
}

export async function deleteVideo(formData: FormData) {
  const id = numberValue(formData, "id");
  await db.delete(videos).where(eq(videos.id, id));
  revalidateCatalog();
  redirect(adminPath("/admin/videos"));
}

export async function createComment(formData: FormData) {
  const videoId = numberValue(formData, "videoId");
  await db.insert(comments).values({
    videoId,
    author: required(formData, "author"),
    avatar: required(formData, "avatar"),
    posted: required(formData, "posted"),
    body: required(formData, "body"),
    likes: required(formData, "likes"),
    sortOrder: Number(formData.get("sortOrder") || 0),
  });
  revalidateCatalog();
}

export async function updateComment(_state: ActionState, formData: FormData) {
  const id = numberValue(formData, "id");
  try {
    await db
      .update(comments)
      .set({
        author: required(formData, "author"),
        avatar: required(formData, "avatar"),
        posted: required(formData, "posted"),
        body: required(formData, "body"),
        likes: required(formData, "likes"),
        sortOrder: Number(formData.get("sortOrder") || 0),
      })
      .where(eq(comments.id, id));
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not update comment" };
  }
  revalidateCatalog();
  redirect(adminPath("/admin/comments"));
}

export async function deleteComment(formData: FormData) {
  const id = numberValue(formData, "id");
  await db.delete(comments).where(eq(comments.id, id));
  revalidateCatalog();
}
