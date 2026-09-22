import { notFound } from "next/navigation";

import { updateChannel } from "@/app/admin/actions";
import { ChannelForm } from "@/components/admin/channel-form";
import { getAdminChannel } from "@/lib/admin-catalog";

export default async function EditChannelPage({
  params,
}: PageProps<"/admin/channels/[id]">) {
  const { id } = await params;
  const channel = await getAdminChannel(Number(id));
  if (!channel) notFound();

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Edit channel</h1>
      <ChannelForm action={updateChannel} channel={channel} submitLabel="Save channel" />
    </div>
  );
}
