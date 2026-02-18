/**
 * GET /api/trace/[hash]/ai
 * Returns AI insight for a transaction (root cause, fix suggestions)
 */

import { NextRequest, NextResponse } from "next/server";
import { getTraceData } from "@/lib/trace/trace-service";
import { buildAIPayload } from "@/lib/ai/prompt";
import { getAIInsight } from "@/lib/ai/groq";
import type { AIInsight } from "@/lib/ai/types";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ hash: string }> }
) {
  const { hash } = await context.params;

  if (!hash) {
    return NextResponse.json(
      { error: "Missing transaction hash" },
      { status: 400 }
    );
  }

  try {
    const data = await getTraceData(hash);
    const payload = buildAIPayload(data);
    const insight = await getAIInsight(payload);

    if (!insight) {
      return NextResponse.json(
        {
          error: "AI insight unavailable",
          hint: "Check GROQ_API_KEY or try again later",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(insight as AIInsight);
  } catch (error: unknown) {
    console.error("[API /trace/[hash]/ai]", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to get AI insight", message },
      { status: 500 }
    );
  }
}
