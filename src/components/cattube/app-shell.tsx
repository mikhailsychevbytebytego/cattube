"use client";

import { Suspense, useState } from "react";
import { usePathname } from "next/navigation";

import { Header, type HeaderUser } from "@/components/cattube/header";
import { Sidebar } from "@/components/cattube/sidebar";

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: HeaderUser;
}) {
  const pathname = usePathname();
  const isWatch = pathname === "/watch";
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function onMenuClick() {
    if (
      isWatch ||
      (typeof window !== "undefined" && !window.matchMedia("(min-width: 1280px)").matches)
    ) {
      setMobileOpen((value) => !value);
      return;
    }

    setCollapsed((value) => !value);
  }

  return (
    <div className="flex min-h-dvh w-full flex-col bg-ct-bg text-ct-text">
      <Suspense fallback={<div className="h-14 bg-ct-bg sm:h-16" />}>
        <Header onMenuClick={onMenuClick} user={user} />
      </Suspense>
      <div className="flex min-h-0 w-full flex-1">
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          overlay={isWatch}
          homeActive={pathname === "/"}
          subscriptionsActive={pathname === "/subscriptions"}
          onNavigate={() => setMobileOpen(false)}
        />
        <div className="min-h-0 min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
