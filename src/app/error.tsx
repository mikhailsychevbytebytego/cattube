"use client";

import { useEffect } from "react";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="flex max-w-md flex-col items-start gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Something went wrong
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          An unexpected error occurred. You can try again, or go back to the
          home page.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => retry()}
            className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Try again
          </button>
        </div>
      </div>
    </main>
  );
}
