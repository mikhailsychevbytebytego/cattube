"use client";

import { useActionState } from "react";

import { Checkbox, Field, FormError, SubmitButton } from "@/components/admin/form-controls";
import type { ActionState } from "@/app/admin/actions";

type ChannelValues = {
  id?: number;
  name?: string;
  slug?: string;
  avatar?: string;
  verified?: boolean;
  subscribers?: string;
};

export function ChannelForm({
  action,
  channel,
  submitLabel,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  channel?: ChannelValues;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      {channel?.id ? <input type="hidden" name="id" value={channel.id} /> : null}
      <Field label="Name" name="name" required defaultValue={channel?.name} />
      <Field label="Slug" name="slug" required defaultValue={channel?.slug} />
      <Field label="Avatar URL" name="avatar" required defaultValue={channel?.avatar} />
      <Field
        label="Subscribers"
        name="subscribers"
        required
        defaultValue={channel?.subscribers}
      />
      <Checkbox label="Verified" name="verified" defaultChecked={channel?.verified} />
      <FormError error={state?.error} />
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
