/**
 * AI insight types for ClawTrace diagnosis panel
 */

export interface FixSuggestion {
  action: string;
  priority: "high" | "medium" | "low";
  details?: string;
}

export interface AIInsight {
  rootCause: string;
  confidence: number;
  fixSuggestions: FixSuggestion[];
  nextChecks: string[];
  codeSnippet?: {
    contract: string;
    line: number;
    code: string;
  };
}
