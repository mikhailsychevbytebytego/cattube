import { viewerAvatar } from "@/lib/viewer-avatar";

function requiredPublicUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export const env = {
  siteUrl: requiredPublicUrl(),
  databaseUrl: process.env.DATABASE_URL,
  viewerAvatar,
} as const;
