"use client";

import Link from "next/link";
import { Terminal, Search, Bug } from "lucide-react";

export function HeaderDashboard({ txHash = "0x7a250d5630b4cf539739df2c5dacb4c659f2488d78f795f723d5745116523f9" }: { txHash?: string }) {
  return (
    <header className="glass-header sticky top-0 z-50 border-b border-border-dim w-full">
      <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-glow">
            <Bug className="size-5" />
          </div>
          <Link href="/" className="font-display font-bold text-xl tracking-tight text-white hover:text-primary transition-colors">
            ClawTrace
          </Link>
        </div>
        {/* <div className="flex-1 max-w-2xl">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-primary">
              <Search className="size-5" />
            </div>
            <input
              type="text"
              className="w-full h-11 bg-surface border border-border-dim rounded-xl pl-12 pr-4 text-sm font-mono text-white placeholder-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-lg"
              placeholder="Search by Tx Hash / Block / Address"
              defaultValue={txHash}
            />
            <div className="absolute inset-y-0 right-3 flex items-center">
              <span className="text-xs text-text-muted bg-border-dim px-2 py-1 rounded">
                CMD+K
              </span>
            </div>
          </div>
        </div> */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-dim bg-surface">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-xs font-medium text-text-muted">BSC Testnet</span>
          </div>
        </div>
      </div>
    </header>
  );
}
