import type { Route } from "next";

export type Video = {
  id: string;
  title: string;
  channel: string;
  verified: boolean;
  views: string;
  uploaded: string;
  duration: string;
  thumbnail: string;
  avatar: string;
  categories: string[];
  aliases?: string[];
};

export function watchHref(id: string): Route {
  return `/watch?v=${encodeURIComponent(id)}` as Route;
}

export function parseDuration(duration: string) {
  const parts = duration.split(":").map((part) => Number(part));
  if (parts.length === 2) {
    const minutes = parts[0] ?? 0;
    const seconds = parts[1] ?? 0;
    return minutes * 60 + seconds;
  }
  if (parts.length === 3) {
    const hours = parts[0] ?? 0;
    const minutes = parts[1] ?? 0;
    const seconds = parts[2] ?? 0;
    return hours * 3600 + minutes * 60 + seconds;
  }
  return 0;
}

export function formatTime(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function feedHref(category: string, query: string): Route {
  const params = new URLSearchParams();
  if (category !== "All") params.set("category", category);
  if (query.trim()) params.set("q", query.trim());
  const search = params.toString();
  return (search ? `/?${search}` : "/") as Route;
}
