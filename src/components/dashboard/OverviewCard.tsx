import { ExternalLink, FileText } from "lucide-react";

export function OverviewCard() {
  return (
    <div className="bg-surface border border-border-dim rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border-dim bg-surface-highlight/30 flex justify-between items-center">
        <h3 className="font-display font-semibold text-sm tracking-wide text-white">
          Overview
        </h3>
      </div>
      <div className="p-4 flex flex-col gap-5">
        <div>
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1">
            From
          </span>
          <div className="flex items-center gap-2 group cursor-pointer">
            <div
              className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-blue-500"
              aria-hidden
            />
            <span className="font-mono text-primary text-sm truncate">
              0x9f8...a2b1
            </span>
            <ExternalLink className="size-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        <div>
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1">
            Interacted With (To)
          </span>
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-6 h-6 rounded bg-surface border border-border-dim flex items-center justify-center text-text-muted">
              <FileText className="size-3.5" />
            </div>
            <span className="font-mono text-primary text-sm truncate">
              PancakeSwap V3: Router
            </span>
            <ExternalLink className="size-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          <div className="mt-1 font-mono text-xs text-text-muted pl-8">
            0x13f...99c2
          </div>
        </div>
        <div className="h-px bg-border-dim" />
        <div>
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1">
            Value
          </span>
          <div className="font-mono text-white text-sm">
            0.5 <span className="text-text-muted">BNB</span>
            <span className="text-xs text-text-muted ml-1">($123.45)</span>
          </div>
        </div>
        <div>
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1">
            Gas Used
          </span>
          <div className="font-mono text-white text-sm">
            145,200 <span className="text-text-muted text-xs">(68.2%)</span>
          </div>
          <div className="w-full h-1.5 bg-surface-highlight rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-warning w-[68%]"
              style={{ boxShadow: "0 0 8px rgba(245, 158, 11, 0.4)" }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-text-muted">Limit: 212,874</span>
            <span className="text-[10px] text-error font-medium">High Usage</span>
          </div>
        </div>
        <div>
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1">
            Nonce
          </span>
          <div className="font-mono text-text-muted text-sm">42</div>
        </div>
      </div>
    </div>
  );
}
