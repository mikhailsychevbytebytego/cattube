import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { fal } from "@fal-ai/client";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import {
  categories,
  channels,
  comments,
  videoAliases,
  videoCategories,
  videoRelated,
  videos,
} from "../drizzle/schema";
import { embedThumbnail } from "../src/lib/clip-embed";

const CATEGORY_NAMES = [
  "Kittens",
  "Funny Cats",
  "Cat Compilations",
  "Cat ASMR",
  "Cats Cooking",
  "Gaming Cats",
  "Dramatic Cats",
  "Sleepy Cats",
  "Smart Cats",
] as const;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CHECKPOINT_PATH = resolve(process.cwd(), ".cache/catalog-generation.json");
const ENV_PATH = resolve(process.cwd(), ".env");
const IMAGE_CONCURRENCY = 3;
const VIDEO_CONCURRENCY = 2;
const LLM_MODELS = ["google/gemini-3.5-flash", "google/gemini-2.5-flash"] as const;

type PostgresClientOptions = NonNullable<Parameters<typeof postgres>[1]> & {
  max_pipeline?: number;
};

type CatalogPersona = {
  name: string;
  avatarPrompt: string;
};

type CatalogChannel = {
  name: string;
  slug: string;
  verified: boolean;
  subscribers: string;
  avatarPrompt: string;
};

type CatalogComment = {
  author: string;
  posted: string;
  text: string;
  likes: string;
};

type CatalogVideo = {
  slug: string;
  title: string;
  channelSlug: string;
  categories: string[];
  views: string;
  uploaded: string;
  likes: string;
  commentCount: string;
  tags: string[];
  extraChips: string[];
  watchChips: string[];
  thumbnailPrompt: string;
  description: string;
  comments: CatalogComment[];
  relatedSlugs: string[];
};

type CatalogDraft = {
  viewerAvatarPrompt: string;
  personas: CatalogPersona[];
  channels: CatalogChannel[];
  videos: CatalogVideo[];
};

type ImageRecord = {
  falUrl: string;
  cdnUrl: string;
};

type VideoRecord = {
  falUrl: string;
  sourceUrl: string;
  duration: string;
};

type Checkpoint = {
  catalog?: CatalogDraft;
  images: Record<string, ImageRecord>;
  videos: Record<string, VideoRecord>;
  inserted?: boolean;
};

function loadDotEnv() {
  try {
    const text = readFileSync(ENV_PATH, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(?:"([^"]*)"|'([^']*)'|(.+))$/);
      if (!match?.[1]) continue;
      if (process.env[match[1]] !== undefined) continue;
      process.env[match[1]] = match[2] ?? match[3] ?? match[4] ?? "";
    }
  } catch {
    // Use already-exported environment variables.
  }
}

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

function loadDatabaseUrl() {
  return requiredEnv("DATABASE_URL");
}

function emptyCheckpoint(): Checkpoint {
  return { images: {}, videos: {} };
}

function loadCheckpoint(): Checkpoint {
  try {
    return {
      ...emptyCheckpoint(),
      ...(JSON.parse(readFileSync(CHECKPOINT_PATH, "utf8")) as Checkpoint),
    };
  } catch {
    return emptyCheckpoint();
  }
}

function saveCheckpoint(checkpoint: Checkpoint) {
  mkdirSync(dirname(CHECKPOINT_PATH), { recursive: true });
  writeFileSync(CHECKPOINT_PATH, `${JSON.stringify(checkpoint, null, 2)}\n`);
}

function upsertEnvValue(name: string, value: string) {
  let text = "";
  try {
    text = readFileSync(ENV_PATH, "utf8");
  } catch {
    text = "";
  }
  const line = `${name}=${value}`;
  const pattern = new RegExp(`^${name}=.*$`, "m");
  const next = pattern.test(text) ? text.replace(pattern, line) : `${text.replace(/\s*$/, "")}\n${line}\n`;
  writeFileSync(ENV_PATH, next);
  process.env[name] = value;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDuration(totalSeconds: number) {
  const safe = Math.max(1, Math.round(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function parseJsonObject(text: string) {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("LLM did not return JSON");
  return JSON.parse(trimmed.slice(start, end + 1)) as CatalogDraft;
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>) {
  const results = new Array<R>(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      const item = items[index];
      if (item === undefined) continue;
      results[index] = await fn(item, index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

function personaKey(name: string) {
  return `persona:${slugify(name)}`;
}

function channelKey(slug: string) {
  return `channel:${slug}`;
}

function thumbKey(slug: string) {
  return `thumb:${slug}`;
}

function validateCatalog(draft: CatalogDraft) {
  if (!draft.viewerAvatarPrompt) throw new Error("Missing viewer avatar prompt");
  if (!Array.isArray(draft.personas) || draft.personas.length < 12) {
    throw new Error("Need at least 12 commenter personas");
  }
  if (draft.channels.length !== 12) throw new Error("Need exactly 12 channels");
  if (draft.videos.length !== 12) throw new Error("Need exactly 12 videos");

  const channelSlugs = new Set<string>();
  for (const channel of draft.channels) {
    if (!SLUG_PATTERN.test(channel.slug)) throw new Error(`Invalid channel slug ${channel.slug}`);
    if (channelSlugs.has(channel.slug)) throw new Error(`Duplicate channel slug ${channel.slug}`);
    channelSlugs.add(channel.slug);
    if (!channel.name || !channel.subscribers || !channel.avatarPrompt) {
      throw new Error(`Incomplete channel ${channel.slug}`);
    }
  }

  const personaNames = new Set(draft.personas.map((persona) => persona.name));
  if (personaNames.size !== draft.personas.length) throw new Error("Duplicate persona names");

  const videoSlugs = new Set<string>();
  for (const video of draft.videos) {
    if (!SLUG_PATTERN.test(video.slug)) throw new Error(`Invalid video slug ${video.slug}`);
    if (videoSlugs.has(video.slug)) throw new Error(`Duplicate video slug ${video.slug}`);
    videoSlugs.add(video.slug);
    if (!channelSlugs.has(video.channelSlug)) {
      throw new Error(`Video ${video.slug} references unknown channel ${video.channelSlug}`);
    }
    if (!video.title || !video.description || !video.thumbnailPrompt) {
      throw new Error(`Incomplete video ${video.slug}`);
    }
    if (!video.categories.length || video.categories.some((name) => !CATEGORY_NAMES.includes(name as (typeof CATEGORY_NAMES)[number]))) {
      throw new Error(`Video ${video.slug} has invalid categories`);
    }
    if (video.comments.length !== 3) throw new Error(`Video ${video.slug} needs 3 comments`);
    for (const comment of video.comments) {
      if (!personaNames.has(comment.author)) {
        throw new Error(`Comment author ${comment.author} is not a persona`);
      }
    }
  }

  for (const video of draft.videos) {
    for (const related of video.relatedSlugs) {
      if (related === video.slug || !videoSlugs.has(related)) {
        throw new Error(`Video ${video.slug} has invalid related slug ${related}`);
      }
    }
  }
}

async function generateCatalogDraft(): Promise<CatalogDraft> {
  const prompt = `Create a JSON catalog for CatTube, a playful YouTube parody about cats.

Return ONLY JSON with this shape:
{
  "viewerAvatarPrompt": "string, photorealistic cat person avatar, no text",
  "personas": [{ "name": "CamelCaseHandle", "avatarPrompt": "string" }],
  "channels": [{ "name": "string", "slug": "kebab-case", "verified": true, "subscribers": "2.1M subscribers", "avatarPrompt": "string" }],
  "videos": [{
    "slug": "kebab-case",
    "title": "YouTube-style cat video title",
    "channelSlug": "must match a channel.slug",
    "categories": ["one or two names from the allowed list"],
    "views": "2.1M views",
    "uploaded": "2 weeks ago",
    "likes": "120K",
    "commentCount": "4,892",
    "tags": ["#Kittens"],
    "extraChips": ["More from this channel"],
    "watchChips": ["From Channel", "Kittens"],
    "thumbnailPrompt": "detailed 16:9 photorealistic thumbnail of the scene, no text, no logos, no UI",
    "description": "2-4 sentences. This is also the motion prompt for image-to-video: describe visible action, camera move, lighting.",
    "comments": [{ "author": "must match a persona name", "posted": "2 weeks ago", "text": "short comment", "likes": "1.1K" }],
    "relatedSlugs": ["the other 11 video slugs in recommended-watch order"]
  }]
}

Rules:
- Exactly 12 unique channels and 12 unique videos. One video per channel.
- At least 16 unique commenter personas.
- Each video has exactly 3 comments from the persona pool.
- Categories must be chosen from: ${CATEGORY_NAMES.join(", ")}.
- Cover all 9 categories across the 12 videos.
- Slugs are lowercase letters, numbers, and hyphens only.
- Display strings stay human (views, likes, subscribers, uploaded).
- Keep the tone cute, funny, and YouTube-like. No real people.`;

  let lastError: unknown;
  for (const model of LLM_MODELS) {
    try {
      console.log(`Generating catalog text with ${model}`);
      const result = await fal.subscribe("fal-ai/any-llm", {
        input: {
          model,
          prompt,
          system_prompt:
            "You write valid JSON only. No markdown. No commentary. Follow the schema exactly.",
          temperature: 0.7,
        },
      });
      const output =
        typeof result.data === "object" && result.data && "output" in result.data
          ? String(result.data.output)
          : JSON.stringify(result.data);
      const draft = parseJsonObject(output);
      validateCatalog(draft);
      console.log(`Catalog text ready via ${model}`);
      return draft;
    } catch (error) {
      lastError = error;
      console.warn(`LLM model ${model} failed: ${error instanceof Error ? error.message : error}`);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Could not generate catalog text");
}

async function generateFalImage(prompt: string, imageSize: "landscape_16_9" | "square") {
  const result = await fal.subscribe("openai/gpt-image-2.5/flare/text-to-image", {
    input: {
      prompt,
      image_size: imageSize,
      quality: "high",
      output_format: "jpeg",
    },
  });
  const url = result.data.images[0]?.url;
  if (!url) throw new Error("FAL image response missing url");
  return url;
}

async function generateFalVideo(prompt: string, imageUrl: string) {
  const result = await fal.subscribe("minimax/h3-max-turbo/image-to-video", {
    input: {
      prompt,
      image_url: imageUrl,
      duration: 5,
      resolution: "768P",
      prompt_expansion_mode: "balanced",
    },
  });
  const url = result.data.video?.url;
  if (!url) throw new Error("FAL video response missing url");
  return url;
}

type CloudflareConfig = {
  accountId: string;
  token: string;
  imagesHash?: string;
};

async function cloudflareJson(
  config: CloudflareConfig,
  path: string,
  init?: RequestInit,
) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.token}`,
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });
  const body = (await response.json()) as {
    success: boolean;
    errors?: { message?: string }[];
    result?: unknown;
  };
  if (!response.ok || !body.success) {
    const message = body.errors?.map((error) => error.message).filter(Boolean).join("; ");
    throw new Error(message || `Cloudflare ${path} failed (${response.status})`);
  }
  return body.result;
}

async function resolveCloudflareConfig(): Promise<CloudflareConfig> {
  const token = requiredEnv("CLOUDFLARE_API_TOKEN");
  let accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  if (!accountId) {
    const accounts = (await cloudflareJson({ accountId: "", token }, "/accounts")) as {
      id: string;
    }[];
    accountId = accounts[0]?.id;
  }
  if (!accountId) throw new Error("CLOUDFLARE_ACCOUNT_ID is not set and no accounts were returned");
  return {
    accountId,
    token,
    imagesHash: process.env.CLOUDFLARE_IMAGES_ACCOUNT_HASH?.trim() || undefined,
  };
}

function publicImageUrl(config: CloudflareConfig, imageId: string, variants?: string[]) {
  const fromVariants = variants?.find((url) => url.endsWith("/public")) ?? variants?.[0];
  if (fromVariants) return fromVariants;
  if (!config.imagesHash) {
    throw new Error("Cloudflare Images response had no public variant and CLOUDFLARE_IMAGES_ACCOUNT_HASH is unset");
  }
  return `https://imagedelivery.net/${config.imagesHash}/${imageId}/public`;
}

async function uploadImage(config: CloudflareConfig, falUrl: string, id: string) {
  const form = new FormData();
  form.set("url", falUrl);
  form.set("requireSignedURLs", "false");
  form.set("id", id);
  try {
    const result = (await cloudflareJson(config, "/accounts/" + config.accountId + "/images/v1", {
      method: "POST",
      body: form,
    })) as { id: string; variants?: string[] };
    return publicImageUrl(config, result.id, result.variants);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!/already exist|duplicate/i.test(message)) throw error;
    const existing = (await cloudflareJson(
      config,
      `/accounts/${config.accountId}/images/v1/${encodeURIComponent(id)}`,
    )) as { id: string; variants?: string[] };
    return publicImageUrl(config, existing.id, existing.variants);
  }
}

async function copyStream(config: CloudflareConfig, falUrl: string, name: string) {
  const created = (await cloudflareJson(config, `/accounts/${config.accountId}/stream/copy`, {
    method: "POST",
    body: JSON.stringify({
      input: falUrl,
      url: falUrl,
      meta: { name },
      requireSignedURLs: false,
    }),
  })) as {
    uid: string;
    readyToStream?: boolean;
    duration?: number;
    playback?: { hls?: string };
  };

  let current = created;
  for (let attempt = 0; attempt < 60 && !current.readyToStream; attempt += 1) {
    await new Promise((resolveWait) => setTimeout(resolveWait, 5000));
    current = (await cloudflareJson(
      config,
      `/accounts/${config.accountId}/stream/${created.uid}`,
    )) as typeof created;
  }

  if (!current.readyToStream || !current.playback?.hls) {
    throw new Error(`Stream ${name} was not ready to play`);
  }

  return {
    sourceUrl: current.playback.hls,
    duration: formatDuration(typeof current.duration === "number" && current.duration > 0 ? current.duration : 5),
  };
}

async function ensureImage(
  checkpoint: Checkpoint,
  key: string,
  prompt: string,
  size: "landscape_16_9" | "square",
  cloudflare: CloudflareConfig,
) {
  const existing = checkpoint.images[key];
  if (existing?.cdnUrl) return existing;

  console.log(`Image ${key}`);
  const falUrl = existing?.falUrl ?? (await generateFalImage(prompt, size));
  checkpoint.images[key] = { falUrl, cdnUrl: existing?.cdnUrl ?? "" };
  saveCheckpoint(checkpoint);

  const cdnUrl = await uploadImage(cloudflare, falUrl, `cattube/${key}`);
  checkpoint.images[key] = { falUrl, cdnUrl };
  saveCheckpoint(checkpoint);
  return checkpoint.images[key]!;
}

async function ensureVideo(
  checkpoint: Checkpoint,
  slug: string,
  description: string,
  thumbnailUrl: string,
  cloudflare: CloudflareConfig,
) {
  const existing = checkpoint.videos[slug];
  if (existing?.sourceUrl) return existing;

  console.log(`Video ${slug}`);
  const falUrl = existing?.falUrl ?? (await generateFalVideo(description, thumbnailUrl));
  checkpoint.videos[slug] = {
    falUrl,
    sourceUrl: existing?.sourceUrl ?? "",
    duration: existing?.duration ?? "0:05",
  };
  saveCheckpoint(checkpoint);

  const stream = await copyStream(cloudflare, falUrl, slug);
  checkpoint.videos[slug] = { falUrl, ...stream };
  saveCheckpoint(checkpoint);
  return checkpoint.videos[slug]!;
}

async function wipeCatalog(db: ReturnType<typeof drizzle>) {
  console.log("Wiping catalog tables");
  await db.delete(videoRelated);
  await db.delete(videoAliases);
  await db.delete(videoCategories);
  await db.delete(comments);
  await db.delete(videos);
  await db.delete(channels);
  await db.delete(categories);
}

async function insertCatalog(
  db: ReturnType<typeof drizzle>,
  draft: CatalogDraft,
  checkpoint: Checkpoint,
) {
  const insertedCategories = await db
    .insert(categories)
    .values(CATEGORY_NAMES.map((name, index) => ({ name, sortOrder: index + 1 })))
    .returning({ id: categories.id, name: categories.name });
  const categoryId = new Map(insertedCategories.map((row) => [row.name, row.id]));

  const insertedChannels = await db
    .insert(channels)
    .values(
      draft.channels.map((channel) => {
        const image = checkpoint.images[channelKey(channel.slug)];
        if (!image?.cdnUrl) throw new Error(`Missing channel image ${channel.slug}`);
        return {
          name: channel.name,
          slug: channel.slug,
          avatar: image.cdnUrl,
          verified: channel.verified,
          subscribers: channel.subscribers,
        };
      }),
    )
    .returning({ id: channels.id, slug: channels.slug });
  const channelId = new Map(insertedChannels.map((row) => [row.slug, row.id]));

  const embeddings = new Map<string, number[]>();
  await mapLimit(draft.videos, IMAGE_CONCURRENCY, async (video) => {
    const thumb = checkpoint.images[thumbKey(video.slug)];
    if (!thumb?.cdnUrl) throw new Error(`Missing thumbnail ${video.slug}`);
    console.log(`CLIP ${video.slug}`);
    embeddings.set(video.slug, await embedThumbnail(thumb.cdnUrl));
  });

  const insertedVideos = await db
    .insert(videos)
    .values(
      draft.videos.map((video) => {
        const channel = channelId.get(video.channelSlug);
        const thumb = checkpoint.images[thumbKey(video.slug)];
        const media = checkpoint.videos[video.slug];
        const embedding = embeddings.get(video.slug);
        if (!channel) throw new Error(`Missing channel ${video.channelSlug}`);
        if (!thumb?.cdnUrl) throw new Error(`Missing thumbnail ${video.slug}`);
        if (!media?.sourceUrl) throw new Error(`Missing source ${video.slug}`);
        if (!embedding) throw new Error(`Missing embedding ${video.slug}`);
        return {
          slug: video.slug,
          title: video.title,
          channelId: channel,
          views: video.views,
          uploaded: video.uploaded,
          duration: media.duration,
          likes: video.likes,
          commentCount: video.commentCount,
          thumbnail: thumb.cdnUrl,
          poster: thumb.cdnUrl,
          sourceUrl: media.sourceUrl,
          description: video.description,
          tags: video.tags,
          extraChips: video.extraChips,
          watchChips: video.watchChips.length ? video.watchChips : null,
          embedding,
        };
      }),
    )
    .returning({ id: videos.id, slug: videos.slug });
  const videoId = new Map(insertedVideos.map((row) => [row.slug, row.id]));

  await db.insert(videoCategories).values(
    draft.videos.flatMap((video) => {
      const id = videoId.get(video.slug);
      if (!id) throw new Error(`Missing video ${video.slug}`);
      return video.categories.map((name) => {
        const category = categoryId.get(name);
        if (!category) throw new Error(`Missing category ${name}`);
        return { videoId: id, categoryId: category };
      });
    }),
  );

  await db.insert(comments).values(
    draft.videos.flatMap((video) => {
      const id = videoId.get(video.slug);
      if (!id) throw new Error(`Missing video ${video.slug}`);
      return video.comments.map((comment, index) => {
        const persona = checkpoint.images[personaKey(comment.author)];
        if (!persona?.cdnUrl) throw new Error(`Missing persona image ${comment.author}`);
        return {
          videoId: id,
          author: comment.author,
          avatar: persona.cdnUrl,
          posted: comment.posted,
          body: comment.text,
          likes: comment.likes,
          sortOrder: index,
        };
      });
    }),
  );

  const relatedRows = draft.videos.flatMap((video) => {
    const id = videoId.get(video.slug);
    if (!id) throw new Error(`Missing video ${video.slug}`);
    return video.relatedSlugs.flatMap((slug, index) => {
      const relatedId = videoId.get(slug);
      return relatedId ? [{ videoId: id, relatedVideoId: relatedId, sortOrder: index }] : [];
    });
  });
  if (relatedRows.length) await db.insert(videoRelated).values(relatedRows);
}

async function main() {
  loadDotEnv();
  requiredEnv("FAL_KEY");
  fal.config({ credentials: process.env.FAL_KEY });

  const checkpoint = loadCheckpoint();
  if (checkpoint.inserted) {
    console.log("Previous generation is already in the database. Starting a new run.");
    checkpoint.catalog = undefined;
    checkpoint.images = {};
    checkpoint.videos = {};
    checkpoint.inserted = false;
    saveCheckpoint(checkpoint);
  }

  const clientOptions: PostgresClientOptions = {
    prepare: false,
    max: 1,
    max_pipeline: 0,
    ssl: "require",
  };
  const client = postgres(loadDatabaseUrl(), clientOptions);
  const db = drizzle({ client, schema: { videos } });

  try {
    await wipeCatalog(db);

    if (!checkpoint.catalog) {
      checkpoint.catalog = await generateCatalogDraft();
      saveCheckpoint(checkpoint);
    } else {
      validateCatalog(checkpoint.catalog);
      console.log("Resuming from checkpoint catalog");
    }

    const draft = checkpoint.catalog;
    const cloudflare = await resolveCloudflareConfig();

    const imageJobs: { key: string; prompt: string; size: "landscape_16_9" | "square" }[] = [
      {
        key: "viewer",
        prompt: `${draft.viewerAvatarPrompt}. Photorealistic circular avatar, no text.`,
        size: "square",
      },
      ...draft.channels.map((channel) => ({
        key: channelKey(channel.slug),
        prompt: `${channel.avatarPrompt}. Photorealistic channel avatar, no text.`,
        size: "square" as const,
      })),
      ...draft.personas.map((persona) => ({
        key: personaKey(persona.name),
        prompt: `${persona.avatarPrompt}. Photorealistic commenter avatar, no text.`,
        size: "square" as const,
      })),
      ...draft.videos.map((video) => ({
        key: thumbKey(video.slug),
        prompt: `${video.thumbnailPrompt}. 16:9 YouTube thumbnail photograph, no text, no logos, no UI chrome.`,
        size: "landscape_16_9" as const,
      })),
    ];

    await mapLimit(imageJobs, IMAGE_CONCURRENCY, async (job) => {
      await ensureImage(checkpoint, job.key, job.prompt, job.size, cloudflare);
    });

    const viewer = checkpoint.images.viewer?.cdnUrl;
    if (!viewer) throw new Error("Viewer avatar is missing");
    upsertEnvValue("NEXT_PUBLIC_VIEWER_AVATAR", viewer);

    await mapLimit(draft.videos, VIDEO_CONCURRENCY, async (video) => {
      const thumb = checkpoint.images[thumbKey(video.slug)];
      if (!thumb?.cdnUrl) throw new Error(`Missing thumbnail ${video.slug}`);
      await ensureVideo(checkpoint, video.slug, video.description, thumb.cdnUrl, cloudflare);
    });

    await insertCatalog(db, draft, checkpoint);
    checkpoint.inserted = true;
    saveCheckpoint(checkpoint);

    console.log(
      JSON.stringify({
        channels: draft.channels.length,
        categories: CATEGORY_NAMES.length,
        videos: draft.videos.length,
        comments: draft.videos.reduce((sum, video) => sum + video.comments.length, 0),
        viewerAvatar: viewer,
      }),
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
