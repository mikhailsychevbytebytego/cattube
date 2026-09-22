import { createVideo } from "@/app/admin/actions";
import { VideoForm } from "@/components/admin/video-form";
import { listAdminCategories, listAdminChannels } from "@/lib/admin-catalog";

export default async function NewVideoPage() {
  const [channels, categoryRows] = await Promise.all([
    listAdminChannels(),
    listAdminCategories(),
  ]);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">New video</h1>
      <VideoForm
        action={createVideo}
        channels={channels}
        categories={categoryRows}
        submitLabel="Create video"
      />
    </div>
  );
}
