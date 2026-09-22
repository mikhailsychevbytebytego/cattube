import { createChannel } from "@/app/admin/actions";
import { ChannelForm } from "@/components/admin/channel-form";

export default function NewChannelPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">New channel</h1>
      <ChannelForm action={createChannel} submitLabel="Create channel" />
    </div>
  );
}
