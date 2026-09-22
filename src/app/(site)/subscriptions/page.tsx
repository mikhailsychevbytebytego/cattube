import type { Route } from "next";
import { redirect } from "next/navigation";

import { VideoGrid } from "@/components/cattube/video-grid";
import { listSubscriptionVideos } from "@/lib/catalog";
import { getSession } from "@/lib/session";

export default async function SubscriptionsPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in?callbackUrl=/subscriptions" as Route);

  const videos = await listSubscriptionVideos(session.user.id);

  return (
    <main className="min-h-full w-full px-4 pt-3 pb-12 sm:px-6 xl:pr-8">
      <h1 className="mb-4 text-xl font-semibold text-ct-text">Subscriptions</h1>
      <VideoGrid
        videos={videos}
        emptyMessage="Subscribe to a channel on a watch page to fill this feed."
      />
    </main>
  );
}
