import {
  AutoProcessor,
  AutoTokenizer,
  CLIPTextModelWithProjection,
  CLIPVisionModelWithProjection,
  RawImage,
} from "@huggingface/transformers";

export const CLIP_DIMENSIONS = 512;
const CLIP_MODEL = "Xenova/clip-vit-base-patch32";

type ClipVisionPipeline = {
  processor: Awaited<ReturnType<typeof AutoProcessor.from_pretrained>>;
  model: Awaited<ReturnType<typeof CLIPVisionModelWithProjection.from_pretrained>>;
};

type ClipTextPipeline = {
  tokenizer: Awaited<ReturnType<typeof AutoTokenizer.from_pretrained>>;
  model: Awaited<ReturnType<typeof CLIPTextModelWithProjection.from_pretrained>>;
};

let visionPromise: Promise<ClipVisionPipeline> | undefined;
let textPromise: Promise<ClipTextPipeline> | undefined;

async function loadClipVision() {
  visionPromise ??= Promise.all([
    AutoProcessor.from_pretrained(CLIP_MODEL),
    CLIPVisionModelWithProjection.from_pretrained(CLIP_MODEL, {
      dtype: "fp32",
    }),
  ]).then(([processor, model]) => ({ processor, model }));
  return visionPromise;
}

async function loadClipText() {
  textPromise ??= Promise.all([
    AutoTokenizer.from_pretrained(CLIP_MODEL),
    CLIPTextModelWithProjection.from_pretrained(CLIP_MODEL, {
      dtype: "fp32",
    }),
  ]).then(([tokenizer, model]) => ({ tokenizer, model }));
  return textPromise;
}

function l2Normalize(values: number[]) {
  const norm = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
  if (!Number.isFinite(norm) || norm === 0) return values;
  return values.map((value) => value / norm);
}

function toClipVector(data: ArrayLike<number> | undefined, kind: "image" | "text") {
  if (!data) throw new Error(`CLIP returned no ${kind} embedding`);
  const values = Array.from(data, (value) => Number(value));
  if (values.length !== CLIP_DIMENSIONS) {
    throw new Error(`Expected CLIP embedding of ${CLIP_DIMENSIONS} dims, got ${values.length}`);
  }
  return l2Normalize(values);
}

export async function embedThumbnail(imageUrl: string) {
  const { processor, model } = await loadClipVision();
  const image = await RawImage.read(imageUrl);
  const inputs = await processor(image);
  const { image_embeds } = await model(inputs);
  return toClipVector(image_embeds?.data, "image");
}

export async function embedQuery(query: string) {
  const { tokenizer, model } = await loadClipText();
  const inputs = tokenizer([query], { padding: true, truncation: true });
  const { text_embeds } = await model(inputs);
  return toClipVector(text_embeds?.data, "text");
}
