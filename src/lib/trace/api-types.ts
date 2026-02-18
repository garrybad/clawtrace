/**
 * API response types for /api/trace endpoint.
 * 
 * New structure: transaction + contracts + trace + metadata
 */

import type { TransactionData } from "./services/transaction-service";
import type { ContractData } from "./services/contract-service";
import type { TenderlyTraceResult } from "./tenderly-parser";

export interface TraceResponse {
  /** Transaction data (tx + receipt + block + summary) */
  transaction: TransactionData;
  
  /** Contract data map (address -> ContractData) */
  contracts: Record<string, ContractData>;
  
  /** Parsed trace in Tenderly format */
  trace: TenderlyTraceResult;
  
  /** Metadata about the trace */
  metadata: {
    totalSteps: number;
    maxDepth: number;
    totalGasUsed: number;
    hasStorageOps: boolean;
    hasEvents: boolean;
    parsedAt: number;
  };
}
