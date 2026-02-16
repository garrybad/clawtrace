"use client";

import { useState, useEffect } from "react";
import { ExternalLink, Terminal, CircleAlert, PanelRightClose, PanelRightOpen } from "lucide-react";

export function DetailsDrawer() {
  const [isExpanded, setIsExpanded] = useState(true);

  // Start collapsed on small screens, expanded on lg+
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsExpanded(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsExpanded(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <aside className="flex flex-col w-full lg:w-[400px] border-border bg-surface shadow-2xl z-20 shrink-0 border-t lg:border-t-0 lg:border-l overflow-hidden">
      {/* Header bar: always visible (matches your reference when minimized) */}
      <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-surface-highlight/30 min-w-0 shrink-0">
        <h3 className="font-display font-bold text-white text-sm tracking-wide flex items-center gap-2 truncate min-w-0">
          <span className="w-2 h-2 rounded-full bg-error animate-pulse shrink-0" />
          <span className="truncate">Call Trace #4 Details</span>
        </h3>
        <div className="flex gap-1">
          <button
            type="button"
            className="p-1.5 hover:bg-white/10 rounded text-text-muted hover:text-white transition-colors"
            aria-label="Open in new"
          >
            <ExternalLink className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            className="p-1.5 hover:bg-white/10 rounded text-text-muted hover:text-white transition-colors"
            aria-label={isExpanded ? "Minimize drawer" : "Expand drawer"}
          >
            {isExpanded ? (
              <PanelRightClose className="size-5" />
            ) : (
              <PanelRightOpen className="size-5" />
            )}
          </button>
        </div>
      </div>
      {/* Content: collapses top-to-bottom when minimized */}
      <div
        className={`
          overflow-hidden transition-[max-height] duration-200 ease-out
          ${isExpanded ? "flex-1 min-h-0 max-h-[2000px]" : "flex-none max-h-0"}
        `}
      >
        <div className="h-full overflow-y-auto p-4 space-y-6 font-mono text-sm min-h-0">
        <div className="p-3 rounded bg-error/10 border border-error/30 text-error flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider">
              Status
            </span>
            <span className="flex items-center gap-1 text-xs bg-error/20 px-1.5 py-0.5 rounded">
              <CircleAlert className="size-3" />
              Reverted
            </span>
          </div>
          <p className="text-xs opacity-90">
            Execution halted. State changes rolled back.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-text-muted uppercase tracking-wider font-semibold">
            Method ID
          </label>
          <div className="flex items-center gap-2">
            <code className="bg-background-dark px-2 py-1.5 rounded border border-border text-primary flex-1">
              0xa9059cbb
            </code>
            <span className="text-xs text-text-muted italic">
              transfer(to, amount)
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-text-muted uppercase tracking-wider font-semibold">
              Calldata (Raw)
            </label>
            <button
              type="button"
              className="text-[10px] text-primary hover:text-white transition-colors"
            >
              COPY HEX
            </button>
          </div>
          <div className="bg-background-dark p-3 rounded border border-border text-xs break-all leading-relaxed text-text-muted selection:bg-primary selection:text-background-dark">
            0xa9059cbb0000000000000000000000003f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be000000000000000000000000000000000000000000000d3c21bcecceda100000
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-text-muted uppercase tracking-wider font-semibold">
            Decoded Inputs
          </label>
          <div className="border border-border rounded overflow-hidden">
            <div className="flex flex-col sm:flex-row border-b border-border">
              <div className="w-full sm:w-1/3 p-2 bg-surface-highlight text-xs text-text-muted sm:border-r border-border">
                to
              </div>
              <div
                className="w-full sm:w-2/3 p-2 bg-background-dark text-xs text-primary truncate"
                title="0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be"
              >
                0x3f5c...f0be
              </div>
            </div>
            <div className="flex flex-col sm:flex-row">
              <div className="w-full sm:w-1/3 p-2 bg-surface-highlight text-xs text-text-muted sm:border-r border-border">
                amount
              </div>
              <div className="w-full sm:w-2/3 p-2 bg-background-dark text-xs text-primary break-all">
                1000000000000000000
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-text-muted uppercase tracking-wider font-semibold">
            Gas Analysis
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-surface-highlight p-2 rounded border border-border">
              <div className="text-[10px] text-text-muted">Gas Used</div>
              <div className="text-white">24,502</div>
            </div>
            <div className="bg-surface-highlight p-2 rounded border border-border">
              <div className="text-[10px] text-text-muted">Limit</div>
              <div className="text-white">500,000</div>
            </div>
          </div>
          <div className="text-[10px] text-text-muted text-right">
            Est. Cost: <span className="text-white">0.00012 BNB</span> ($0.04)
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <button
            type="button"
            className="w-full py-2.5 rounded bg-surface hover:bg-surface-highlight border border-border hover:border-primary/50 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 group"
          >
            <Terminal className="size-4 group-hover:text-primary transition-colors" />
            View Opcode Trace
          </button>
        </div>
      </div>
      </div>
    </aside>
  );
}
