"use client";

import Link from "next/link";
import { useRef } from "react";

import { ChevronRightIcon } from "@/components/cattube/icons";
import { feedHref } from "@/lib/cattube";

type CategoryChipsProps = {
  categories: string[];
  selected: string;
  query: string;
};

export function CategoryChips({ categories, selected, query }: CategoryChipsProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative flex items-center gap-2">
      <div
        ref={scrollerRef}
        className="flex min-w-0 gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {categories.map((category) => {
          const isActive = category === selected;
          return (
            <Link
              key={category}
              href={feedHref(category, query)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm whitespace-nowrap ${
                isActive
                  ? "bg-ct-text font-medium text-ct-inverted"
                  : "bg-ct-chip text-ct-text hover:bg-ct-hover"
              }`}
            >
              {category}
            </Link>
          );
        })}
      </div>
      <button
        type="button"
        className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ct-border bg-ct-bg text-ct-text shadow-sm hover:bg-ct-hover md:flex"
        aria-label="Show more categories"
        onClick={() => {
          scrollerRef.current?.scrollBy({ left: 240, behavior: "smooth" });
        }}
      >
        <ChevronRightIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
