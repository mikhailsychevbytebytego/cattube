"use client";

import Image from "next/image";
import { useOptimistic, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { toggleSubscription } from "@/app/(site)/actions";
import {
  ChevronDownIcon,
  ClipIcon,
  DislikeIcon,
  LikeIcon,
  MoreIcon,
  PawIcon,
  SaveIcon,
  ShareIcon,
  VerifiedIcon,
} from "@/components/cattube/icons";
import { watchHref } from "@/lib/cattube";
import type { WatchVideo } from "@/lib/watch-data";

export function WatchMeta({ video, signedIn }: { video: WatchVideo; signedIn: boolean }) {
  const [liked, setLiked] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [subscribed, setSubscribed] = useOptimistic(video.subscribed);

  async function subscribeAction(formData: FormData) {
    if (signedIn) setSubscribed(!subscribed);
    await toggleSubscription(formData);
  }

  return (
    <section className="mt-3">
      <h1 className="text-xl font-semibold tracking-tight text-ct-text">{video.title}</h1>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Image
            src={video.avatar}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover"
          />
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-sm font-medium">
              {video.channel}
              {video.verified ? <VerifiedIcon className="h-3.5 w-3.5 text-[#909090]" /> : null}
            </p>
            <p className="text-xs text-ct-muted">{video.subscribers}</p>
          </div>
          <form action={subscribeAction}>
            <input type="hidden" name="channelId" value={video.channelId} />
            <input type="hidden" name="returnTo" value={watchHref(video.id)} />
            <SubscribeButton subscribed={subscribed} />
          </form>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-full bg-ct-chip">
            <button
              type="button"
              onClick={() => setLiked((value) => !value)}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-ct-hover"
            >
              <LikeIcon className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
              {video.likes}
            </button>
            <span className="w-px self-stretch bg-black/10" />
            <button type="button" className="px-3 py-2 hover:bg-ct-hover" aria-label="Dislike">
              <DislikeIcon className="h-5 w-5" />
            </button>
          </div>
          <ActionButton icon={<ShareIcon className="h-5 w-5" />} label="Share" />
          <ActionButton icon={<ClipIcon className="h-5 w-5" />} label="Clip" />
          <ActionButton icon={<SaveIcon className="h-5 w-5" />} label="Save" />
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-ct-chip hover:bg-ct-hover"
            aria-label="More actions"
          >
            <MoreIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-ct-chip px-3 py-3 text-sm">
        <p className="font-medium text-ct-text">
          {video.views} · {video.uploaded}
          {video.tags.map((tag) => (
            <span key={tag} className="ml-1 font-medium text-[#065fd4]">
              #{tag}
            </span>
          ))}
        </p>
        <p className={`mt-1 whitespace-pre-wrap text-ct-text ${expanded ? "" : "line-clamp-2"}`}>
          {video.description}
        </p>
        <button
          type="button"
          className="mt-1 flex items-center gap-1 font-medium"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Show less" : "Show more"}
          <ChevronDownIcon className={`h-4 w-4 ${expanded ? "rotate-180" : ""}`} />
        </button>
      </div>
    </section>
  );
}

function SubscribeButton({ subscribed }: { subscribed: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`ml-2 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium disabled:opacity-70 ${
        subscribed ? "bg-ct-chip text-ct-text" : "bg-ct-text text-ct-inverted"
      }`}
    >
      <PawIcon className="h-4 w-4" />
      {subscribed ? "Subscribed" : "Subscribe"}
    </button>
  );
}

function ActionButton({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="flex items-center gap-2 rounded-full bg-ct-chip px-4 py-2 text-sm hover:bg-ct-hover"
    >
      {icon}
      {label}
    </button>
  );
}
