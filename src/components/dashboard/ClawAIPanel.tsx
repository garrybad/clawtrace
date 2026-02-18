"use client";

import { useState, useCallback } from "react";
import { Sparkles, Copy, Brain, Loader2, AlertCircle } from "lucide-react";
import type { AIInsight } from "@/lib/ai/types";

type Props = {
  hash: string;
  status: "success" | "failed" | "reverted";
};

export function ClawAIPanel({ hash, status }: Props) {
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsight = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trace/${encodeURIComponent(hash)}/ai`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || "Failed to load AI insight");
        return;
      }
      setInsight(data as AIInsight);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, [hash]);

  const copyRootCause = () => {
    if (insight?.rootCause) {
      navigator.clipboard.writeText(insight.rootCause);
    }
  };

  return (
    <div className="bg-surface border border-border-dim rounded-xl overflow-hidden flex flex-col shadow-glow">
      <div className="px-4 py-3 border-b border-border-dim bg-surface-highlight/30 flex justify-between items-center">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="size-[18px]" />
          <h3 className="font-display font-semibold text-sm tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
            ClawAI Insight
          </h3>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col gap-4 min-h-0 overflow-y-auto">
        {error && (
          <div className="flex items-center gap-2 text-error text-sm">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-text-muted">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm">Analyzing transaction...</p>
          </div>
        )}

        {!loading && insight && (
          <>
            <div className="text-sm text-text-main leading-relaxed font-sans">
              <span className="text-text-muted text-xs uppercase tracking-wide block mb-2">
                Root Cause Analysis
              </span>
              <div className="relative group">
                <p className="pr-8">{insight.rootCause}</p>
                <button
                  type="button"
                  onClick={copyRootCause}
                  className="absolute top-0 right-0 p-1 rounded text-text-muted hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Copy"
                >
                  <Copy className="size-3.5" />
                </button>
              </div>
              {insight.confidence > 0 && (
                <p className="text-xs text-text-muted mt-2">
                  Confidence: {Math.round(insight.confidence * 100)}%
                </p>
              )}
            </div>

            {insight.fixSuggestions.length > 0 && (
              <div>
                <span className="text-text-muted text-xs uppercase tracking-wide block mb-2">
                  Fix Suggestions
                </span>
                <ul className="space-y-2">
                  {insight.fixSuggestions.map((s, i) => (
                    <li
                      key={i}
                      className={`text-sm border-l-2 pl-3 ${
                        s.priority === "high"
                          ? "border-error"
                          : s.priority === "medium"
                            ? "border-warning"
                            : "border-border-dim"
                      }`}
                    >
                      <span className="font-medium text-text-main">{s.action}</span>
                      {s.details && (
                        <p className="text-text-muted text-xs mt-0.5">{s.details}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {insight.nextChecks.length > 0 && (
              <div>
                <span className="text-text-muted text-xs uppercase tracking-wide block mb-2">
                  Next Checks
                </span>
                <ul className="text-sm text-text-muted list-disc list-inside space-y-1">
                  {insight.nextChecks.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            {insight.codeSnippet && (
              <div>
                <span className="text-text-muted text-xs uppercase tracking-wide block mb-2">
                  {insight.codeSnippet.contract}
                  {insight.codeSnippet.line != null && `:${insight.codeSnippet.line}`}
                </span>
                <pre className="bg-background-dark border border-border-dim rounded-lg p-3 font-mono text-xs overflow-x-auto whitespace-pre-wrap break-words">
                  {insight.codeSnippet.code}
                </pre>
              </div>
            )}
          </>
        )}

        {!loading && !insight && (
          <div className="flex flex-col gap-3 flex-1">
            {status === "success" ? (
              <p className="text-sm text-text-muted">
                Transaction succeeded. You can still ask AI to explain what happened.
              </p>
            ) : (
              <p className="text-sm text-text-muted">
                Get an AI-powered root cause analysis and fix suggestions for this
                failed transaction.
              </p>
            )}
            <button
              type="button"
              onClick={fetchInsight}
              disabled={loading}
              className="mt-auto w-full py-2.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Brain className="size-4" />
              {status === "success" ? "Explain with AI" : "Fix with AI"}
            </button>
          </div>
        )}

        {!loading && insight && (
          <button
            type="button"
            onClick={fetchInsight}
            className="mt-2 w-full py-2 rounded-lg border border-border-dim text-text-muted text-xs hover:bg-surface-highlight transition-colors"
          >
            Refresh analysis
          </button>
        )}
      </div>
    </div>
  );
}
