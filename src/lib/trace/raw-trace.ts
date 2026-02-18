/**
 * Parse raw debug_traceTransaction output (e.g. from trace.json or RPC response).
 *
 * Raw format can be:
 * - Full JSON-RPC envelope: { jsonrpc, id, result: { gas, failed?, returnValue, structLogs } }
 * - Or just result: { gas, failed?, returnValue, structLogs }
 *
 * Fields like pc, gas, gasCost, depth may be numbers or hex strings depending on node/export.
 * This module normalizes everything to the StructLog shape expected by the parser.
 */

import type { StructLog, TraceResult } from "@/lib/rpc";

export type RawTraceEnvelope = {
  jsonrpc?: string;
  id?: number;
  result: RawTraceResult;
};

export type RawTraceResult = {
  gas: number | string;
  failed?: boolean;
  returnValue?: string;
  structLogs: RawStructLog[];
};

export type RawStructLog = {
  pc?: number | string;
  op: string;
  gas?: number | string;
  gasCost?: number | string;
  depth?: number | string;
  stack?: string[];
  memory?: string[];
  storage?: Record<string, string>;
  error?: string;
  returnData?: string;
  refund?: number | string;
};

function toNumber(v: number | string | undefined): number {
  if (v === undefined) return 0;
  if (typeof v === "number") return v;
  const s = String(v).replace(/^0x/, "");
  return s ? parseInt(s, 16) : 0;
}

/**
 * Normalize storage record: ensure keys are 0x-prefixed for consistent lookup.
 */
function normalizeStorage(storage: Record<string, string> | undefined): Record<string, string> {
  if (!storage || typeof storage !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(storage)) {
    const key = k.startsWith("0x") ? k : `0x${k}`;
    const val = typeof v === "string" ? (v.startsWith("0x") ? v : `0x${v}`) : `0x${String(v)}`;
    out[key] = val;
  }
  return out;
}

/**
 * Convert a single raw struct log to StructLog (numbers, optional fields).
 */
export function normalizeStructLog(raw: RawStructLog, index: number): StructLog {
  return {
    pc: toNumber(raw.pc),
    op: raw.op,
    gas: toNumber(raw.gas),
    gasCost: toNumber(raw.gasCost),
    depth: toNumber(raw.depth),
    stack: Array.isArray(raw.stack) ? raw.stack : [],
    memory: Array.isArray(raw.memory) ? raw.memory : [],
    storage: normalizeStorage(raw.storage),
    error: raw.error,
  };
}

/**
 * Extract result object from either envelope or bare result.
 */
export function extractResult(json: RawTraceEnvelope | RawTraceResult): RawTraceResult {
  if ("result" in json && json.result && Array.isArray((json as RawTraceEnvelope).result?.structLogs)) {
    return (json as RawTraceEnvelope).result;
  }
  if (Array.isArray((json as RawTraceResult).structLogs)) {
    return json as RawTraceResult;
  }
  throw new Error("Invalid raw trace: missing result.structLogs or structLogs");
}

/**
 * Parse raw trace JSON (file content or API response) into TraceResult + normalized StructLog[].
 */
export function parseRawTrace(json: RawTraceEnvelope | RawTraceResult): TraceResult {
  const result = extractResult(json);
  const structLogs: StructLog[] = (result.structLogs || []).map((log, i) =>
    normalizeStructLog(log, i)
  );
  return {
    gas: toNumber(result.gas),
    returnValue: result.returnValue ?? "0x",
    structLogs,
  };
}
