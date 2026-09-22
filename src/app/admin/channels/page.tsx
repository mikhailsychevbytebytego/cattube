import Link from "next/link";

import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { AdminTable } from "@/components/admin/form-controls";
import { deleteChannel } from "@/app/admin/actions";
import { listAdminChannels } from "@/lib/admin-catalog";
import { adminPath } from "@/lib/admin-routes";

export default async function AdminChannelsPage() {
  const rows = await listAdminChannels();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Channels</h1>
        <Link
          href={adminPath("/admin/channels/new")}
          className="rounded-full bg-ct-text px-4 py-2 text-sm font-medium text-ct-inverted"
        >
          New channel
        </Link>
      </div>
      <AdminTable columns={["Name", "Slug", "Subscribers", "Verified", ""]}>
        {rows.map((channel) => (
          <tr key={channel.id} className="border-t border-ct-border bg-ct-bg">
            <td className="px-3 py-2">
              <Link href={adminPath(`/admin/channels/${channel.id}`)} className="font-medium hover:underline">
                {channel.name}
              </Link>
            </td>
            <td className="px-3 py-2 text-ct-muted">{channel.slug}</td>
            <td className="px-3 py-2">{channel.subscribers}</td>
            <td className="px-3 py-2">{channel.verified ? "Yes" : "No"}</td>
            <td className="px-3 py-2">
              <ConfirmDelete action={deleteChannel} id={channel.id} label={channel.name} />
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
