"use client";

import {
  ChevronRight,
  ArrowRight,
  CornerDownLeft,
  AlertTriangle,
  CircleAlert,
  Code2,
  Loader2,
} from "lucide-react";

export function TraceTreeDetail() {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto bg-cyber-grid relative p-4 sm:p-6">
      <div className="bg-surface border border-border rounded-xl shadow-lg min-w-0 w-full max-w-full p-4 sm:p-6 pb-20">
        <div className="space-y-1">
          {/* Row 1: Root Call */}
          <div className="group relative flex flex-col">
            <div className="flex items-center gap-2 sm:gap-3 py-2 px-2 sm:px-3 rounded-lg hover:bg-surface-highlight/50 border border-transparent hover:border-border transition-all cursor-pointer min-w-0">
              <div className="flex items-center w-6 sm:w-8 justify-center shrink-0">
                <ChevronRight className="size-4 text-text-muted transform rotate-90" />
              </div>
              <div className="flex flex-1 items-center gap-2 sm:gap-3 font-mono text-xs sm:text-sm min-w-0">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 shrink-0">
                  CALL
                </span>
                <span className="text-text-muted shrink-0">0xSender</span>
                <ArrowRight className="size-3 text-text-muted shrink-0" />
                <span className="text-white font-medium hover:underline decoration-primary underline-offset-4 decoration-dotted truncate min-w-0">
                  0xRouter::swapExactETHForTokens
                </span>
                <span className="text-text-muted text-xs shrink-0">[0.5 ETH]</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 pl-2 sm:pl-4 border-l border-border/50 shrink-0">
                <div className="flex flex-col items-end gap-0.5 w-16 sm:w-24">
                  <span className="text-[10px] font-mono text-text-muted">
                    184,202 Gas
                  </span>
                  <div className="w-full h-1 bg-surface rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-purple-500 w-[85%]" />
                  </div>
                </div>
                <button
                  type="button"
                  className="p-1 rounded hover:bg-white/5 text-text-muted hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="View data"
                >
                  <Code2 className="size-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Nested Level 1 - Static */}
          <div className="group relative flex flex-col pl-4 sm:pl-8">
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border/50" />
            <div className="absolute left-[19px] top-[20px] w-4 h-px bg-border/50" />
            <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-surface-highlight/50 border border-transparent hover:border-border transition-all cursor-pointer">
              <div className="flex items-center w-8 justify-center">
                <span className="text-text-muted text-xs font-mono">01</span>
              </div>
              <div className="flex flex-1 items-center gap-2 sm:gap-3 font-mono text-xs sm:text-sm min-w-0">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                  STATIC
                </span>
                <span className="text-text-muted shrink-0">0xRouter</span>
                <ArrowRight className="size-3 text-text-muted shrink-0" />
                <span className="text-white hover:underline decoration-primary underline-offset-4 decoration-dotted truncate min-w-0">
                  0xFactory::getPair
                </span>
              </div>
              <div className="text-xs font-mono text-success flex items-center gap-1 shrink-0">
                <CornerDownLeft className="size-3" />
                (0xPairAddress...)
              </div>
              <div className="flex items-center gap-2 sm:gap-4 pl-2 sm:pl-4 border-l border-border/50 shrink-0">
                <div className="flex flex-col items-end gap-0.5 w-16 sm:w-24">
                  <span className="text-[10px] font-mono text-text-muted">
                    2,400 Gas
                  </span>
                  <div className="w-full h-1 bg-surface rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[5%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Nested Level 1 - Call (expanded) */}
          <div className="group relative flex flex-col pl-4 sm:pl-8">
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border/50" />
            <div className="absolute left-[19px] top-[20px] w-4 h-px bg-border/50" />
            <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-surface-highlight/50 border border-transparent hover:border-border transition-all cursor-pointer bg-surface/30">
              <div className="flex items-center w-8 justify-center">
                <ChevronRight className="size-4 text-text-muted transform rotate-90" />
              </div>
              <div className="flex flex-1 items-center gap-2 sm:gap-3 font-mono text-xs sm:text-sm min-w-0">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 shrink-0">
                  CALL
                </span>
                <span className="text-text-muted shrink-0">0xRouter</span>
                <ArrowRight className="size-3 text-text-muted shrink-0" />
                <span className="text-white hover:underline decoration-primary underline-offset-4 decoration-dotted truncate min-w-0">
                  0xPair::swap
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 pl-2 sm:pl-4 border-l border-border/50 shrink-0">
                <div className="flex flex-col items-end gap-0.5 w-16 sm:w-24">
                  <span className="text-[10px] font-mono text-text-muted">
                    98,100 Gas
                  </span>
                  <div className="w-full h-1 bg-surface rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-purple-500 w-[60%]" />
                  </div>
                </div>
                <button
                  type="button"
                  className="p-1 rounded hover:bg-white/5 text-primary opacity-100 transition-opacity"
                  aria-label="View data"
                >
                  <Code2 className="size-5" />
                </button>
              </div>
            </div>
            {/* Expanded params */}
            <div className="ml-4 sm:ml-12 mr-2 sm:mr-4 mt-1 p-2 sm:p-3 rounded bg-surface/50 border border-border font-mono text-xs overflow-x-auto relative">
              <div className="absolute -left-4 top-4 w-4 h-px bg-border/50 border-t border-dotted border-text-muted/30" />
              <div className="text-text-muted mb-1 flex justify-between items-center">
                <span>Input Parameters:</span>
                <span className="text-[10px] uppercase tracking-wider text-primary cursor-pointer hover:underline">
                  Decode as Tuple
                </span>
              </div>
              <pre className="text-text-main">
                <span className="text-purple-400">amount0Out:</span>{" "}
                <span className="text-primary">0</span>{" "}
                <span className="text-purple-400">amount1Out:</span>{" "}
                <span className="text-primary">14509923004812</span>{" "}
                <span className="text-purple-400">to:</span>{" "}
                <span className="text-success">&quot;0xSender...&quot;</span>{" "}
                <span className="text-purple-400">data:</span>{" "}
                <span className="text-text-muted">0x</span>
              </pre>
            </div>
          </div>

          {/* Row 4: Event */}
          <div className="group relative flex flex-col pl-6 sm:pl-16">
            <div className="absolute left-[19px] top-0 bottom-full w-px bg-border/50" />
            <div className="absolute left-[51px] top-0 bottom-0 w-px bg-border/50" />
            <div className="absolute left-[51px] top-[20px] w-4 h-px bg-border/50" />
            <div className="flex items-center gap-2 sm:gap-3 py-2 px-2 sm:px-3 rounded-lg hover:bg-surface-highlight/50 border border-transparent hover:border-border transition-all cursor-pointer min-w-0">
              <div className="flex items-center w-6 sm:w-8 justify-center shrink-0">
                <span className="text-text-muted text-xs font-mono">L1</span>
              </div>
              <div className="flex flex-1 items-center gap-2 sm:gap-3 font-mono text-xs sm:text-sm min-w-0">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-warning/10 text-warning border border-warning/20 shrink-0">
                  EVENT
                </span>
                <span className="text-warning shrink-0">Sync</span>
                <span className="text-text-muted text-xs truncate min-w-0">
                  (reserve0: 10500..., reserve1: 40200...)
                </span>
              </div>
            </div>
          </div>

          {/* Row 5: Revert */}
          <div className="group relative flex flex-col pl-6 sm:pl-16">
            <div className="absolute left-[51px] top-0 bottom-0 w-px bg-border/50" />
            <div className="absolute left-[51px] top-[20px] w-4 h-px bg-border/50" />
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 py-2 px-2 sm:px-3 rounded-lg bg-error/5 hover:bg-error/10 border border-error/30 hover:border-error/50 transition-all cursor-pointer shadow-[0_0_10px_rgba(244,63,94,0.1)] min-w-0">
              <div className="flex items-center w-6 sm:w-8 justify-center shrink-0">
                <CircleAlert className="size-4 text-error" />
              </div>
              <div className="flex flex-1 items-center gap-2 sm:gap-3 font-mono text-xs sm:text-sm min-w-0">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-error/10 text-error border border-error/20 shrink-0">
                  CALL
                </span>
                <span className="text-text-muted shrink-0">0xPair</span>
                <ArrowRight className="size-3 text-text-muted shrink-0" />
                <span className="text-error font-bold hover:underline decoration-error underline-offset-4 decoration-dotted truncate min-w-0">
                  0xToken::transfer
                </span>
              </div>
              <div className="text-xs font-mono text-error flex items-center gap-1 bg-error/10 px-2 py-0.5 rounded border border-error/20 w-full sm:w-auto">
                <AlertTriangle className="size-3 shrink-0" />
                <span className="truncate">Reverted: TransferHelper::safeTransfer error</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 pl-2 sm:pl-4 border-l border-error/20 shrink-0">
                <div className="flex flex-col items-end gap-0.5 w-16 sm:w-24">
                  <span className="text-[10px] font-mono text-error">
                    Gas Limit Hit
                  </span>
                  <div className="w-full h-1 bg-surface rounded-full overflow-hidden">
                    <div className="h-full bg-error w-[100%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 6: Skipped sibling */}
          <div className="group relative flex flex-col pl-4 sm:pl-8 opacity-50">
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border/50" />
            <div className="absolute left-[19px] top-[20px] w-4 h-px bg-border/50" />
            <div className="flex items-center gap-2 sm:gap-3 py-2 px-2 sm:px-3 rounded-lg hover:bg-surface-highlight/50 border border-transparent hover:border-border transition-all cursor-not-allowed min-w-0">
              <div className="flex items-center w-6 sm:w-8 justify-center shrink-0">
                <span className="text-text-muted text-xs font-mono">03</span>
              </div>
              <div className="flex flex-1 items-center gap-2 sm:gap-3 font-mono text-xs sm:text-sm min-w-0">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-text-muted/10 text-text-muted border border-text-muted/20 shrink-0">
                  CALL
                </span>
                <span className="text-text-muted decoration-line-through truncate min-w-0">
                  0xRouter
                </span>
                <ArrowRight className="size-3 text-text-muted shrink-0" />
                <span className="text-text-muted decoration-line-through truncate min-w-0">
                  0xRefund::refundETH
                </span>
              </div>
              <div className="px-2 py-0.5 rounded bg-surface border border-border text-[10px] text-text-muted uppercase tracking-wide shrink-0">
                Skipped
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-8 gap-2 items-center text-primary/50 text-xs font-mono animate-pulse">
          <Loader2 className="size-4 animate-spin" />
          Indexing remaining 12 calls...
        </div>
      </div>
    </div>
  );
}
