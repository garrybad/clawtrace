/**
 * API Route: GET /api/trace?hash=0x...
 *
 * Returns full trace analysis for a transaction hash.
 */

import { NextRequest, NextResponse } from "next/server";
import { getTraceData } from "@/lib/trace/trace-service";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const hash = searchParams.get("hash");

  if (!hash) {
    return NextResponse.json(
      { error: "Missing 'hash' query parameter" },
      { status: 400 }
    );
  }

  try {
    const data = await getTraceData(hash);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[API /trace] Error:", error);

    return NextResponse.json(
      {
        error: "Failed to trace transaction",
        message: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
