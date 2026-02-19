/**
 * Groq API client for AI analysis
 */

import Groq from "groq-sdk";
import type { AIInsight } from "./types";

const MODEL = "openai/gpt-oss-120b";
const TIMEOUT_MS = 30_000;

function getClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

/**
 * Request AI insight for a transaction trace
 */
export async function getAIInsight(payload: string): Promise<AIInsight | null> {
  const client = getClient();
  if (!client) {
    console.warn("GROQ_API_KEY not set, AI insight disabled");
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const completion = await client.chat.completions.create(
      {
        model: MODEL,
        messages: [
          {
            role: "system",
            content: `You are a smart contract debugging assistant for EVM/BNB Chain. Analyze transaction trace failures and provide:
1. rootCause: clear natural language explanation of why the tx failed (1-3 sentences)
2. confidence: number 0-1
3. fixSuggestions: array of { action: string, priority: "high"|"medium"|"low", details?: string }
4. nextChecks: array of short strings (what to verify next)
5. codeSnippet: optional { contract: string, line: number, code: string } if relevant

The payload includes source code for relevant contracts in sourceCodes field (address -> { name, code }).
Use the source code to provide accurate line numbers and code context in your analysis.
Respond only with valid JSON matching this shape.`,
          },
          {
            role: "user",
            content: payload,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      },
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);
    const content = completion.choices[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as AIInsight;
    if (!parsed.rootCause || typeof parsed.confidence !== "number") {
      return null;
    }
    if (!Array.isArray(parsed.fixSuggestions)) parsed.fixSuggestions = [];
    if (!Array.isArray(parsed.nextChecks)) parsed.nextChecks = [];
    return parsed;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("[Groq AI] Error:", error);
    return null;
  }
}
