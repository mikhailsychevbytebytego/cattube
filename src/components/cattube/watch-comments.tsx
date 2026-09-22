import Image from "next/image";

import { ChevronDownIcon } from "@/components/cattube/icons";
import { viewerAvatar } from "@/lib/viewer-avatar";
import type { WatchVideo } from "@/lib/watch-data";

export function WatchComments({ video }: { video: WatchVideo }) {
  return (
    <section className="mt-6">
      <div className="mb-4 flex items-center gap-6">
        <h2 className="text-xl font-semibold">{video.commentCount} Comments</h2>
        <button type="button" className="flex items-center gap-1 text-sm text-ct-text">
          Sort by: Top comments
          <ChevronDownIcon className="h-4 w-4" />
        </button>
      </div>
      <div className="mb-6 flex items-start gap-3">
        {viewerAvatar ? (
          <Image
            src={viewerAvatar}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <span className="h-10 w-10 rounded-full bg-ct-hover" />
        )}
        <p className="flex-1 border-b border-ct-border pb-2 text-sm text-ct-muted">Add a meow...</p>
      </div>
      <ul className="flex flex-col gap-5">
        {video.comments.map((comment) => (
          <li key={comment.id} className="flex gap-3">
            <Image
              src={comment.avatar}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover"
            />
            <div className="min-w-0">
              <p className="text-sm">
                <span className="font-medium">{comment.author}</span>
                <span className="ml-2 text-xs text-ct-muted">{comment.posted}</span>
              </p>
              <p className="mt-1 text-sm leading-5">{comment.text}</p>
              <div className="mt-1 flex items-center gap-3 text-xs text-ct-muted">
                <span>👍 {comment.likes}</span>
                <span>👎</span>
                <button type="button" className="font-medium text-ct-text">
                  Reply
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
