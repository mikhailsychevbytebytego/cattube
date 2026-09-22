import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ThemeToggle } from "@/components/cattube/theme-toggle";
import { adminPath } from "@/lib/admin-routes";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const LINKS = [
  { href: adminPath("/admin"), label: "Dashboard" },
  { href: adminPath("/admin/videos"), label: "Videos" },
  { href: adminPath("/admin/channels"), label: "Channels" },
  { href: adminPath("/admin/categories"), label: "Categories" },
  { href: adminPath("/admin/comments"), label: "Comments" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/sign-in?callbackUrl=/admin" as Route);
  if (!session.user.admin) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-lg font-medium text-ct-text">Admin only</p>
        <p className="text-sm text-ct-muted">This account cannot open the catalog admin.</p>
        <Link href="/" className="text-sm underline">
          Back to CatTube
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-ct-chip text-ct-text">
      <header className="border-b border-ct-border bg-ct-bg">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-wrap items-center gap-4">
            <p className="font-hand text-xl font-semibold">CatTube Admin</p>
            <nav className="flex flex-wrap gap-3 text-sm">
              {LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="hover:underline">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/" className="text-sm text-ct-muted hover:text-ct-text">
              View site
            </Link>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
    </div>
  );
}
