import Link from "next/link";
import { notFound } from "next/navigation";

import { createComment, deleteComment, updateVideo } from "@/app/admin/actions";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { Field, SubmitButton } from "@/components/admin/form-controls";
import { VideoForm } from "@/components/admin/video-form";
import {
  getAdminVideo,
  listAdminCategories,
  listAdminChannels,
} from "@/lib/admin-catalog";
import { adminPath } from "@/lib/admin-routes";
import { env } from "@/lib/env";

export default async function EditVideoPage({
  params,
}: PageProps<"/admin/videos/[id]">) {
  const { id } = await params;
  const videoId = Number(id);
  const [video, channels, categoryRows] = await Promise.all([
    getAdminVideo(videoId),
    listAdminChannels(),
    listAdminCategories(),
  ]);
  if (!video) notFound();

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="mb-4 text-2xl font-semibold">Edit video</h1>
        <VideoForm
          action={updateVideo}
          video={video}
          channels={channels}
          categories={categoryRows}
          submitLabel="Save video"
        />
      </div>
      <section>
        <h2 className="mb-3 text-xl font-semibold">Comments</h2>
        <ul className="mb-6 divide-y divide-ct-border rounded-xl border border-ct-border bg-ct-bg">
          {video.comments.map((comment) => (
            <li key={comment.id} className="flex items-start justify-between gap-3 px-3 py-3">
              <div>
                <p className="text-sm font-medium">{comment.author}</p>
                <p className="text-sm text-ct-muted">{comment.body}</p>
              </div>
              <div className="flex items-center gap-3">
                <Link href={adminPath(`/admin/comments/${comment.id}`)} className="text-sm hover:underline">
                  Edit
                </Link>
                <ConfirmDelete action={deleteComment} id={comment.id} label={comment.author} />
              </div>
            </li>
          ))}
        </ul>
        <form action={createComment} className="grid max-w-xl gap-3">
          <input type="hidden" name="videoId" value={video.id} />
          <Field label="Author" name="author" required />
          <Field
            label="Avatar URL"
            name="avatar"
            required
            defaultValue={env.viewerAvatar}
          />
          <Field label="Posted" name="posted" required defaultValue="just now" />
          <Field label="Likes" name="likes" required defaultValue="0" />
          <Field label="Comment" name="body" required textarea rows={3} />
          <SubmitButton>Add comment</SubmitButton>
        </form>
      </section>
    </div>
  );
}
