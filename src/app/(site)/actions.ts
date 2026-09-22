"use server";

import { and, eq } from "drizzle-orm";
import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db, schema } from "@/lib/db";
import { getSession } from "@/lib/session";

const { channelSubscriptions } = schema;

export async function toggleSubscription(formData: FormData) {
  const channelId = Number(formData.get("channelId"));
  const returnTo = String(formData.get("returnTo") ?? "/");
  if (!Number.isFinite(channelId) || channelId <= 0) {
    throw new Error("Channel is missing");
  }

  const session = await getSession();
  if (!session) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(returnTo || "/")}` as Route);
  }

  const [existing] = await db
    .select({ userId: channelSubscriptions.userId })
    .from(channelSubscriptions)
    .where(
      and(
        eq(channelSubscriptions.userId, session.user.id),
        eq(channelSubscriptions.channelId, channelId),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .delete(channelSubscriptions)
      .where(
        and(
          eq(channelSubscriptions.userId, session.user.id),
          eq(channelSubscriptions.channelId, channelId),
        ),
      );
  } else {
    await db.insert(channelSubscriptions).values({
      userId: session.user.id,
      channelId,
    });
  }

  revalidatePath("/");
  revalidatePath("/subscriptions");
  revalidatePath("/watch");
}
