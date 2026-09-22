"use client";

import { useActionState } from "react";

import { Field, FormError, SubmitButton } from "@/components/admin/form-controls";
import type { ActionState } from "@/app/admin/actions";

type CommentValues = {
  id?: number;
  author?: string;
  avatar?: string;
  posted?: string;
  body?: string;
  likes?: string;
  sortOrder?: number;
};

export function CommentForm({
  action,
  comment,
  submitLabel,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  comment: CommentValues;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      {comment.id ? <input type="hidden" name="id" value={comment.id} /> : null}
      <Field label="Author" name="author" required defaultValue={comment.author} />
      <Field label="Avatar URL" name="avatar" required defaultValue={comment.avatar} />
      <Field label="Posted" name="posted" required defaultValue={comment.posted} />
      <Field label="Likes" name="likes" required defaultValue={comment.likes} />
      <Field
        label="Sort order"
        name="sortOrder"
        type="number"
        defaultValue={comment.sortOrder ?? 0}
      />
      <Field label="Comment" name="body" required textarea rows={4} defaultValue={comment.body} />
      <FormError error={state?.error} />
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
