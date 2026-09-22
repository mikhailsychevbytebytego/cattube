import type { Video } from "@/lib/cattube";

export type WatchComment = {
  id: string;
  author: string;
  avatar: string;
  posted: string;
  text: string;
  likes: string;
};

export type WatchDetails = {
  channelId: number;
  subscribed: boolean;
  subscribers: string;
  likes: string;
  description: string;
  tags: string[];
  commentCount: string;
  comments: WatchComment[];
  poster?: string;
  sourceUrl: string;
  relatedOrder?: string[];
  extraChips?: string[];
  watchChips?: string[];
};

export type WatchVideo = Video & WatchDetails;
