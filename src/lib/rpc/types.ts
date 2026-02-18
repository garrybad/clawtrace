/**
 * RPC Types for BNB Chain debug_traceTransaction
 */

export interface StructLog {
  pc: number; // Program counter
  op: string; // Opcode name (e.g., "CALL", "SLOAD", "REVERT")
  gas: number; // Gas remaining
  gasCost: number; // Gas cost for this opcode
  depth: number; // Call depth (0 = top level)
  stack?: string[]; // Stack items (hex strings)
  memory?: string[]; // Memory array (32-byte words as hex)
  storage?: Record<string, string>; // Storage slots (if enabled)
  error?: string; // Error message if any
}

export interface TraceResult {
  gas: number;
  returnValue: string; // Return data hex
  structLogs: StructLog[];
}

export interface TraceOptions {
  timeout?: string; // e.g., "120s"
  enableMemory?: boolean;
  enableReturnData?: boolean;
  disableStack?: boolean;
  disableStorage?: boolean;
  tracer?: string; // e.g., "callTracer" (we won't use this, but good to have)
}

export interface Transaction {
  hash: string;
  nonce: string;
  blockHash: string | null;
  blockNumber: string | null;
  transactionIndex: string | null;
  from: string;
  to: string | null;
  value: string;
  gasPrice: string;
  gas: string;
  input: string;
  v?: string;
  r?: string;
  s?: string;
}

export interface TransactionReceipt {
  transactionHash: string;
  transactionIndex: string;
  blockHash: string;
  blockNumber: string;
  from: string;
  to: string | null;
  cumulativeGasUsed: string;
  gasUsed: string;
  contractAddress: string | null;
  logs: Log[];
  logsBloom: string;
  status: string; // "0x1" = success, "0x0" = failed/reverted
  effectiveGasPrice?: string;
}

export interface Log {
  address: string;
  topics: string[];
  data: string;
  blockNumber: string;
  transactionHash: string;
  transactionIndex: string;
  blockHash: string;
  logIndex: string;
  removed?: boolean;
}

export interface Block {
  number: string;
  hash: string;
  parentHash: string;
  timestamp: string;
  gasLimit: string;
  gasUsed: string;
  miner: string;
  transactions: string[] | Transaction[];
}
