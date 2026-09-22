import type { Route } from "next";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";

export type AuthSession = NonNullable<Awaited<ReturnType<typeof getSession>>>;

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export function isAdmin(session: Awaited<ReturnType<typeof getSession>>) {
  return Boolean(session?.user.admin);
}

export function safeCallbackPath(value: string | undefined, fallback: Route = "/") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value as Route;
}
