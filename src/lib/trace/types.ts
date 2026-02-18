/**
 * Core trace types built from debug_traceTransaction structLogs.
 *
 * Step 2 focuses on:
 * - mapping raw structLogs → generic TraceNode tree
 * - tracking depth/parent-child relationships
 * - computing basic gas cost per step
 */

export type TraceNodeType =
  | "CALL"
  | "DELEGATECALL"
  | "STATICCALL"
  | "CALLCODE"
  | "CREATE"
  | "CREATE2"
  | "SELFDESTRUCT"
  | "JUMP"
  | "JUMPI"
  | "SLOAD"
  | "SSTORE"
  | "LOG0"
  | "LOG1"
  | "LOG2"
  | "LOG3"
  | "LOG4"
  | "REVERT"
  | "RETURN"
  | "STOP"
  | "INTERNAL";

export interface TraceNode {
  /** Stable unique id for React rendering / lookups */
  id: string;

  /** Opcode category / node type */
  type: TraceNodeType;

  /** Raw opcode, e.g. "CALL", "SLOAD", "ADD" */
  op: string;

  /** Depth in the EVM call stack (0 = top level) */
  depth: number;

  /** Index within the original structLogs array */
  stepIndex: number;

  /** Program counter */
  pc: number;

  /** Gas remaining before executing this opcode (approx) */
  gasBefore: number;

  /** Gas remaining after executing this opcode */
  gasAfter: number;

  /** Gas consumed by this opcode (gasBefore - gasAfter, clamped to >= 0) */
  gasCost: number;

  /** Optional parent node id (undefined for roots) */
  parentId?: string;

  /** Child nodes (same structLogs, grouped by depth) */
  children: TraceNode[];

  /** Raw error string from tracer, if any */
  error?: string;

  // --- Call context (CALL/DELEGATECALL/STATICCALL/CALLCODE/CREATE) ---

  /** For CALL-like ops: caller address (best-effort, may be filled later) */
  from?: string;

  /** For CALL-like ops: callee address or created contract */
  to?: string;

  /** Value sent in wei (hex string), if available */
  value?: string;

  /** Calldata hex (0x...) if extracted */
  input?: string;

  /** Return data hex (0x...) if available */
  output?: string;

  // --- Storage operations (SLOAD / SSTORE) ---

  /** Storage slot key (hex) */
  storageSlot?: string;

  /** Storage value after op (hex) */
  storageValue?: string;

  /** Previous storage value before SSTORE (hex) */
  storageValueBefore?: string;

  // --- Events (LOG0-LOG4) ---

  eventTopics?: string[];
  eventData?: string;

  // --- Revert / error decoding ---

  decodedError?: {
    kind: "REVERT" | "PANIC" | "CUSTOM_ERROR" | "UNKNOWN";
    reason?: string;
    panicCode?: string; // bigint as hex string for JSON serialization
    customErrorSelector?: string;
    customErrorName?: string;
  };
}

export interface ParseTraceOptions {
  /**
   * If true, "noisy" internal opcodes (ADD, MUL, DUP, SWAP, etc) will still be
   * included as TraceNodes with type "INTERNAL". If false, only "interesting"
   * opcodes (CALL, SLOAD, SSTORE, LOG, REVERT, etc) are kept.
   *
   * Default: false (only interesting ops).
   */
  includeInternalOps?: boolean;
}

export interface ParseTraceResult {
  /** Flat list of all nodes in step order */
  nodes: TraceNode[];

  /** Root nodes (depth 0) */
  roots: TraceNode[];

  /** Maximum depth observed in the trace */
  maxDepth: number;

  /** Total number of structLogs processed */
  totalSteps: number;

  /** Sum of gasCost across all nodes (best-effort approximation) */
  totalGasCost: number;

  /** Simple opcode frequency breakdown (for debugging / analytics) */
  opCounts: Record<string, number>;
}

