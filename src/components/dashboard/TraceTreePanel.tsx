"use client";

import Link from "next/link";
import { Minus, Plus, CircleAlert } from "lucide-react";

export function TraceTreePanel({ hash }: { hash: string }) {
  return (
    <div className="bg-surface border border-border-dim rounded-xl flex flex-col h-full overflow-hidden shadow-lg">
      <div className="px-4 py-3 border-b border-border-dim bg-surface-highlight/30 flex justify-between items-center sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <h3 className="font-display font-semibold text-sm tracking-wide text-white">
            Execution Trace
          </h3>
          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-mono border border-primary/20">
            Depth: 4
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="p-1.5 rounded hover:bg-surface-highlight text-text-muted hover:text-white transition-colors"
            aria-label="Collapse all"
          >
            <Minus className="size-[18px]" />
          </button>
          <button
            type="button"
            className="p-1.5 rounded hover:bg-surface-highlight text-text-muted hover:text-white transition-colors"
            aria-label="Expand all"
          >
            <Plus className="size-[18px]" />
          </button>
          <div className="w-px h-6 bg-border-dim mx-1" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted font-medium">Hex</span>
            <button
              type="button"
              className="w-8 h-4 rounded-full bg-border-dim relative transition-colors duration-200 focus:outline-none"
              aria-label="Toggle hex view"
            >
              <div className="w-2 h-2 rounded-full bg-text-muted absolute left-1 top-1 transition-transform duration-200" />
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-0 relative">
        <div className="absolute inset-y-0 left-6 border-l border-border-dim z-0" />
        {/* Call 0 */}
        <div className="relative z-10 group border-b border-border-dim/50 hover:bg-surface-highlight cursor-pointer transition-colors">
          <div className="flex items-center pl-4 py-3 pr-4">
            <div className="w-5 h-5 flex items-center justify-center mr-2 text-text-muted cursor-pointer hover:text-white">
              <Minus className="size-4" />
            </div>
            <span className="text-xs font-mono text-primary mr-3 px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">
              CALL
            </span>
            <div className="flex-1 font-mono text-sm text-white truncate">
              <span className="text-yellow-400">
                swapExactTokensForETHSupportingFeeOnTransferTokens
              </span>
              <span className="text-text-muted">
                (amountIn: <span className="text-white">1000...</span>, amountOutMin:{" "}
                <span className="text-white">0</span>, ...)
              </span>
            </div>
            <div className="w-16 h-1 bg-surface-highlight rounded-full overflow-hidden ml-4">
              <div className="h-full bg-text-muted w-[100%]" />
            </div>
          </div>
        </div>
        {/* Call 1 */}
        <div className="relative z-10 group border-b border-border-dim/50 hover:bg-surface-highlight cursor-pointer transition-colors">
          <div className="flex items-center pl-10 py-2.5 pr-4 relative">
            <div className="absolute left-6 top-0 bottom-0 border-l border-border-dim" />
            <div className="absolute left-6 top-1/2 w-4 border-t border-border-dim" />
            <div className="w-5 h-5 flex items-center justify-center mr-2 text-text-muted">
              <Minus className="size-4" />
            </div>
            <span className="text-xs font-mono text-text-muted mr-3">
              DELEGATECALL
            </span>
            <div className="flex-1 font-mono text-sm text-text-muted truncate group-hover:text-white transition-colors">
              <span className="text-purple-400">_swap</span>
              <span className="text-text-muted">
                (amounts: [...], path: [...], to:{" "}
                <a href="#" className="text-primary hover:underline">
                  0x9f8...a2b1
                </a>
                )
              </span>
            </div>
            <div className="w-16 h-1 bg-surface-highlight rounded-full overflow-hidden ml-4">
              <div className="h-full bg-primary w-[85%]" />
            </div>
          </div>
        </div>
        {/* Call 2 */}
        <div className="relative z-10 group border-b border-border-dim/50 hover:bg-surface-highlight cursor-pointer transition-colors">
          <div className="flex items-center pl-16 py-2.5 pr-4 relative">
            <div className="absolute left-6 top-0 bottom-0 border-l border-border-dim" />
            <div className="absolute left-12 top-0 bottom-0 border-l border-border-dim" />
            <div className="absolute left-12 top-1/2 w-4 border-t border-border-dim" />
            <div className="w-5 h-5 flex items-center justify-center mr-2 text-text-muted">
              <Plus className="size-4" />
            </div>
            <span className="text-xs font-mono text-text-muted mr-3">
              STATICCALL
            </span>
            <div className="flex-1 font-mono text-sm text-text-muted truncate group-hover:text-white transition-colors">
              <span className="text-blue-400">getReserves</span>
              <span className="text-text-muted">()</span>
              <span className="text-success ml-2 text-xs">
                → [109232, 9923812, 1699238]
              </span>
            </div>
            <div className="w-16 h-1 bg-surface-highlight rounded-full overflow-hidden ml-4">
              <div className="h-full bg-text-muted w-[5%]" />
            </div>
          </div>
        </div>
        {/* Call - REVERT */}
        <Link
          href={`/trace/${hash}/detail`}
          className="relative z-10 group bg-error/15 border border-l-4 border-error hover:bg-error/20 cursor-pointer transition-colors my-1 mr-2 rounded-r-lg block"
        >
          <div className="flex items-center pl-16 py-3 pr-4 relative">
            <div className="absolute left-6 top-0 bottom-0 border-l border-border-dim" />
            <div className="absolute left-12 top-0 bottom-0 border-l border-border-dim" />
            <div className="absolute left-12 top-1/2 w-4 border-t border-border-dim" />
            <div className="w-5 h-5 flex items-center justify-center mr-2 text-error">
              <CircleAlert className="size-4" />
            </div>
            <span className="text-xs font-mono text-error mr-3 font-bold">
              REVERT
            </span>
            <div className="flex-1 font-mono text-sm text-white truncate">
              <span className="text-white font-semibold">safeTransfer</span>
              <span className="text-error/70">
                (token: <span className="text-white">0x21...</span>, to:{" "}
                <span className="text-white">0xPair...</span>, value:{" "}
                <span className="text-white">500</span>)
              </span>
            </div>
            <div className="px-2 py-0.5 bg-error text-white text-[10px] font-bold rounded">
              GAS OOG
            </div>
          </div>
        </Link>
        {/* Return */}
        <div className="relative z-10 group border-b border-border-dim/50 hover:bg-surface-highlight cursor-pointer transition-colors opacity-50">
          <div className="flex items-center pl-10 py-2.5 pr-4 relative">
            <div className="absolute left-6 top-0 bottom-0 border-l border-border-dim" />
            <div className="absolute left-6 top-1/2 w-4 border-t border-border-dim" />
            <span className="text-xs font-mono text-text-muted ml-8 italic">
              Return: 0x (Reverted)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
