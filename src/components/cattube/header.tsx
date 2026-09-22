"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent } from "react";

import { signOutAction } from "@/app/(auth)/actions";
import { BellIcon, MenuIcon, MicIcon, PawIcon, SearchIcon } from "@/components/cattube/icons";
import { ThemeToggle } from "@/components/cattube/theme-toggle";
import { viewerAvatar } from "@/lib/viewer-avatar";

export type HeaderUser = {
  name: string;
  email: string;
  image?: string | null;
  admin: boolean;
} | null;

type HeaderProps = {
  onMenuClick: () => void;
  user: HeaderUser;
};

export function Header({ onMenuClick, user }: HeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "All";

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextQuery = String(formData.get("q") ?? "").trim();
    const params = new URLSearchParams();
    if (category !== "All") params.set("category", category);
    if (nextQuery) params.set("q", nextQuery);
    const search = params.toString();
    router.push(search ? `/?${search}` : "/");
  }

  return (
    <header className="sticky top-0 z-40 grid h-14 w-full grid-cols-[minmax(0,1fr)_minmax(0,42rem)_minmax(0,1fr)] items-center gap-3 bg-ct-bg px-2 sm:h-16 sm:px-4">
      <div className="flex min-w-0 items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-10 w-10 items-center justify-center rounded-full text-ct-text hover:bg-ct-hover"
          aria-label="Toggle navigation menu"
        >
          <MenuIcon className="h-6 w-6" />
        </button>
        <Link href="/" className="flex items-center gap-1.5 pr-2">
          <span className="flex h-5 w-7 items-center justify-center rounded-[6px] bg-ct-red sm:h-[22px] sm:w-8">
            <svg viewBox="0 0 12 12" className="ml-0.5 h-3 w-3 fill-white" aria-hidden="true">
              <path d="M3.2 1.8v8.4L10.4 6 3.2 1.8Z" />
            </svg>
          </span>
          <span className="leading-none">
            <span className="flex items-center gap-0.5">
              <span className="text-[19px] font-semibold tracking-tight text-ct-text sm:text-[21px]">
                CatTube
              </span>
              <PawIcon className="h-4 w-4 text-ct-text" />
            </span>
            <span className="hidden text-[10px] tracking-wide text-ct-muted sm:block">
              Good Cats. Better Days.
            </span>
          </span>
        </Link>
      </div>

      <div className="flex min-w-0 items-center justify-center gap-3">
        <form
          onSubmit={onSearch}
          className="flex h-10 w-full min-w-0 items-center rounded-full bg-ct-search pl-5 pr-1.5"
          role="search"
        >
          <label htmlFor="cattube-search" className="sr-only">
            Search CatTube
          </label>
          <input
            id="cattube-search"
            key={`${query}-${category}`}
            name="q"
            defaultValue={query}
            placeholder="Search for cats, meows, and more..."
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-ct-text outline-none placeholder:text-neutral-400"
          />
          <button
            type="submit"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ct-muted hover:bg-ct-bg/70"
            aria-label="Search"
          >
            <SearchIcon className="h-5 w-5" />
          </button>
        </form>
        <button
          type="button"
          className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ct-search text-ct-text hover:bg-ct-hover sm:flex"
          aria-label="Search with your voice"
        >
          <MicIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">
        <p className="font-hand hidden -rotate-6 text-[15px] leading-4 font-medium text-ct-muted lg:block">
          Life is
          <br />
          Better with Cats
        </p>
        <ThemeToggle />
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full text-ct-text hover:bg-ct-hover"
          aria-label="Notifications"
        >
          <BellIcon className="h-6 w-6" />
        </button>
        {user ? (
          <div className="flex items-center gap-2">
            {user.admin ? (
              <Link
                href="/admin"
                className="hidden rounded-full px-3 py-1.5 text-sm text-ct-text hover:bg-ct-hover sm:inline"
              >
                Admin
              </Link>
            ) : null}
            <form action={signOutAction}>
              <button
                type="submit"
                className="hidden rounded-full px-3 py-1.5 text-sm text-ct-text hover:bg-ct-hover sm:inline"
              >
                Sign out
              </button>
            </form>
            {user.image || viewerAvatar ? (
              <Image
                src={user.image || viewerAvatar}
                alt={user.name}
                width={36}
                height={36}
                className="h-8 w-8 rounded-full object-cover sm:h-9 sm:w-9"
              />
            ) : (
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full bg-ct-hover text-xs font-medium sm:h-9 sm:w-9"
                aria-label={user.name}
              >
                {user.name.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
        ) : (
          <Link
            href="/sign-in"
            className="rounded-full bg-ct-text px-3 py-1.5 text-sm font-medium text-ct-inverted"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
