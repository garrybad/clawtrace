"use client";

import Link from "next/link";

const recentItems = [
  { hash: "0xb5...75d", path: "0xb5414a6f587b43ea43e8173521cf10d9182dbc2c1c0e504188eaeb4e6ed7a75d" },
] as const;

export function RecentSearches() {
  return (
    <div className="w-full mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 animate-[fadeIn_0.8s_ease-out]">
      <span className="text-xs uppercase tracking-wider text-text-muted font-bold opacity-60">
        Example:
      </span>
      <div className="flex flex-wrap justify-center gap-2">
        {recentItems.map((item) => (
          <Link
            key={item.hash}
            href={`/trace/${item.path}`}
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-surface border border-border hover:border-primary/50 hover:bg-surface-highlight transition-all group"
          >
            <span
              className={`size-1.5 rounded-full ${item.path.includes("7a25") ? "bg-error animate-pulse" : "bg-green-500"}`}
            />
            <span className="font-mono text-xs text-text-muted group-hover:text-white transition-colors">
              {item.hash}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
