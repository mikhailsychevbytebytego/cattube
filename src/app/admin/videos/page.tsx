import Link from "next/link";

import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { AdminTable } from "@/components/admin/form-controls";
import { deleteVideo } from "@/app/admin/actions";
import { listAdminVideos } from "@/lib/admin-catalog";
import { adminPath } from "@/lib/admin-routes";

export default async function AdminVideosPage() {
  const rows = await listAdminVideos();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Videos</h1>
        <Link
          href={adminPath("/admin/videos/new")}
          className="rounded-full bg-ct-text px-4 py-2 text-sm font-medium text-ct-inverted"
        >
          New video
        </Link>
      </div>
      <AdminTable columns={["Title", "Slug", "Channel", "Views", ""]}>
        {rows.map((video) => (
          <tr key={video.id} className="border-t border-ct-border bg-ct-bg">
            <td className="px-3 py-2">
              <Link href={adminPath(`/admin/videos/${video.id}`)} className="font-medium hover:underline">
                {video.title}
              </Link>
            </td>
            <td className="px-3 py-2 text-ct-muted">{video.slug}</td>
            <td className="px-3 py-2">{video.channelName}</td>
            <td className="px-3 py-2">{video.views}</td>
            <td className="px-3 py-2">
              <ConfirmDelete action={deleteVideo} id={video.id} label={video.title} />
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
