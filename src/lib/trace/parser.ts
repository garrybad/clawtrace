import type { StructLog } from "@/lib/rpc";
import {
  type ParseTraceOptions,
  type ParseTraceResult,
  type TraceNode,
  type TraceNodeType,
} from "./types";
import { decodeRevertData } from "./decoder";

const INTERESTING_OPS = new Set<string>([
  "CALL",
  "CALLCODE",
  "DELEGATECALL",
  "STATICCALL",
  "CREATE",
  "CREATE2",
  "SELFDESTRUCT",
  "SLOAD",
  "SSTORE",
  "LOG0",
  "LOG1",
  "LOG2",
  "LOG3",
  "LOG4",
  "JUMP",
  "JUMPI",
  "REVERT",
  "RETURN",
  "STOP",
]);

const ZERO = BigInt(0);
const TWO = BigInt(2);

function classifyType(op: string): TraceNodeType {
  if (INTERESTING_OPS.has(op)) {
    return op as TraceNodeType;
  }
  return "INTERNAL";
}

function hexToBigInt(value: string | undefined): bigint {
  if (!value) return ZERO;
  return BigInt(value);
}

function extractStackItem(stack: string[] | undefined, indexFromEnd: number): bigint {
  if (!stack || stack.length === 0) return ZERO;
  const idx = stack.length - 1 - indexFromEnd;
  if (idx < 0 || idx >= stack.length) return ZERO;
  return hexToBigInt(stack[idx]);
}

/** Get storage value by slot; raw trace may use 32-byte keys with or without 0x. */
function getStorageValue(storage: Record<string, string> | undefined, slotHex: string): string | undefined {
  if (!storage) return undefined;
  const withPrefix = slotHex.startsWith("0x") ? slotHex : `0x${slotHex}`;
  const withoutPrefix = withPrefix.slice(2);
  const padded = "0x" + withoutPrefix.padStart(64, "0").slice(-64);
  const paddedNoPrefix = padded.slice(2);
  return storage[withPrefix] ?? storage[withoutPrefix] ?? storage[slotHex]
    ?? storage[padded] ?? storage[paddedNoPrefix];
}

function extractRevertData(memory: string[] | undefined, offset: bigint, size: bigint): string | undefined {
  if (!memory || size === ZERO) return undefined;
  // memory is array of 32-byte words as hex strings without 0x padding semantics
  // Simplest: join all words into one big hex string and slice by byte offset.
  const joined = memory.map((w) => w.replace(/^0x/, "")).join("");
  const start = Number(offset * TWO);
  const end = Number((offset + size) * TWO);
  if (start >= joined.length) return "0x";
  const slice = joined.slice(start, Math.min(end, joined.length));
  return `0x${slice}`;
}

/**
 * Convert raw structLogs into a generic tree of TraceNode.
 *
 * This is the "step 2" baseline:
 * - preserves original order
 * - infers parent/child relationships from depth
 * - computes basic gas deltas
 */
export function parseStructLogsToNodes(
  structLogs: StructLog[],
  options: ParseTraceOptions = {}
): ParseTraceResult {
  const { includeInternalOps = false } = options;

  const nodes: TraceNode[] = [];
  const roots: TraceNode[] = [];
  const opCounts: Record<string, number> = {};
  const parentsByDepth = new Map<number, TraceNode>();

  let maxDepth = 0;
  let totalGasCost = 0;

  for (let i = 0; i < structLogs.length; i += 1) {
    const log = structLogs[i];
    const prev = structLogs[i - 1];

    const gasAfter = log.gas;
    const gasBefore =
      i === 0 ? gasAfter + log.gasCost : prev.gas + prev.gasCost;
    const rawCost = gasBefore - gasAfter;
    const gasCost = rawCost >= 0 ? rawCost : 0;

    const type = classifyType(log.op);
    if (!includeInternalOps && type === "INTERNAL") {
      // Still update counters/parents so depth relationships stay consistent.
      if (log.depth > maxDepth) maxDepth = log.depth;
      opCounts[log.op] = (opCounts[log.op] || 0) + 1;

      // Maintain last node per depth even if we don't expose it externally.
      const parent = parentsByDepth.get(log.depth - 1);
      const ghostNodeId = `ghost-${i}-${log.depth}-${log.op}`;
      const ghostNode: TraceNode = {
        id: ghostNodeId,
        type,
        op: log.op,
        depth: log.depth,
        stepIndex: i,
        pc: log.pc,
        gasBefore,
        gasAfter,
        gasCost,
        parentId: parent?.id,
        children: [],
        error: log.error,
      };
      parentsByDepth.set(log.depth, ghostNode);
      continue;
    }

    const id = `${i}-${log.depth}-${log.op}`;
    const parent = parentsByDepth.get(log.depth - 1);

    const node: TraceNode = {
      id,
      type,
      op: log.op,
      depth: log.depth,
      stepIndex: i,
      pc: log.pc,
      gasBefore,
      gasAfter,
      gasCost,
      parentId: parent?.id,
      children: [],
      error: log.error,
    };

    // Operation-specific enrichment (Step 3: operation detection)
    switch (log.op) {
      case "SLOAD": {
        const slot = extractStackItem(log.stack, 0);
        node.storageSlot = `0x${slot.toString(16)}`;
        node.storageValue = getStorageValue(log.storage, node.storageSlot);
        break;
      }
      case "SSTORE": {
        const slot = extractStackItem(log.stack, 0);
        const value = extractStackItem(log.stack, 1);
        node.storageSlot = `0x${slot.toString(16)}`;
        node.storageValue = `0x${value.toString(16)}`;
        // log.storage in raw trace is state after this op; we don't set storageValueBefore here
        break;
      }
      case "LOG0":
      case "LOG1":
      case "LOG2":
      case "LOG3":
      case "LOG4": {
        // topics & data are not directly available in structLogs; best-effort via stack/memory is complex.
        // For now we only mark op type; event decoding can be a later step.
        break;
      }
      case "REVERT": {
        const offset = extractStackItem(log.stack, 0);
        const size = extractStackItem(log.stack, 1);
        const revertData = extractRevertData(log.memory, offset, size);
        if (revertData && revertData !== "0x") {
          const decoded = decodeRevertData(revertData);
          node.input = revertData;
          if (decoded) {
            node.decodedError = decoded;
          }
        }
        break;
      }
      default:
        break;
    }

    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }

    nodes.push(node);
    parentsByDepth.set(log.depth, node);

    if (log.depth > maxDepth) {
      maxDepth = log.depth;
    }

    totalGasCost += gasCost;
    opCounts[log.op] = (opCounts[log.op] || 0) + 1;
  }

  return {
    nodes,
    roots,
    maxDepth,
    totalSteps: structLogs.length,
    totalGasCost,
    opCounts,
  };
}

