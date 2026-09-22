import Link from "next/link";

import { ThemeToggle } from "@/components/cattube/theme-toggle";

export const dynamic = "force-dynamic";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-ct-bg px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Link href="/" className="mb-8 flex items-center gap-1.5">
        <span className="flex h-6 w-8 items-center justify-center rounded-[6px] bg-ct-red">
          <svg viewBox="0 0 12 12" className="ml-0.5 h-3 w-3 fill-white" aria-hidden="true">
            <path d="M3.2 1.8v8.4L10.4 6 3.2 1.8Z" />
          </svg>
        </span>
        <span className="text-[22px] font-semibold tracking-tight text-ct-text">CatTube</span>
      </Link>
      <div className="w-full max-w-sm rounded-2xl border border-ct-border bg-ct-bg p-6 shadow-sm">
        {children}
      </div>
    </div>
  );
}
