/**
 * Build compact payload for Groq AI from trace data
 */

import type { TraceResponse } from "@/lib/trace/api-types";
import type { TenderlyCallTrace } from "@/lib/trace/tenderly-parser";

function findFailingCall(trace: TenderlyCallTrace): TenderlyCallTrace | null {
  if (trace.error || trace.error_message) return trace;
  if (!trace.calls) return null;
  for (const c of trace.calls) {
    const found = findFailingCall(c);
    if (found) return found;
  }
  return null;
}

/**
 * Build a compact JSON payload for the AI (no full structLogs)
 * Includes source code for relevant contracts
 */
export function buildAIPayload(data: TraceResponse): string {
  const { transaction, trace, contracts } = data;
  const summary = transaction.summary;
  const failing = findFailingCall(trace.call_trace);

  // Collect unique contract addresses from stackTrace and failure/rootCall
  const relevantAddresses = new Set<string>();
  trace.stack_trace.forEach((s) => {
    if (s.contract) relevantAddresses.add(s.contract.toLowerCase());
  });
  if (failing?.to) relevantAddresses.add(failing.to.toLowerCase());
  if (trace.call_trace.to) relevantAddresses.add(trace.call_trace.to.toLowerCase());

  // Build source code map for relevant contracts (limit to 10000 chars per contract)
  const sourceCodes: Record<string, { name?: string; code: string }> = {};
  relevantAddresses.forEach((addr) => {
    const contract = contracts[addr];
    if (contract?.sourceCode) {
      sourceCodes[addr] = {
        name: contract.contractName,
        code: contract.sourceCode.length > 10000
          ? contract.sourceCode.slice(0, 10000) + "\n... (truncated)"
          : contract.sourceCode,
      };
    }
  });

  const payload = {
    summary: {
      status: summary.status,
      from: summary.from,
      to: summary.to,
      gasUsed: summary.gasUsed,
      gasLimit: summary.gasLimit,
      blockNumber: summary.blockNumber,
    },
    stackTrace: trace.stack_trace.map((s) => ({
      contract: s.contract,
      name: s.name,
      op: s.op,
      error: s.error,
      error_message: s.error_message,
    })),
    failure: failing
      ? {
          function_name: failing.function_name,
          call_type: failing.call_type,
          from: failing.from,
          to: failing.to,
          error: failing.error,
          error_message: failing.error_message,
          error_hex_data: failing.error_hex_data,
          input: failing.input ? `${failing.input.slice(0, 66)}...` : undefined,
        }
      : null,
    rootCall: {
      function_name: trace.call_trace.function_name,
      to: trace.call_trace.to,
      inputPreview: trace.call_trace.input
        ? `${trace.call_trace.input.slice(0, 66)}...`
        : undefined,
    },
    sourceCodes: Object.keys(sourceCodes).length > 0 ? sourceCodes : undefined,
  };

  return JSON.stringify(payload, null, 0);
}
