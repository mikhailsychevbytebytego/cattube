"use client";

import { useActionState } from "react";

import { Field, FormError, SubmitButton } from "@/components/admin/form-controls";
import type { ActionState } from "@/app/admin/actions";

type ChannelOption = { id: number; name: string };
type CategoryOption = { id: number; name: string };

type VideoValues = {
  id?: number;
  slug?: string;
  title?: string;
  channelId?: number;
  views?: string;
  uploaded?: string;
  duration?: string;
  likes?: string;
  commentCount?: string;
  thumbnail?: string;
  poster?: string | null;
  sourceUrl?: string;
  description?: string;
  tags?: string[];
  extraChips?: string[];
  watchChips?: string[] | null;
  aliases?: string[];
  categoryIds?: number[];
  relatedSlugs?: string[];
};

export function VideoForm({
  action,
  video,
  channels,
  categories,
  submitLabel,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  video?: VideoValues;
  channels: ChannelOption[];
  categories: CategoryOption[];
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-4">
      {video?.id ? <input type="hidden" name="id" value={video.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" name="title" required defaultValue={video?.title} />
        <Field label="Slug" name="slug" required defaultValue={video?.slug} />
        <label className="block text-sm font-medium text-ct-text">
          Channel
          <select
            name="channelId"
            required
            defaultValue={video?.channelId ?? ""}
            className="mt-1 w-full rounded-lg border border-ct-border bg-ct-bg px-3 py-2 text-sm outline-none focus:border-ct-text"
          >
            <option value="" disabled>
              Select a channel
            </option>
            {channels.map((channel) => (
              <option key={channel.id} value={channel.id}>
                {channel.name}
              </option>
            ))}
          </select>
        </label>
        <Field label="Duration" name="duration" required defaultValue={video?.duration} />
        <Field label="Views" name="views" required defaultValue={video?.views} />
        <Field label="Uploaded" name="uploaded" required defaultValue={video?.uploaded} />
        <Field label="Likes" name="likes" required defaultValue={video?.likes} />
        <Field
          label="Comment count"
          name="commentCount"
          required
          defaultValue={video?.commentCount}
        />
        <Field label="Thumbnail URL" name="thumbnail" required defaultValue={video?.thumbnail} />
        <Field label="Poster URL" name="poster" defaultValue={video?.poster} />
        <Field label="Source URL" name="sourceUrl" required defaultValue={video?.sourceUrl} />
      </div>
      <Field
        label="Description"
        name="description"
        required
        textarea
        rows={5}
        defaultValue={video?.description}
      />
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Categories</legend>
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <label key={category.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="categoryId"
                value={category.id}
                defaultChecked={video?.categoryIds?.includes(category.id)}
              />
              {category.name}
            </label>
          ))}
        </div>
      </fieldset>
      <Field
        label="Aliases (one per line)"
        name="aliases"
        textarea
        rows={3}
        defaultValue={video?.aliases?.join("\n")}
      />
      <Field
        label="Tags (one per line)"
        name="tags"
        textarea
        rows={3}
        defaultValue={video?.tags?.join("\n")}
      />
      <Field
        label="Extra chips (one per line)"
        name="extraChips"
        textarea
        rows={2}
        defaultValue={video?.extraChips?.join("\n")}
      />
      <Field
        label="Watch chips (one per line, leave empty to auto-generate)"
        name="watchChips"
        textarea
        rows={3}
        defaultValue={video?.watchChips?.join("\n")}
      />
      <Field
        label="Related video slugs (one per line, in order)"
        name="relatedSlugs"
        textarea
        rows={6}
        defaultValue={video?.relatedSlugs?.join("\n")}
      />
      <FormError error={state?.error} />
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
