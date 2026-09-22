import "server-only";

import { asc, eq, ne, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  categories,
  channels,
  comments,
  videoAliases,
  videoCategories,
  videoRelated,
  videos,
} from "../../drizzle/schema";

const rowCount = sql<number>`count(*)::int`;

function asCount(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

export async function getAdminCounts() {
  const [channelRows, categoryRows, videoRows, commentRows] = await Promise.all([
    db.select({ value: rowCount }).from(channels),
    db.select({ value: rowCount }).from(categories),
    db.select({ value: rowCount }).from(videos),
    db.select({ value: rowCount }).from(comments),
  ]);

  return {
    channels: asCount(channelRows[0]?.value),
    categories: asCount(categoryRows[0]?.value),
    videos: asCount(videoRows[0]?.value),
    comments: asCount(commentRows[0]?.value),
  };
}

export async function listAdminChannels() {
  return db.select().from(channels).orderBy(asc(channels.name));
}

export async function getAdminChannel(id: number) {
  const [row] = await db.select().from(channels).where(eq(channels.id, id)).limit(1);
  return row;
}

export async function listAdminCategories() {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      sortOrder: categories.sortOrder,
      videoCount: sql<number>`count(${videoCategories.videoId})::int`,
    })
    .from(categories)
    .leftJoin(videoCategories, eq(videoCategories.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
  return rows;
}

export async function getAdminCategory(id: number) {
  const [row] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return row;
}

export async function listAdminVideos() {
  return db
    .select({
      id: videos.id,
      slug: videos.slug,
      title: videos.title,
      views: videos.views,
      uploaded: videos.uploaded,
      channelName: channels.name,
    })
    .from(videos)
    .innerJoin(channels, eq(videos.channelId, channels.id))
    .orderBy(asc(videos.title));
}

export async function listAdminVideoOptions(excludeId?: number) {
  return db
    .select({ id: videos.id, slug: videos.slug, title: videos.title })
    .from(videos)
    .where(excludeId ? ne(videos.id, excludeId) : undefined)
    .orderBy(asc(videos.title));
}

export async function getAdminVideo(id: number) {
  const [video] = await db.select().from(videos).where(eq(videos.id, id)).limit(1);
  if (!video) return undefined;

  const [aliasRows, categoryRows, relatedRows, commentRows] = await Promise.all([
    db
      .select({ alias: videoAliases.alias })
      .from(videoAliases)
      .where(eq(videoAliases.videoId, id)),
    db
      .select({ categoryId: videoCategories.categoryId })
      .from(videoCategories)
      .where(eq(videoCategories.videoId, id)),
    db
      .select({
        relatedVideoId: videoRelated.relatedVideoId,
        slug: videos.slug,
        sortOrder: videoRelated.sortOrder,
      })
      .from(videoRelated)
      .innerJoin(videos, eq(videoRelated.relatedVideoId, videos.id))
      .where(eq(videoRelated.videoId, id))
      .orderBy(asc(videoRelated.sortOrder)),
    db
      .select()
      .from(comments)
      .where(eq(comments.videoId, id))
      .orderBy(asc(comments.sortOrder), asc(comments.id)),
  ]);

  return {
    ...video,
    aliases: aliasRows.map((row) => row.alias),
    categoryIds: categoryRows.map((row) => row.categoryId),
    relatedSlugs: relatedRows.map((row) => row.slug),
    comments: commentRows,
  };
}

export async function listAdminComments() {
  return db
    .select({
      id: comments.id,
      author: comments.author,
      posted: comments.posted,
      body: comments.body,
      likes: comments.likes,
      videoTitle: videos.title,
      videoId: comments.videoId,
    })
    .from(comments)
    .innerJoin(videos, eq(comments.videoId, videos.id))
    .orderBy(asc(videos.title), asc(comments.sortOrder), asc(comments.id));
}

export async function getAdminComment(id: number) {
  const [row] = await db
    .select({
      id: comments.id,
      videoId: comments.videoId,
      author: comments.author,
      avatar: comments.avatar,
      posted: comments.posted,
      body: comments.body,
      likes: comments.likes,
      sortOrder: comments.sortOrder,
      videoTitle: videos.title,
    })
    .from(comments)
    .innerJoin(videos, eq(comments.videoId, videos.id))
    .where(eq(comments.id, id))
    .limit(1);
  return row;
}

export async function categoryHasVideos(id: number) {
  const [row] = await db
    .select({ value: rowCount })
    .from(videoCategories)
    .where(eq(videoCategories.categoryId, id));
  return asCount(row?.value) > 0;
}

export async function channelHasVideos(id: number) {
  const [row] = await db
    .select({ value: rowCount })
    .from(videos)
    .where(eq(videos.channelId, id));
  return asCount(row?.value) > 0;
}
