/**
 * Parse raw trace.json (debug_traceTransaction output) via parseRawTrace + parser.
 *
 * Usage:
 *   npx tsx scripts/parse-trace-json.ts [path-to-trace.json]
 *
 * Default path: trace.json (project root)
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { parseRawTrace } from "../src/lib/trace/raw-trace";
import { parseStructLogsToNodes } from "../src/lib/trace/parser";

const filePath = resolve(process.cwd(), process.argv[2] || "trace.json");

console.log("Reading:", filePath);
const raw = JSON.parse(readFileSync(filePath, "utf-8"));

const trace = parseRawTrace(raw);
console.log("\nRaw result: gas=%s returnValue=%s structLogs=%d", trace.gas, trace.returnValue?.slice(0, 20) + "...", trace.structLogs.length);

const parsed = parseStructLogsToNodes(trace.structLogs, { includeInternalOps: false });
console.log("\nParsed: nodes=%d roots=%d maxDepth=%d totalSteps=%d", parsed.nodes.length, parsed.roots.length, parsed.maxDepth, parsed.totalSteps);
console.log("Op counts (sample):", Object.entries(parsed.opCounts).slice(0, 12));

if (parsed.roots.length > 0) {
  console.log("\nFirst root:", parsed.roots[0].op, "depth", parsed.roots[0].depth, "gasCost", parsed.roots[0].gasCost);
}
const sload = parsed.nodes.filter((n) => n.op === "SLOAD");
const sstore = parsed.nodes.filter((n) => n.op === "SSTORE");
if (sload.length) {
  const first = sload[0];
  console.log("\nFirst SLOAD: slot=%s value=%s", first.storageSlot, first.storageValue?.slice(0, 20));
}
if (sstore.length) {
  const first = sstore[0];
  console.log("First SSTORE: slot=%s value=%s", first.storageSlot, first.storageValue?.slice(0, 20));
}

console.log("\nDone.");
