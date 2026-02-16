import { FlaskConical } from "lucide-react";

export function SimulationCard() {
  return (
    <div className="bg-surface border border-border-dim rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3 text-white">
        <FlaskConical className="size-[18px]" />
        <h4 className="font-display font-semibold text-sm">Simulation</h4>
      </div>
      <p className="text-xs text-text-muted mb-3">
        Re-simulate with 2x gas limit to verify the fix.
      </p>
      <button
        type="button"
        className="w-full py-2 rounded-lg bg-surface-highlight border border-border-dim text-text-main text-xs font-medium hover:border-primary/50 transition-colors"
      >
        Simulate Tx
      </button>
    </div>
  );
}
