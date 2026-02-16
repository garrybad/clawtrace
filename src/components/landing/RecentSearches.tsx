"use client";

import Link from "next/link";

const recentItems = [
  { hash: "0x3a...9f2", path: "0x7a250d5630b4cf539739df2c5dacb4c659f2488d78f795f723d5745116523f9" },
  { hash: "0x88e...1c4", path: "0x88e1c4" },
  { hash: "0x90a...d3e", path: "0x90ad3e" },
] as const;

export function RecentSearches() {
  return (
    <div className="w-full mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 animate-[fadeIn_0.8s_ease-out]">
      <span className="text-xs uppercase tracking-wider text-text-muted font-bold opacity-60">
        Recent:
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
