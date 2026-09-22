import Image from "next/image";
import Link from "next/link";

import { VerifiedIcon } from "@/components/cattube/icons";
import { watchHref, type Video } from "@/lib/cattube";

export function VideoGrid({
  videos,
  emptyMessage = "No meows match that search. Try another category, or just type “cat”.",
}: {
  videos: Video[];
  emptyMessage?: string;
}) {
  if (videos.length === 0) {
    return <p className="py-16 text-center text-sm text-ct-muted">{emptyMessage}</p>;
  }

  return (
    <ul className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {videos.map((video, index) => (
        <li key={video.id}>
          <VideoCard video={video} priority={index < 4} />
        </li>
      ))}
    </ul>
  );
}

function VideoCard({ video, priority }: { video: Video; priority?: boolean }) {
  return (
    <article>
      <Link href={watchHref(video.id)} className="group block">
        <div className="overflow-hidden rounded-xl bg-ct-chip">
          <Image
            src={video.thumbnail}
            alt=""
            width={640}
            height={360}
            priority={priority}
            className="aspect-video w-full object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
          />
        </div>
        <div className="mt-3 flex gap-3">
          <Image
            src={video.avatar}
            alt=""
            width={36}
            height={36}
            className="mt-0.5 h-9 w-9 shrink-0 rounded-full object-cover"
          />
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-sm leading-5 font-medium text-ct-text">
              {video.title}
            </h3>
            <p className="mt-1 flex items-center gap-1 text-xs text-ct-muted">
              <span className="truncate">{video.channel}</span>
              {video.verified ? (
                <VerifiedIcon className="h-3.5 w-3.5 shrink-0 text-[#909090]" />
              ) : null}
            </p>
            <p className="text-xs text-ct-muted">
              {video.views} · {video.uploaded}
            </p>
          </div>
        </div>
      </Link>
    </article>
  );
}
