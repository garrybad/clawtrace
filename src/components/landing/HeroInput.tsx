"use client";

import { useRouter } from "next/navigation";
import { Search, ArrowRight, ChevronDown, Bitcoin } from "lucide-react";
import { useState } from "react";

export function HeroInput() {
  const router = useRouter();
  const [hash, setHash] = useState("");

  const handleAnalyze = () => {
    const trimmed = hash.trim();
    if (trimmed && trimmed.startsWith("0x")) {
      router.push(`/trace/${encodeURIComponent(trimmed)}`);
    } else if (trimmed) {
      router.push(`/trace/${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <div className="w-full group relative">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-purple-500/30 rounded-xl opacity-0 group-hover:opacity-50 transition duration-500 blur-sm" />
      <div className="relative flex items-center h-16 w-full bg-surface rounded-xl border border-border shadow-2xl transition-all duration-300 focus-within:border-primary focus-within:shadow-glow-focus overflow-hidden">
        {/* <div className="hidden sm:flex items-center h-full px-4 border-r border-border bg-surface-highlight/30 hover:bg-surface-highlight/50 transition-colors cursor-pointer min-w-[140px]">
          <div className="size-5 rounded-full bg-[#F3BA2F] flex items-center justify-center text-background-dark mr-3 font-bold text-[10px]">
            <Bitcoin className="size-3" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-text-muted font-medium">Network</span>
            <div className="flex items-center gap-1">
              <span className="text-sm text-white font-medium">BSC Mainnet</span>
              <ChevronDown className="size-4 text-text-muted" />
            </div>
          </div>
        </div> */}
        <div className="flex-1 h-full relative group/input">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-text-muted group-focus-within/input:text-primary transition-colors" />
          <input
            type="text"
            autoFocus
            value={hash}
            onChange={(e) => setHash(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            className="w-full h-full bg-transparent border-none outline-none text-white font-mono text-base placeholder:text-text-muted/50 px-12 focus:ring-0"
            placeholder="0x..."
          />
        </div>
        <button
          type="button"
          onClick={handleAnalyze}
          className="h-[calc(100%-8px)] mr-1 px-6 rounded-lg bg-primary hover:bg-[#33ebff] active:bg-[#00cce6] text-background-dark font-display font-bold text-sm tracking-wide transition-all shadow-[0_0_15px_rgba(0,229,255,0.2)] hover:shadow-[0_0_25px_rgba(0,229,255,0.4)] flex items-center gap-2"
        >
          <span>ANALYZE</span>
          <ArrowRight className="size-5" />
        </button>
      </div>
    </div>
  );
}
