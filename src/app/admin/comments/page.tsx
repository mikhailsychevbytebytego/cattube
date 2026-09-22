import Link from "next/link";

import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { AdminTable } from "@/components/admin/form-controls";
import { deleteComment } from "@/app/admin/actions";
import { listAdminComments } from "@/lib/admin-catalog";
import { adminPath } from "@/lib/admin-routes";

export default async function AdminCommentsPage() {
  const rows = await listAdminComments();

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Comments</h1>
      <AdminTable columns={["Author", "Video", "Comment", ""]}>
        {rows.map((comment) => (
          <tr key={comment.id} className="border-t border-ct-border bg-ct-bg">
            <td className="px-3 py-2 font-medium">{comment.author}</td>
            <td className="px-3 py-2">
              <Link href={adminPath(`/admin/videos/${comment.videoId}`)} className="hover:underline">
                {comment.videoTitle}
              </Link>
            </td>
            <td className="max-w-md truncate px-3 py-2 text-ct-muted">{comment.body}</td>
            <td className="px-3 py-2">
              <div className="flex items-center gap-3">
                <Link href={adminPath(`/admin/comments/${comment.id}`)} className="text-sm hover:underline">
                  Edit
                </Link>
                <ConfirmDelete action={deleteComment} id={comment.id} label={comment.author} />
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
