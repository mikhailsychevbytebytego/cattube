import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  vector,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const channels = pgTable("channels", {
  id: bigint("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  avatar: text("avatar").notNull(),
  verified: boolean("verified").notNull().default(false),
  subscribers: text("subscribers").notNull(),
  ...timestamps,
}).enableRLS();

export const categories = pgTable(
  "categories",
  {
    id: bigint("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
    name: text("name").notNull().unique(),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (table) => [index("categories_sort_order_idx").on(table.sortOrder)],
).enableRLS();

export const videos = pgTable(
  "videos",
  {
    id: bigint("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    channelId: bigint("channel_id", { mode: "number" })
      .notNull()
      .references(() => channels.id, { onDelete: "restrict" }),
    views: text("views").notNull(),
    uploaded: text("uploaded").notNull(),
    duration: text("duration").notNull(),
    likes: text("likes").notNull(),
    commentCount: text("comment_count").notNull(),
    thumbnail: text("thumbnail").notNull(),
    poster: text("poster"),
    sourceUrl: text("source_url").notNull(),
    description: text("description").notNull(),
    tags: text("tags").array().notNull().default([]),
    extraChips: text("extra_chips").array().notNull().default([]),
    watchChips: text("watch_chips").array(),
    embedding: vector("embedding", { dimensions: 512 }),
    ...timestamps,
  },
  (table) => [
    index("videos_channel_id_idx").on(table.channelId),
    index("videos_embedding_hnsw_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
  ],
).enableRLS();

export const videoAliases = pgTable(
  "video_aliases",
  {
    id: bigint("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
    videoId: bigint("video_id", { mode: "number" })
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    alias: text("alias").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("video_aliases_alias_idx").on(table.alias),
    index("video_aliases_video_id_idx").on(table.videoId),
  ],
).enableRLS();

export const videoCategories = pgTable(
  "video_categories",
  {
    videoId: bigint("video_id", { mode: "number" })
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    categoryId: bigint("category_id", { mode: "number" })
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
  },
  (table) => [
    primaryKey({ columns: [table.videoId, table.categoryId] }),
    index("video_categories_category_id_idx").on(table.categoryId),
  ],
).enableRLS();

export const comments = pgTable(
  "comments",
  {
    id: bigint("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
    videoId: bigint("video_id", { mode: "number" })
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    author: text("author").notNull(),
    avatar: text("avatar").notNull(),
    posted: text("posted").notNull(),
    body: text("body").notNull(),
    likes: text("likes").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (table) => [index("comments_video_id_idx").on(table.videoId)],
).enableRLS();

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  admin: boolean("admin").notNull().default(false),
  ...timestamps,
}).enableRLS();

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
).enableRLS();

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    ...timestamps,
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
).enableRLS();

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
).enableRLS();

export const channelSubscriptions = pgTable(
  "channel_subscriptions",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    channelId: bigint("channel_id", { mode: "number" })
      .notNull()
      .references(() => channels.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.channelId] }),
    index("channel_subscriptions_channel_id_idx").on(table.channelId),
  ],
).enableRLS();

export const videoRelated = pgTable(
  "video_related",
  {
    videoId: bigint("video_id", { mode: "number" })
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    relatedVideoId: bigint("related_video_id", { mode: "number" })
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.videoId, table.relatedVideoId] }),
    index("video_related_related_video_id_idx").on(table.relatedVideoId),
  ],
).enableRLS();

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  subscriptions: many(channelSubscriptions),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const channelSubscriptionsRelations = relations(
  channelSubscriptions,
  ({ one }) => ({
    user: one(user, {
      fields: [channelSubscriptions.userId],
      references: [user.id],
    }),
    channel: one(channels, {
      fields: [channelSubscriptions.channelId],
      references: [channels.id],
    }),
  }),
);

export const channelsRelations = relations(channels, ({ many }) => ({
  videos: many(videos),
  subscriptions: many(channelSubscriptions),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  videoLinks: many(videoCategories),
}));

export const videosRelations = relations(videos, ({ one, many }) => ({
  channel: one(channels, {
    fields: [videos.channelId],
    references: [channels.id],
  }),
  categoryLinks: many(videoCategories),
  aliases: many(videoAliases),
  comments: many(comments),
  relatedLinks: many(videoRelated, { relationName: "relatedFrom" }),
}));

export const videoAliasesRelations = relations(videoAliases, ({ one }) => ({
  video: one(videos, {
    fields: [videoAliases.videoId],
    references: [videos.id],
  }),
}));

export const videoCategoriesRelations = relations(videoCategories, ({ one }) => ({
  video: one(videos, {
    fields: [videoCategories.videoId],
    references: [videos.id],
  }),
  category: one(categories, {
    fields: [videoCategories.categoryId],
    references: [categories.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  video: one(videos, {
    fields: [comments.videoId],
    references: [videos.id],
  }),
}));

export const videoRelatedRelations = relations(videoRelated, ({ one }) => ({
  video: one(videos, {
    fields: [videoRelated.videoId],
    references: [videos.id],
    relationName: "relatedFrom",
  }),
  relatedVideo: one(videos, {
    fields: [videoRelated.relatedVideoId],
    references: [videos.id],
    relationName: "relatedTo",
  }),
}));
