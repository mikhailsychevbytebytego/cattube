import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  ChevronRightIcon,
  ClockIcon,
  FireIcon,
  GameIcon,
  HangerIcon,
  HomeIcon,
  LearnIcon,
  LikeIcon,
  LiveIcon,
  MusicIcon,
  NewsIcon,
  PanoramaIcon,
  PlaylistIcon,
  ShortsIcon,
  SubscriptionsIcon,
  TrophyIcon,
  YourVideosIcon,
} from "@/components/cattube/icons";

type SidebarProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  overlay?: boolean;
  homeActive?: boolean;
  subscriptionsActive?: boolean;
  onNavigate: () => void;
};

type NavItem = {
  href: Route;
  label: string;
  icon: ReactNode;
  active?: boolean;
};

const PRIMARY: NavItem[] = [
  { href: "/", label: "Home", icon: <HomeIcon filled className="h-[22px] w-[22px]" />, active: true },
  { href: "/", label: "Shorts", icon: <ShortsIcon className="h-[22px] w-[22px]" /> },
  { href: "/subscriptions", label: "Subscriptions", icon: <SubscriptionsIcon className="h-[22px] w-[22px]" /> },
];

const YOU: NavItem[] = [
  { href: "/", label: "Your Meowments", icon: <YourVideosIcon className="h-[22px] w-[22px]" /> },
  { href: "/", label: "Watch Later", icon: <ClockIcon className="h-[22px] w-[22px]" /> },
  { href: "/", label: "Liked Kitties", icon: <LikeIcon className="h-[22px] w-[22px]" /> },
  { href: "/", label: "Catlists", icon: <PlaylistIcon className="h-[22px] w-[22px]" /> },
];

const EXPLORE: NavItem[] = [
  { href: "/?category=Funny Cats", label: "Trending Meows", icon: <FireIcon className="h-[22px] w-[22px]" /> },
  { href: "/?category=Cat ASMR", label: "Music for Cats", icon: <MusicIcon className="h-[22px] w-[22px]" /> },
  { href: "/", label: "Live Meows", icon: <LiveIcon className="h-[22px] w-[22px]" /> },
  { href: "/?category=Gaming Cats", label: "Gaming Cats", icon: <GameIcon className="h-[22px] w-[22px]" /> },
  { href: "/", label: "News from the Litter Box", icon: <NewsIcon className="h-[22px] w-[22px]" /> },
  { href: "/", label: "Sports Cats", icon: <TrophyIcon className="h-[22px] w-[22px]" /> },
  { href: "/?category=Smart Cats", label: "Learning with Cats", icon: <LearnIcon className="h-[22px] w-[22px]" /> },
  { href: "/", label: "Fashionable Felines", icon: <HangerIcon className="h-[22px] w-[22px]" /> },
  { href: "/", label: "360° Cat Videos", icon: <PanoramaIcon className="h-[22px] w-[22px]" /> },
];

export function Sidebar({
  collapsed,
  mobileOpen,
  overlay,
  homeActive,
  subscriptionsActive,
  onNavigate,
}: SidebarProps) {
  const primary = PRIMARY.map((item) => {
    if (item.label === "Home") {
      return {
        ...item,
        active: Boolean(homeActive),
        icon: <HomeIcon filled={Boolean(homeActive)} className="h-[22px] w-[22px]" />,
      };
    }
    if (item.label === "Subscriptions") {
      return { ...item, active: Boolean(subscriptionsActive) };
    }
    return { ...item, active: false };
  });

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className={`fixed inset-0 z-30 bg-black/40 ${overlay ? "" : "xl:hidden"}`}
          aria-label="Close menu"
          onClick={onNavigate}
        />
      ) : null}

      <aside
        aria-hidden={overlay && !mobileOpen}
        className={`fixed top-14 z-30 h-[calc(100dvh-56px)] w-[246px] shrink-0 overflow-y-auto bg-ct-bg pb-6 transition-[width,transform] duration-200 sm:top-16 sm:h-[calc(100dvh-64px)] ${
          overlay
            ? mobileOpen
              ? "translate-x-0 shadow-xl"
              : "-translate-x-full"
            : `${collapsed ? "xl:w-[72px]" : "xl:w-[246px]"} ${
                mobileOpen ? "translate-x-0" : "-translate-x-full xl:translate-x-0"
              } xl:sticky xl:shadow-none`
        }`}
      >
        <nav aria-label="Main" className="px-3 pt-3">
          <NavList items={primary} collapsed={!overlay && collapsed} onNavigate={onNavigate} />
        </nav>

        {!overlay && collapsed ? null : (
          <>
            <div className="mx-3 my-3 border-t border-ct-border" />
            <section className="px-3">
              <h2 className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-ct-text">
                You
                <ChevronRightIcon className="h-4 w-4 text-ct-text" />
              </h2>
              <NavList items={YOU} collapsed={false} onNavigate={onNavigate} />
            </section>

            <div className="mx-3 my-3 border-t border-ct-border" />
            <section className="px-3">
              <h2 className="px-3 py-1.5 text-sm font-medium text-ct-text">Explore</h2>
              <NavList items={EXPLORE} collapsed={false} onNavigate={onNavigate} />
            </section>

            <div className="mx-3 my-3 border-t border-ct-border" />
            <section className="px-3">
              <h2 className="px-3 py-1.5 text-sm font-medium text-ct-text">
                More from CatTube
              </h2>
              <Link
                href="/"
                onClick={onNavigate}
                className="flex items-start gap-3 rounded-2xl px-3 py-2.5 hover:bg-ct-hover"
              >
                <span className="mt-0.5 flex h-5 w-7 shrink-0 items-center justify-center rounded-[5px] bg-ct-red">
                  <svg viewBox="0 0 12 12" className="ml-0.5 h-2.5 w-2.5 fill-white" aria-hidden="true">
                    <path d="M3.2 1.8v8.4L10.4 6 3.2 1.8Z" />
                  </svg>
                </span>
                <span>
                  <span className="block text-sm leading-5 text-ct-text">
                    CatTube Premium
                  </span>
                  <span className="block text-xs leading-4 text-ct-muted">
                    More cats. Zero ads. (Maybe.)
                  </span>
                </span>
              </Link>
            </section>
          </>
        )}
      </aside>
    </>
  );
}

function NavList({
  items,
  collapsed,
  onNavigate,
}: {
  items: NavItem[];
  collapsed: boolean;
  onNavigate: () => void;
}) {
  return (
    <ul className="flex flex-col">
      {items.map((item) => (
        <li key={item.label}>
          <Link
            href={item.href}
            onClick={onNavigate}
            aria-current={item.active ? "page" : undefined}
            className={`flex items-center rounded-2xl text-sm ${
              collapsed
                ? "h-[74px] flex-col justify-center gap-1 px-1 text-[10px]"
                : "h-10 gap-4 px-3"
            } ${item.active ? "bg-ct-hover font-medium" : "font-normal hover:bg-ct-hover"}`}
          >
            <span className="shrink-0">{item.icon}</span>
            <span className={collapsed ? "text-center leading-tight" : "truncate"}>
              {item.label}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
