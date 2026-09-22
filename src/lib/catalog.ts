import "server-only";

import { and, asc, cosineDistance, desc, eq, ilike, inArray, isNotNull, ne, or } from "drizzle-orm";

import { db } from "@/lib/db";
import type { Video } from "@/lib/cattube";
import type { WatchComment, WatchVideo } from "@/lib/watch-data";
import {
  categories,
  channelSubscriptions,
  channels,
  comments,
  videoAliases,
  videoCategories,
  videoRelated,
  videos,
} from "../../drizzle/schema";

const ALL_CATEGORY = "All";

export { ALL_CATEGORY };

export async function listCategories() {
  const rows = await db
    .select({ name: categories.name })
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
  return [ALL_CATEGORY, ...rows.map((row) => row.name)];
}

const feedSelect = {
  id: videos.id,
  slug: videos.slug,
  title: videos.title,
  views: videos.views,
  uploaded: videos.uploaded,
  duration: videos.duration,
  thumbnail: videos.thumbnail,
  channelName: channels.name,
  channelAvatar: channels.avatar,
  verified: channels.verified,
};

export async function listFeedVideos(options: {
  category: string;
  q: string;
  queryEmbedding?: number[] | null;
}) {
  const query = options.q.trim();
  const categoryFilter = options.category !== ALL_CATEGORY;
  const queryEmbedding = options.queryEmbedding ?? null;

  const filters = [];
  if (categoryFilter) filters.push(eq(categories.name, options.category));
  if (queryEmbedding) {
    filters.push(isNotNull(videos.embedding));
  } else if (query) {
    const pattern = `%${escapeLike(query)}%`;
    filters.push(or(ilike(videos.title, pattern), ilike(channels.name, pattern)));
  }

  const order = queryEmbedding
    ? asc(cosineDistance(videos.embedding, queryEmbedding))
    : asc(videos.id);

  const rows = categoryFilter
    ? await db
        .select(feedSelect)
        .from(videos)
        .innerJoin(channels, eq(videos.channelId, channels.id))
        .innerJoin(videoCategories, eq(videoCategories.videoId, videos.id))
        .innerJoin(categories, eq(videoCategories.categoryId, categories.id))
        .where(and(...filters))
        .orderBy(order)
    : await db
        .select(feedSelect)
        .from(videos)
        .innerJoin(channels, eq(videos.channelId, channels.id))
        .where(filters.length ? and(...filters) : undefined)
        .orderBy(order);

  const categoryMap = await videoCategoryNames(rows.map((row) => row.id));

  return rows.map((row) =>
    toVideo({
      slug: row.slug,
      title: row.title,
      views: row.views,
      uploaded: row.uploaded,
      duration: row.duration,
      thumbnail: row.thumbnail,
      channelName: row.channelName,
      channelAvatar: row.channelAvatar,
      verified: row.verified,
      categories: categoryMap.get(row.id) ?? [],
    }),
  );
}

export async function getWatchVideo(
  id: string | undefined,
): Promise<WatchVideo | undefined> {
  if (!id) return undefined;

  const aliasMatch = await db
    .select({ videoId: videoAliases.videoId })
    .from(videoAliases)
    .where(eq(videoAliases.alias, id))
    .limit(1);

  const [row] = await db
    .select({
      id: videos.id,
      slug: videos.slug,
      title: videos.title,
      views: videos.views,
      uploaded: videos.uploaded,
      duration: videos.duration,
      likes: videos.likes,
      commentCount: videos.commentCount,
      thumbnail: videos.thumbnail,
      poster: videos.poster,
      sourceUrl: videos.sourceUrl,
      description: videos.description,
      tags: videos.tags,
      extraChips: videos.extraChips,
      watchChips: videos.watchChips,
      channelId: videos.channelId,
      channelName: channels.name,
      channelAvatar: channels.avatar,
      verified: channels.verified,
      subscribers: channels.subscribers,
    })
    .from(videos)
    .innerJoin(channels, eq(videos.channelId, channels.id))
    .where(
      aliasMatch[0]
        ? eq(videos.id, aliasMatch[0].videoId)
        : eq(videos.slug, id),
    )
    .limit(1);

  if (!row) return undefined;

  const [categoryMap, aliasMap, commentRows, relatedRows] = await Promise.all([
    videoCategoryNames([row.id]),
    videoAliasNames([row.id]),
    db
      .select()
      .from(comments)
      .where(eq(comments.videoId, row.id))
      .orderBy(asc(comments.sortOrder), asc(comments.id)),
    db
      .select({ slug: videos.slug })
      .from(videoRelated)
      .innerJoin(videos, eq(videoRelated.relatedVideoId, videos.id))
      .where(eq(videoRelated.videoId, row.id))
      .orderBy(asc(videoRelated.sortOrder)),
  ]);

  const videoCategoriesList = categoryMap.get(row.id) ?? [];
  const commentList: WatchComment[] = commentRows.map((comment) => ({
    id: String(comment.id),
    author: comment.author,
    avatar: comment.avatar,
    posted: comment.posted,
    text: comment.body,
    likes: comment.likes,
  }));

  return {
    ...toVideo({
      slug: row.slug,
      title: row.title,
      views: row.views,
      uploaded: row.uploaded,
      duration: row.duration,
      thumbnail: row.thumbnail,
      channelName: row.channelName,
      channelAvatar: row.channelAvatar,
      verified: row.verified,
      categories: videoCategoriesList,
      aliases: aliasMap.get(row.id),
    }),
    channelId: row.channelId,
    subscribed: false,
    subscribers: row.subscribers,
    likes: row.likes,
    description: row.description,
    tags: row.tags,
    commentCount: row.commentCount,
    comments: commentList,
    poster: row.poster ?? undefined,
    sourceUrl: row.sourceUrl,
    relatedOrder: relatedRows.map((item) => item.slug),
    extraChips: row.extraChips,
    watchChips: row.watchChips ?? undefined,
  };
}

export async function listSubscriptionVideos(userId: string) {
  const rows = await db
    .select(feedSelect)
    .from(videos)
    .innerJoin(channels, eq(videos.channelId, channels.id))
    .innerJoin(
      channelSubscriptions,
      eq(channelSubscriptions.channelId, channels.id),
    )
    .where(eq(channelSubscriptions.userId, userId))
    .orderBy(desc(videos.id));

  const categoryMap = await videoCategoryNames(rows.map((row) => row.id));

  return rows.map((row) =>
    toVideo({
      slug: row.slug,
      title: row.title,
      views: row.views,
      uploaded: row.uploaded,
      duration: row.duration,
      thumbnail: row.thumbnail,
      channelName: row.channelName,
      channelAvatar: row.channelAvatar,
      verified: row.verified,
      categories: categoryMap.get(row.id) ?? [],
    }),
  );
}

export async function isSubscribedToChannel(userId: string, channelId: number) {
  const [row] = await db
    .select({ userId: channelSubscriptions.userId })
    .from(channelSubscriptions)
    .where(
      and(
        eq(channelSubscriptions.userId, userId),
        eq(channelSubscriptions.channelId, channelId),
      ),
    )
    .limit(1);

  return Boolean(row);
}

export async function getRelatedVideos(video: WatchVideo) {
  const [current] = await db
    .select({ id: videos.id, embedding: videos.embedding })
    .from(videos)
    .where(eq(videos.slug, video.id))
    .limit(1);

  const distance =
    current?.embedding != null
      ? cosineDistance(videos.embedding, current.embedding)
      : videos.id;

  const others = await db
    .select({
      id: videos.id,
      slug: videos.slug,
      title: videos.title,
      views: videos.views,
      uploaded: videos.uploaded,
      duration: videos.duration,
      thumbnail: videos.thumbnail,
      channelName: channels.name,
      channelAvatar: channels.avatar,
      verified: channels.verified,
    })
    .from(videos)
    .innerJoin(channels, eq(videos.channelId, channels.id))
    .where(
      current?.embedding != null
        ? and(ne(videos.id, current.id), isNotNull(videos.embedding))
        : ne(videos.slug, video.id),
    )
    .orderBy(asc(distance));

  const categoryMap = await videoCategoryNames(others.map((item) => item.id));
  return others.map((item) =>
    toVideo({
      slug: item.slug,
      title: item.title,
      views: item.views,
      uploaded: item.uploaded,
      duration: item.duration,
      thumbnail: item.thumbnail,
      channelName: item.channelName,
      channelAvatar: item.channelAvatar,
      verified: item.verified,
      categories: categoryMap.get(item.id) ?? [],
    }),
  );
}

function toVideo(row: {
  slug: string;
  title: string;
  views: string;
  uploaded: string;
  duration: string;
  thumbnail: string;
  channelName: string;
  channelAvatar: string;
  verified: boolean;
  categories: string[];
  aliases?: string[];
}): Video {
  return {
    id: row.slug,
    title: row.title,
    channel: row.channelName,
    verified: row.verified,
    views: row.views,
    uploaded: row.uploaded,
    duration: row.duration,
    thumbnail: row.thumbnail,
    avatar: row.channelAvatar,
    categories: row.categories,
    aliases: row.aliases,
  };
}

async function videoCategoryNames(videoIds: number[]) {
  const map = new Map<number, string[]>();
  if (videoIds.length === 0) return map;

  const rows = await db
    .select({
      videoId: videoCategories.videoId,
      name: categories.name,
      sortOrder: categories.sortOrder,
    })
    .from(videoCategories)
    .innerJoin(categories, eq(videoCategories.categoryId, categories.id))
    .where(inArray(videoCategories.videoId, videoIds))
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  for (const row of rows) {
    const list = map.get(row.videoId) ?? [];
    list.push(row.name);
    map.set(row.videoId, list);
  }
  return map;
}

async function videoAliasNames(videoIds: number[]) {
  const map = new Map<number, string[]>();
  if (videoIds.length === 0) return map;

  const rows = await db
    .select({
      videoId: videoAliases.videoId,
      alias: videoAliases.alias,
    })
    .from(videoAliases)
    .where(inArray(videoAliases.videoId, videoIds));

  for (const row of rows) {
    const list = map.get(row.videoId) ?? [];
    list.push(row.alias);
    map.set(row.videoId, list);
  }
  return map;
}

function escapeLike(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
}
