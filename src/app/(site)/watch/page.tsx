import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { WatchView } from "@/components/cattube/watch-view";
import { getRelatedVideos, getWatchVideo, isSubscribedToChannel } from "@/lib/catalog";
import { getSession } from "@/lib/session";

export async function generateMetadata({
  searchParams,
}: PageProps<"/watch">): Promise<Metadata> {
  const params = await searchParams;
  const video = await getWatchVideo(first(params.v));
  if (!video) return { title: "Video" };
  return {
    title: video.title,
    description: video.description,
  };
}

export default async function WatchPage({ searchParams }: PageProps<"/watch">) {
  const params = await searchParams;
  const video = await getWatchVideo(first(params.v));
  if (!video) notFound();

  const session = await getSession();
  const subscribed = session
    ? await isSubscribedToChannel(session.user.id, video.channelId)
    : false;

  return (
    <WatchView
      key={video.id}
      video={{ ...video, subscribed }}
      related={await getRelatedVideos(video)}
      signedIn={Boolean(session)}
    />
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
