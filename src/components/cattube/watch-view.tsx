"use client";

import { useState } from "react";

import { RelatedRail } from "@/components/cattube/related-rail";
import { VideoPlayer } from "@/components/cattube/video-player";
import { WatchComments } from "@/components/cattube/watch-comments";
import { WatchMeta } from "@/components/cattube/watch-meta";
import type { Video } from "@/lib/cattube";
import type { WatchVideo } from "@/lib/watch-data";

export function WatchView({
  video,
  related,
  signedIn,
}: {
  video: WatchVideo;
  related: Video[];
  signedIn: boolean;
}) {
  const [theater, setTheater] = useState(false);

  return (
    <div className="w-full px-4 py-4 sm:px-6">
      {theater ? (
        <div className="mb-4">
          <VideoPlayer video={video} theater onTheater={() => setTheater(false)} />
        </div>
      ) : null}
      <div className="mx-auto flex w-full max-w-[1850px] flex-col gap-6 xl:flex-row">
        <div className="min-w-0 flex-1">
          {theater ? null : <VideoPlayer video={video} theater={false} onTheater={() => setTheater(true)} />}
          <WatchMeta key={video.id} video={video} signedIn={signedIn} />
          <WatchComments video={video} />
        </div>
        {theater ? null : <RelatedRail video={video} videos={related} />}
      </div>
    </div>
  );
}
