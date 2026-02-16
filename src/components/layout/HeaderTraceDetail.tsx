"use client";

import Link from "next/link";
import { ArrowLeft, Network, Filter, ChevronDown, Maximize2, UnfoldVertical, UnfoldHorizontal } from "lucide-react";

export function HeaderTraceDetail({
  txHashShort = "0x7a2...3f9c",
  txHash,
}: {
  txHashShort?: string;
  txHash?: string;
}) {
  const dashboardHref = txHash ? `/trace/${txHash}` : "/trace/0x7a2";
  return (
    <header className="min-h-14 md:h-16 border-b border-border bg-background-dark/80 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 sm:px-6 py-3 md:py-0 z-50 shrink-0">
      <div className="flex items-center gap-3 sm:gap-6 min-w-0">
        <Link
          href={dashboardHref}
          className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors group shrink-0"
        >
          <ArrowLeft className="size-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-display font-medium text-sm tracking-wide hidden sm:inline">
            DASHBOARD
          </span>
        </Link>
        <div className="h-6 w-px bg-border hidden sm:block" />
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1.5 rounded bg-primary/10 text-primary border border-border-glow shrink-0">
            <Network className="size-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display font-bold text-base sm:text-lg leading-none tracking-tight text-white truncate">
              Trace Detail View
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider shrink-0">
                Tx:
              </span>
              <span className="text-[10px] font-mono text-primary/80 truncate">{txHashShort}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 md:justify-end md:max-w-2xl">
        <div className="relative group flex-1 min-w-0 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="size-5 text-text-muted group-focus-within:text-primary transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 bg-surface border border-border rounded-lg text-sm text-white placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all font-mono shadow-sm min-w-0"
            placeholder="Filter by address, method..."
          />
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 border border-border rounded text-[10px] font-mono text-text-muted bg-surface-highlight">
              ⌘K
            </kbd>
          </div>
        </div>
        <div className="flex bg-surface rounded-lg border border-border p-1 gap-1 shrink-0">
          <button
            type="button"
            className="p-1.5 sm:px-3 sm:py-1.5 rounded text-xs font-medium text-white hover:bg-surface-highlight hover:text-primary transition-colors flex items-center gap-1.5"
            title="Expand All"
          >
            <UnfoldVertical className="size-4" />
            <span className="hidden sm:inline">Expand All</span>
          </button>
          <div className="w-px bg-border my-1" />
          <button
            type="button"
            className="p-1.5 sm:px-3 sm:py-1.5 rounded text-xs font-medium text-text-muted hover:bg-surface-highlight hover:text-white transition-colors flex items-center gap-1.5"
            title="Collapse All"
          >
            <UnfoldHorizontal className="size-4" />
            <span className="hidden sm:inline">Collapse All</span>
          </button>
        </div>
      </div>
    </header>
  );
}
