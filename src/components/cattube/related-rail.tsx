"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ChevronRightIcon, VerifiedIcon } from "@/components/cattube/icons";
import { watchHref, type Video } from "@/lib/cattube";
import type { WatchVideo } from "@/lib/watch-data";

type RelatedRailProps = {
  video: WatchVideo;
  videos: Video[];
};

export function RelatedRail({ video, videos }: RelatedRailProps) {
  const chips = useMemo(() => {
    if (video.watchChips) return video.watchChips;
    const values = ["All", `From ${video.channel}`, ...video.categories, ...(video.extraChips ?? []), "Related"];
    return [...new Set(values)];
  }, [video]);
  const [selected, setSelected] = useState("All");

  const filtered = videos.filter((item) => {
    if (selected === "All" || selected === "Related") return true;
    if (selected === `From ${video.channel}`) return item.channel === video.channel;
    if (video.categories.includes(selected as (typeof video.categories)[number])) {
      return item.categories.includes(selected as (typeof video.categories)[number]);
    }
    return (
      item.title.toLowerCase().includes(selected.toLowerCase()) ||
      item.categories.some((category) => category.toLowerCase().includes(selected.toLowerCase()))
    );
  });

  return (
    <aside className="w-full shrink-0 xl:w-[402px]">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex min-w-0 gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {chips.map((chip) => {
            const active = chip === selected;
            return (
              <button
                key={chip}
                type="button"
                onClick={() => setSelected(chip)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm whitespace-nowrap ${
                  active ? "bg-ct-text font-medium text-ct-inverted" : "bg-ct-chip text-ct-text hover:bg-ct-hover"
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>
        <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ct-border text-ct-text xl:flex">
          <ChevronRightIcon className="h-5 w-5" />
        </span>
      </div>
      <ul className="flex flex-col gap-2">
        {filtered.map((item) => (
          <li key={item.id}>
            <Link href={watchHref(item.id)} className="flex gap-2 rounded-xl hover:bg-ct-hover">
              <div className="relative w-[168px] shrink-0 overflow-hidden rounded-lg bg-ct-chip">
                <Image
                  src={item.thumbnail}
                  alt=""
                  width={336}
                  height={189}
                  className="aspect-video w-full object-cover"
                />
              </div>
              <div className="min-w-0 py-0.5 pr-1">
                <p className="line-clamp-2 text-sm leading-5 font-medium text-ct-text">{item.title}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-ct-muted">
                  <span className="truncate">{item.channel}</span>
                  {item.verified ? <VerifiedIcon className="h-3 w-3 shrink-0 text-[#909090]" /> : null}
                </p>
                <p className="text-xs text-ct-muted">
                  {item.views} · {item.uploaded}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
