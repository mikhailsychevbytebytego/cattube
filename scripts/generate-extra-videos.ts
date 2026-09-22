import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { fal } from "@fal-ai/client";
import { max } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import {
  categories,
  channels,
  comments,
  videoCategories,
  videos,
} from "../drizzle/schema";
import { embedThumbnail } from "../src/lib/clip-embed";

const CHECKPOINT_PATH = resolve(process.cwd(), ".cache/extra-videos.json");
const ENV_PATH = resolve(process.cwd(), ".env");
const IMAGE_CONCURRENCY = 3;
const VIDEO_CONCURRENCY = 2;
const EXTRA_COUNT = 20;
const LLM_MODELS = ["google/gemini-3.5-flash", "google/gemini-2.5-flash"] as const;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const TOPICS = [
  {
    id: "space",
    category: "Space Cats",
    seed: "a cat astronaut adventure on a tiny rocket or moon base",
  },
  {
    id: "cooking",
    category: "Cats Cooking",
    seed: "a cat chef plating a ridiculous gourmet meal",
  },
  {
    id: "sports",
    category: "Sports Cats",
    seed: "a cat athlete in a packed championship moment",
  },
  {
    id: "music",
    category: "Music Cats",
    seed: "a cat jazz or rock performance on a lit stage",
  },
  {
    id: "mystery",
    category: "Mystery Cats",
    seed: "a cat detective inspecting a clue with a magnifying glass",
  },
  {
    id: "fashion",
    category: "Fashion Cats",
    seed: "a cat model working a dramatic runway or editorial set",
  },
  {
    id: "heist",
    category: "Heist Cats",
    seed: "cats in turtlenecks cracking a vault or sneaking past lasers",
  },
  {
    id: "superhero",
    category: "Superhero Cats",
    seed: "a caped cat leaping between rooftops to save the day",
  },
  {
    id: "spooky",
    category: "Spooky Cats",
    seed: "a brave cat exploring a cute haunted mansion at night",
  },
  {
    id: "science",
    category: "Science Cats",
    seed: "a cat scientist with bubbling beakers in a chaotic lab",
  },
] as const;

const STYLES = [
  {
    id: "cgi",
    label: "3D CGI",
    prompt:
      "high-end 3D CGI still, Pixar-quality fur, subsurface scattering, studio render lighting, not live action, not photographed",
  },
  {
    id: "cartoon",
    label: "2D Cartoon",
    prompt:
      "2D Saturday-morning cartoon frame, bold ink outlines, flat cel shading, painted background, not photoreal",
  },
  {
    id: "noir",
    label: "Film Noir",
    prompt:
      "1940s black-and-white film noir still, hard shadows, venetian-blind light, silver grain, monochrome, no color",
  },
  {
    id: "watercolor",
    label: "Watercolor",
    prompt:
      "traditional watercolor illustration, wet-on-wet pigment blooms, visible paper texture, soft edges, no photorealism",
  },
  {
    id: "pixel",
    label: "Pixel Art",
    prompt:
      "16-bit SNES-era pixel art, crisp pixels, limited palette, chunky sprites, no photorealism, no blur",
  },
  {
    id: "clay",
    label: "Claymation",
    prompt:
      "claymation stop-motion still, fingerprints in plasticine, miniature practical set, tactile clay fur",
  },
  {
    id: "anime",
    label: "Anime",
    prompt:
      "Japanese anime still, sharp linework, dramatic cel shading, vivid sakuga lighting, not live action",
  },
  {
    id: "vhs",
    label: "Retro VHS",
    prompt:
      "1980s VHS live-action capture, CRT color bleed, soft tracking noise, period film look, no readable text or timestamps",
  },
  {
    id: "papercut",
    label: "Paper Cutout",
    prompt:
      "layered paper-cut stop-motion, visible paper fibers, craft shadows, cut-paper characters, not painted digitally",
  },
  {
    id: "cinematic",
    label: "Cinematic Live Action",
    prompt:
      "photoreal cinematic live action, anamorphic lens, shallow depth of field, movie-still lighting",
  },
] as const;

type Topic = (typeof TOPICS)[number];
type Style = (typeof STYLES)[number];

type PostgresClientOptions = NonNullable<Parameters<typeof postgres>[1]> & {
  max_pipeline?: number;
};

type Assignment = {
  topicId: Topic["id"];
  styleId: Style["id"];
};

type ExtraComment = {
  author: string;
  posted: string;
  text: string;
  likes: string;
};

type ExtraChannel = {
  name: string;
  slug: string;
  verified: boolean;
  subscribers: string;
  avatarPrompt: string;
};

type ExtraVideo = {
  slug: string;
  title: string;
  channelSlug: string;
  views: string;
  uploaded: string;
  likes: string;
  commentCount: string;
  tags: string[];
  extraChips: string[];
  watchChips: string[];
  thumbnailPrompt: string;
  description: string;
  comments: ExtraComment[];
};

type ExtraDraft = {
  channels: ExtraChannel[];
  videos: ExtraVideo[];
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
  assignments?: Assignment[];
  catalog?: ExtraDraft;
  images: Record<string, ImageRecord>;
  videos: Record<string, VideoRecord>;
  inserted?: boolean;
};

type Persona = {
  name: string;
  avatar: string;
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

function shuffle<T>(items: T[]) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    const current = next[index];
    const other = next[swap];
    if (current === undefined || other === undefined) continue;
    next[index] = other;
    next[swap] = current;
  }
  return next;
}

function topicById(id: string) {
  const topic = TOPICS.find((item) => item.id === id);
  if (!topic) throw new Error(`Unknown topic ${id}`);
  return topic;
}

function styleById(id: string) {
  const style = STYLES.find((item) => item.id === id);
  if (!style) throw new Error(`Unknown style ${id}`);
  return style;
}

function pickAssignments(): Assignment[] {
  const topics = shuffle([...TOPICS]);
  const styles = shuffle([...STYLES]);
  const used = new Set<string>();
  const pairs: Assignment[] = [];

  for (const [index, topic] of topics.entries()) {
    const style = styles[index];
    if (!style) continue;
    pairs.push({ topicId: topic.id, styleId: style.id });
    used.add(`${topic.id}:${style.id}`);
  }

  const leftovers: Assignment[] = [];
  for (const topic of TOPICS) {
    for (const style of STYLES) {
      const key = `${topic.id}:${style.id}`;
      if (used.has(key)) continue;
      leftovers.push({ topicId: topic.id, styleId: style.id });
    }
  }

  for (const pair of shuffle(leftovers)) {
    if (pairs.length >= EXTRA_COUNT) break;
    pairs.push(pair);
  }

  return shuffle(pairs).slice(0, EXTRA_COUNT);
}

function parseJsonObject(text: string) {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("LLM did not return JSON");
  return JSON.parse(trimmed.slice(start, end + 1)) as ExtraDraft;
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

function channelKey(slug: string) {
  return `channel:${slug}`;
}

function thumbKey(slug: string) {
  return `thumb:${slug}`;
}

function uniqueSlug(base: string, reserved: Set<string>) {
  let slug = SLUG_PATTERN.test(base) ? base : slugify(base);
  if (!slug) slug = "extra-cat-video";
  if (!reserved.has(slug)) {
    reserved.add(slug);
    return slug;
  }
  let suffix = 2;
  while (reserved.has(`${slug}-${suffix}`)) suffix += 1;
  const next = `${slug}-${suffix}`;
  reserved.add(next);
  return next;
}

function validateDraft(
  draft: ExtraDraft,
  assignments: Assignment[],
  reservedVideoSlugs: Set<string>,
  reservedChannelSlugs: Set<string>,
  personaNames: Set<string>,
) {
  if (draft.channels.length !== EXTRA_COUNT) {
    throw new Error(`Need exactly ${EXTRA_COUNT} channels`);
  }
  if (draft.videos.length !== EXTRA_COUNT) {
    throw new Error(`Need exactly ${EXTRA_COUNT} videos`);
  }
  if (assignments.length !== EXTRA_COUNT) {
    throw new Error(`Need exactly ${EXTRA_COUNT} assignments`);
  }

  const channelSlugs = new Set<string>();
  draft.channels = draft.channels.map((channel) => {
    const slug = uniqueSlug(channel.slug, reservedChannelSlugs);
    if (channelSlugs.has(slug)) throw new Error(`Duplicate channel slug ${slug}`);
    channelSlugs.add(slug);
    if (!channel.name || !channel.subscribers || !channel.avatarPrompt) {
      throw new Error(`Incomplete channel ${slug}`);
    }
    return { ...channel, slug };
  });

  const videoSlugs = new Set<string>();
  draft.videos = draft.videos.map((video, index) => {
    const assignment = assignments[index];
    if (!assignment) throw new Error(`Missing assignment for video ${index}`);
    const topic = topicById(assignment.topicId);
    const style = styleById(assignment.styleId);
    const slug = uniqueSlug(video.slug, reservedVideoSlugs);
    if (videoSlugs.has(slug)) throw new Error(`Duplicate video slug ${slug}`);
    videoSlugs.add(slug);

    const channel = draft.channels[index];
    if (!channel) throw new Error(`Missing channel for video ${slug}`);

    if (!video.title || !video.description || !video.thumbnailPrompt) {
      throw new Error(`Incomplete video ${slug}`);
    }
    if (video.comments.length !== 3) throw new Error(`Video ${slug} needs 3 comments`);
    const pool = [...personaNames];
    video.comments = video.comments.map((comment, commentIndex) => ({
      ...comment,
      author: personaNames.has(comment.author)
        ? comment.author
        : pool[commentIndex % pool.length] ?? comment.author,
    }));
    for (const comment of video.comments) {
      if (!personaNames.has(comment.author)) {
        throw new Error(`Comment author ${comment.author} is not a known persona`);
      }
    }

    return {
      ...video,
      slug,
      channelSlug: channel.slug,
      extraChips: [...new Set([style.label, topic.category, ...video.extraChips])],
      watchChips: [...new Set([`From ${channel.name}`, topic.category, style.label, ...video.watchChips])],
      tags: [...new Set([`#${style.id}`, `#${topic.id}`, ...video.tags])],
    };
  });
}

async function generateDraft(
  assignments: Assignment[],
  personaNames: string[],
  reservedVideoSlugs: Set<string>,
  reservedChannelSlugs: Set<string>,
) {
  const comboLines = assignments
    .map((assignment, index) => {
      const topic = topicById(assignment.topicId);
      const style = styleById(assignment.styleId);
      return `${index + 1}. TOPIC ${topic.category} (${topic.seed}) + STYLE ${style.label} (${style.prompt})`;
    })
    .join("\n");

  const prompt = `Create extra CatTube videos. Return ONLY JSON with this shape:
{
  "channels": [{ "name": "string", "slug": "kebab-case", "verified": true, "subscribers": "840K subscribers", "avatarPrompt": "string" }],
  "videos": [{
    "slug": "kebab-case",
    "title": "YouTube-style cat video title that hints at the visual style",
    "channelSlug": "must match the same-index channel slug",
    "views": "2.1M views",
    "uploaded": "2 weeks ago",
    "likes": "120K",
    "commentCount": "4,892",
    "tags": ["#SpaceCats"],
    "extraChips": ["More from this channel"],
    "watchChips": ["From Channel"],
    "thumbnailPrompt": "detailed 16:9 scene description, no text, no logos, no UI",
    "description": "2-4 sentences. Also the motion prompt for image-to-video: visible action, camera move, lighting.",
    "comments": [{ "author": "must be from the persona list", "posted": "2 weeks ago", "text": "short comment", "likes": "1.1K" }]
  }]
}

Assignments — videos[i] and channels[i] MUST match row i+1:
${comboLines}

Rules:
- Exactly ${EXTRA_COUNT} unique channels and ${EXTRA_COUNT} unique videos. One video per channel, same index.
- Each thumbnailPrompt must describe the assigned topic scene AND the assigned visual style.
- Each channel avatarPrompt must be a cat-themed avatar in that same visual style.
- Comments authors must be chosen from: ${personaNames.join(", ")}.
- Exactly 3 comments per video.
- Do not use these reserved video slugs: ${[...reservedVideoSlugs].join(", ") || "(none)"}.
- Do not use these reserved channel slugs: ${[...reservedChannelSlugs].join(", ") || "(none)"}.
- Slugs are lowercase letters, numbers, and hyphens only.
- Display strings stay human (views, likes, subscribers, uploaded).
- Keep the tone cute, funny, and YouTube-like. No real people.`;

  let lastError: unknown;
  for (const model of LLM_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      console.log(`Generating extra catalog text with ${model} (attempt ${attempt})`);
      const result = await fal.subscribe("fal-ai/any-llm", {
        input: {
          model,
          prompt,
          system_prompt:
            "You write valid JSON only. No markdown. No commentary. Follow the schema exactly.",
          temperature: 0.85,
        },
      });
      const output =
        typeof result.data === "object" && result.data && "output" in result.data
          ? String(result.data.output)
          : JSON.stringify(result.data);
      const draft = parseJsonObject(output);
      validateDraft(
        draft,
        assignments,
        new Set(reservedVideoSlugs),
        new Set(reservedChannelSlugs),
        new Set(personaNames),
      );
      console.log(`Extra catalog text ready via ${model}`);
      return draft;
    } catch (error) {
      lastError = error;
      console.warn(`LLM model ${model} attempt ${attempt} failed: ${error instanceof Error ? error.message : error}`);
    }
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Could not generate extra catalog text");
}

function falErrorDetail(error: unknown) {
  if (error && typeof error === "object" && "body" in error) {
    try {
      return JSON.stringify((error as { body: unknown }).body);
    } catch {
      // Fall through to the message.
    }
  }
  return error instanceof Error ? error.message : String(error);
}

async function withRetries<T>(label: string, fn: () => Promise<T>, attempts = 3) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(`${label} attempt ${attempt} failed: ${falErrorDetail(error)}`);
      await new Promise((resolveWait) => setTimeout(resolveWait, 1500 * attempt));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`${label} failed`);
}

async function generateFalImage(prompt: string, imageSize: "landscape_16_9" | "square") {
  const result = await withRetries(`FAL image`, async () =>
    fal.subscribe("openai/gpt-image-2.5/flare/text-to-image", {
      input: {
        prompt,
        image_size: imageSize,
        quality: "high",
        output_format: "jpeg",
      },
    }),
  );
  const url = result.data.images[0]?.url;
  if (!url) throw new Error("FAL image response missing url");
  return url;
}

async function generateFalVideo(prompt: string, imageUrl: string) {
  const result = await withRetries(`FAL video`, async () =>
    fal.subscribe("minimax/h3-max-turbo/image-to-video", {
      input: {
        prompt,
        image_url: imageUrl,
        duration: 5,
        resolution: "768P",
        prompt_expansion_mode: "balanced",
      },
    }),
  );
  const url = result.data.video?.url;
  if (!url) throw new Error("FAL video response missing url");
  return url;
}

type CloudflareConfig = {
  accountId: string;
  token: string;
  imagesHash?: string;
};

async function cloudflareJson(config: CloudflareConfig, path: string, init?: RequestInit) {
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
    const accounts = (await cloudflareJson({ accountId: "", token }, "/accounts")) as { id: string }[];
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

async function ensureCategories(
  db: ReturnType<typeof drizzle>,
  names: string[],
) {
  const existing = await db
    .select({ id: categories.id, name: categories.name, sortOrder: categories.sortOrder })
    .from(categories);
  const byName = new Map(existing.map((row) => [row.name, row.id]));
  const [maxRow] = await db.select({ value: max(categories.sortOrder) }).from(categories);
  let sortOrder = maxRow?.value ?? 0;

  const missing = names.filter((name) => !byName.has(name));
  if (missing.length) {
    const inserted = await db
      .insert(categories)
      .values(
        missing.map((name) => {
          sortOrder += 1;
          return { name, sortOrder };
        }),
      )
      .returning({ id: categories.id, name: categories.name });
    for (const row of inserted) byName.set(row.name, row.id);
  }

  return byName;
}

async function insertExtras(
  db: ReturnType<typeof drizzle>,
  draft: ExtraDraft,
  assignments: Assignment[],
  checkpoint: Checkpoint,
  personas: Persona[],
) {
  const categoryNames = [...new Set(assignments.map((item) => topicById(item.topicId).category))];
  const categoryId = await ensureCategories(db, categoryNames);
  const personaAvatar = new Map(personas.map((persona) => [persona.name, persona.avatar]));

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
    draft.videos.map((video, index) => {
      const id = videoId.get(video.slug);
      const assignment = assignments[index];
      if (!id || !assignment) throw new Error(`Missing video ${video.slug}`);
      const category = categoryId.get(topicById(assignment.topicId).category);
      if (!category) throw new Error(`Missing category for ${video.slug}`);
      return { videoId: id, categoryId: category };
    }),
  );

  await db.insert(comments).values(
    draft.videos.flatMap((video) => {
      const id = videoId.get(video.slug);
      if (!id) throw new Error(`Missing video ${video.slug}`);
      return video.comments.map((comment, index) => {
        const avatar = personaAvatar.get(comment.author);
        if (!avatar) throw new Error(`Missing persona avatar ${comment.author}`);
        return {
          videoId: id,
          author: comment.author,
          avatar,
          posted: comment.posted,
          body: comment.text,
          likes: comment.likes,
          sortOrder: index,
        };
      });
    }),
  );
}

async function main() {
  loadDotEnv();
  requiredEnv("FAL_KEY");
  fal.config({ credentials: process.env.FAL_KEY });

  const checkpoint = loadCheckpoint();
  if (checkpoint.inserted) {
    console.log("Extra videos are already inserted. Delete .cache/extra-videos.json to generate another batch.");
    return;
  }

  const clientOptions: PostgresClientOptions = {
    prepare: false,
    max: 1,
    max_pipeline: 0,
    ssl: "require",
  };
  const client = postgres(requiredEnv("DATABASE_URL"), clientOptions);
  const db = drizzle({ client });

  try {
    const existingVideos = await db.select({ slug: videos.slug }).from(videos);
    const existingChannels = await db.select({ slug: channels.slug }).from(channels);
    const existingComments = await db
      .select({ author: comments.author, avatar: comments.avatar })
      .from(comments);
    const personas = [
      ...new Map(existingComments.map((row) => [row.author, { name: row.author, avatar: row.avatar }])).values(),
    ];
    if (personas.length < 3) throw new Error("Need existing comment personas to reuse");

    const reservedVideoSlugs = new Set(existingVideos.map((row) => row.slug));
    const reservedChannelSlugs = new Set(existingChannels.map((row) => row.slug));

    if (!checkpoint.assignments || checkpoint.assignments.length !== EXTRA_COUNT) {
      checkpoint.assignments = pickAssignments();
      checkpoint.catalog = undefined;
      saveCheckpoint(checkpoint);
    }

    console.log(
      "Assignments:\n" +
        checkpoint.assignments
          .map((item, index) => {
            const topic = topicById(item.topicId);
            const style = styleById(item.styleId);
            return `${index + 1}. ${style.label} × ${topic.category}`;
          })
          .join("\n"),
    );

    if (!checkpoint.catalog) {
      checkpoint.catalog = await generateDraft(
        checkpoint.assignments,
        personas.map((persona) => persona.name),
        reservedVideoSlugs,
        reservedChannelSlugs,
      );
      saveCheckpoint(checkpoint);
    } else {
      validateDraft(
        checkpoint.catalog,
        checkpoint.assignments,
        new Set(reservedVideoSlugs),
        new Set(reservedChannelSlugs),
        new Set(personas.map((persona) => persona.name)),
      );
      console.log("Resuming from extra-video checkpoint catalog");
    }

    const draft = checkpoint.catalog;
    const assignments = checkpoint.assignments;
    const cloudflare = await resolveCloudflareConfig();

    const imageJobs = draft.videos.flatMap((video, index) => {
      const assignment = assignments[index];
      const channel = draft.channels[index];
      if (!assignment || !channel) throw new Error(`Missing assignment/channel for ${video.slug}`);
      const style = styleById(assignment.styleId);
      const topic = topicById(assignment.topicId);
      return [
        {
          key: channelKey(channel.slug),
          prompt: `${channel.avatarPrompt}. ${style.prompt}. Square channel avatar of a cat, no text, no logos.`,
          size: "square" as const,
        },
        {
          key: thumbKey(video.slug),
          prompt: `${video.thumbnailPrompt}. Topic: ${topic.seed}. ${style.prompt}. 16:9 thumbnail, no text, no logos, no UI chrome.`,
          size: "landscape_16_9" as const,
        },
      ];
    });

    await mapLimit(imageJobs, IMAGE_CONCURRENCY, async (job) => {
      await ensureImage(checkpoint, job.key, job.prompt, job.size, cloudflare);
    });

    await mapLimit(draft.videos, VIDEO_CONCURRENCY, async (video, index) => {
      const assignment = assignments[index];
      const thumb = checkpoint.images[thumbKey(video.slug)];
      if (!assignment) throw new Error(`Missing assignment for ${video.slug}`);
      if (!thumb?.cdnUrl) throw new Error(`Missing thumbnail ${video.slug}`);
      const style = styleById(assignment.styleId);
      await ensureVideo(
        checkpoint,
        video.slug,
        `${video.description} Keep the exact ${style.label} look of the source image.`,
        thumb.cdnUrl,
        cloudflare,
      );
    });

    await insertExtras(db, draft, assignments, checkpoint, personas);
    checkpoint.inserted = true;
    saveCheckpoint(checkpoint);

    console.log(
      JSON.stringify(
        {
          videos: draft.videos.length,
          channels: draft.channels.length,
          comments: draft.videos.reduce((sum, video) => sum + video.comments.length, 0),
          combinations: assignments.map((item) => `${styleById(item.styleId).label} × ${topicById(item.topicId).category}`),
        },
        null,
        2,
      ),
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
