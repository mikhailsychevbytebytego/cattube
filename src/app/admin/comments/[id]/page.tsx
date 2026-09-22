import { notFound } from "next/navigation";

import { updateComment } from "@/app/admin/actions";
import { CommentForm } from "@/components/admin/comment-form";
import { getAdminComment } from "@/lib/admin-catalog";

export default async function EditCommentPage({
  params,
}: PageProps<"/admin/comments/[id]">) {
  const { id } = await params;
  const comment = await getAdminComment(Number(id));
  if (!comment) notFound();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold">Edit comment</h1>
      <p className="mb-4 text-sm text-ct-muted">On {comment.videoTitle}</p>
      <CommentForm action={updateComment} comment={comment} submitLabel="Save comment" />
    </div>
  );
}
