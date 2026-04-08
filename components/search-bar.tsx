"use client";

import { forwardRef } from "react";

type SearchBarProps = {
  query: string;
  isPending: boolean;
  onQueryChange: (value: string) => void;
};

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  function SearchBar({ query, isPending, onQueryChange }, ref) {
    return (
      <div className="relative">
        {/* search icon */}
        <svg
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-tertiary)]"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        <input
          ref={ref}
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="搜索项目、工具、地址..."
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2 pl-9 pr-16 text-sm outline-none transition-all placeholder:text-[var(--ink-tertiary)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-soft)]"
        />

        {/* right side: spinner or ⌘K */}
        {isPending ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
          </div>
        ) : (
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden items-center rounded-md border border-[var(--border)] bg-[var(--bg)] px-1.5 py-0.5 font-mono text-[10px] font-medium text-[var(--ink-tertiary)] sm:inline-flex">
            ⌘K
          </kbd>
        )}
      </div>
    );
  },
);
