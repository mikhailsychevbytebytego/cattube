"use client";

import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";

import {
  ClosedCaptionsIcon,
  FullscreenIcon,
  PauseIcon,
  PlayIcon,
  SettingsIcon,
  TheaterIcon,
  VolumeIcon,
} from "@/components/cattube/icons";
import { formatTime, parseDuration } from "@/lib/cattube";
import type { WatchVideo } from "@/lib/watch-data";

type VideoPlayerProps = {
  video: WatchVideo;
  theater: boolean;
  onTheater: () => void;
};

export function VideoPlayer({ video, theater, onTheater }: VideoPlayerProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLVideoElement>(null);
  const labeledDuration = parseDuration(video.duration);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [muted, setMuted] = useState(false);
  const [mediaDuration, setMediaDuration] = useState(labeledDuration);
  const poster = video.poster ?? video.thumbnail;
  const sourceUrl = video.sourceUrl;
  const duration = mediaDuration || labeledDuration;
  const progress = duration === 0 ? 0 : (current / duration) * 100;

  useEffect(() => {
    const node = mediaRef.current;
    if (!node || !sourceUrl) return undefined;

    let hls: Hls | undefined;
    let cancelled = false;

    async function tryAutoplay(media: HTMLVideoElement) {
      if (cancelled) return;
      try {
        await media.play();
      } catch {
        media.muted = true;
        setMuted(true);
        try {
          await media.play();
        } catch {
          // Browser still blocked playback; the play button remains available.
        }
      }
    }

    if (node.canPlayType("application/vnd.apple.mpegurl")) {
      node.src = sourceUrl;
      void tryAutoplay(node);
    } else if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true });
      hls.loadSource(sourceUrl);
      hls.attachMedia(node);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        void tryAutoplay(node);
      });
    } else {
      node.src = sourceUrl;
      void tryAutoplay(node);
    }

    return () => {
      cancelled = true;
      hls?.destroy();
      node.removeAttribute("src");
      node.load();
    };
  }, [sourceUrl]);

  useEffect(() => {
    const node = mediaRef.current;
    if (!node) return undefined;
    const media = node;

    function onTime() {
      setCurrent(media.currentTime);
    }
    function onMeta() {
      if (Number.isFinite(media.duration) && media.duration > 0) {
        setMediaDuration(media.duration);
      }
    }
    function onPlay() {
      setPlaying(true);
    }
    function onPause() {
      setPlaying(false);
    }
    function onEnded() {
      setPlaying(false);
      setCurrent(media.duration || duration);
    }

    media.addEventListener("timeupdate", onTime);
    media.addEventListener("durationchange", onMeta);
    media.addEventListener("loadedmetadata", onMeta);
    media.addEventListener("play", onPlay);
    media.addEventListener("pause", onPause);
    media.addEventListener("ended", onEnded);
    return () => {
      media.removeEventListener("timeupdate", onTime);
      media.removeEventListener("durationchange", onMeta);
      media.removeEventListener("loadedmetadata", onMeta);
      media.removeEventListener("play", onPlay);
      media.removeEventListener("pause", onPause);
      media.removeEventListener("ended", onEnded);
    };
  }, [duration]);

  useEffect(() => {
    const node = mediaRef.current;
    if (node) node.muted = muted;
  }, [muted]);

  function seek(clientX: number, target: HTMLButtonElement) {
    const node = mediaRef.current;
    const rect = target.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const next = ratio * duration;
    setCurrent(next);
    if (node) node.currentTime = next;
  }

  async function togglePlay() {
    const node = mediaRef.current;
    if (!node || !sourceUrl) return;
    if (node.paused) await node.play();
    else node.pause();
  }

  return (
    <div
      ref={shellRef}
      className={`relative overflow-hidden bg-black ${theater ? "rounded-none" : "rounded-xl"}`}
    >
      <video
        ref={mediaRef}
        poster={poster}
        autoPlay
        playsInline
        preload="auto"
        className="aspect-video w-full object-cover"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-3 pb-2 pt-10 text-white">
        <button
          type="button"
          className="relative mb-2 block h-1.5 w-full rounded-full bg-white/30"
          aria-label="Seek"
          onClick={(event) => seek(event.clientX, event.currentTarget)}
        >
          <span
            className="absolute inset-y-0 left-0 rounded-full bg-ct-red"
            style={{ width: `${progress}%` }}
          />
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-full p-1 hover:bg-white/10"
            aria-label={playing ? "Pause" : "Play"}
            onClick={() => void togglePlay()}
          >
            {playing ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="h-6 w-6" />}
          </button>
          <button
            type="button"
            className="rounded-full p-1 hover:bg-white/10"
            aria-label={muted ? "Unmute" : "Mute"}
            onClick={() => setMuted((value) => !value)}
          >
            <VolumeIcon className={`h-5 w-5 ${muted ? "opacity-40" : ""}`} />
          </button>
          <span className="text-xs tabular-nums">
            {formatTime(current)} / {formatTime(duration) === "0:00" ? video.duration : formatTime(duration)}
          </span>
          <span className="ml-auto flex items-center gap-1.5">
            <button type="button" className="rounded-full p-1 hover:bg-white/10" aria-label="Captions">
              <ClosedCaptionsIcon className="h-5 w-5" />
            </button>
            <button type="button" className="rounded-full p-1 hover:bg-white/10" aria-label="Settings">
              <SettingsIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="rounded-full p-1 hover:bg-white/10"
              aria-label="Theater mode"
              onClick={onTheater}
            >
              <TheaterIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="rounded-full p-1 hover:bg-white/10"
              aria-label="Full screen"
              onClick={() => {
                const node = shellRef.current;
                if (!node) return;
                if (document.fullscreenElement) void document.exitFullscreen();
                else void node.requestFullscreen();
              }}
            >
              <FullscreenIcon className="h-5 w-5" />
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
