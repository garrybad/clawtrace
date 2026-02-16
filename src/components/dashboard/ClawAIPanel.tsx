import {
  Sparkles,
  Copy,
  ChevronDown,
  Brain,
} from "lucide-react";

export function ClawAIPanel() {
  return (
    <div className="bg-surface border border-border-dim rounded-xl overflow-hidden flex flex-col h-full shadow-glow">
      <div className="px-4 py-3 border-b border-border-dim bg-surface-highlight/30 flex justify-between items-center">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="size-[18px]" />
          <h3 className="font-display font-semibold text-sm tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
            ClawAI Insight
          </h3>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col gap-4">
        <div className="text-sm text-text-main leading-relaxed font-sans">
          <span className="text-text-muted text-xs uppercase tracking-wide block mb-2">
            Root Cause Analysis
          </span>
          <p className="typewriter-cursor">
            The transaction failed due to an{" "}
            <span className="text-error font-medium">Out of Gas</span> error during
            the internal{" "}
            <code className="bg-surface-highlight px-1 rounded text-primary text-xs">
              safeTransfer
            </code>{" "}
            call.
            <br />
            <br />
            The loop in the{" "}
            <code className="text-white">distributeRewards</code> modifier consumed
            92% of the provided gas before the transfer could complete.
          </p>
        </div>
        <div className="mt-auto">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] font-mono text-text-muted">
              TokenDistributor.sol:142
            </span>
            <button
              type="button"
              className="text-xs text-primary hover:text-white transition-colors"
            >
              Expand
            </button>
          </div>
          <div className="bg-background-dark border border-border-dim rounded-lg p-3 font-mono text-xs overflow-x-auto relative group">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                className="p-1 hover:bg-surface-highlight rounded text-text-muted"
                aria-label="Copy"
              >
                <Copy className="size-3.5" />
              </button>
            </div>
            <div className="text-text-muted/50">
              141   uint256 bal = address(this).balance;
            </div>
            <div className="text-error bg-error/10 -mx-3 px-3 border-l-2 border-error my-0.5">
              <span className="text-text-muted/50 select-none mr-2">142</span>
              <span className="text-purple-400">require</span>(
              <span className="text-blue-400">token</span>.
              <span className="text-yellow-400">transfer</span>(to, amount),{" "}
              <span className="text-green-400">&quot;Transfer failed&quot;</span>);
            </div>
            <div className="text-text-muted/50">
              143   emit Distributed(to, amount);
            </div>
          </div>
        </div>
        <button
          type="button"
          className="mt-2 w-full py-2.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/20 transition-all flex items-center justify-center gap-2"
        >
          <Brain className="size-4" />
          Fix with AI
        </button>
      </div>
    </div>
  );
}
