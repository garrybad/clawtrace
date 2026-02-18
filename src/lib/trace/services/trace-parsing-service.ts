/**
 * Trace Parsing Service: Fetch debug trace and parse to Tenderly format
 * 
 * Input: txHash + optional abiMap
 * Output: { structLogs, parsed: { tenderlyTrace } }
 */

import { createRPCClient } from "@/lib/rpc";
import { parseToTenderlyFormat } from "../tenderly-parser";
import type { StructLog } from "@/lib/rpc";
import type { TenderlyTraceResult } from "../tenderly-parser";
import type { Abi } from "viem";
import type { ContractData } from "./contract-service";

export interface TraceParsingData {
  structLogs: StructLog[];
  gas: number;
  returnValue: string;
  parsed: {
    tenderlyTrace: TenderlyTraceResult;
  };
}

/**
 * Get trace data and parse to Tenderly format
 */
export async function getTraceParsingData(
  hash: string,
  txFrom: string,
  txTo: string | null,
  txInput: string | undefined,
  blockTimestamp: string | undefined,
  abiMap?: Map<string, Abi>,
  contractMap?: Map<string, ContractData>
): Promise<TraceParsingData> {
  const client = createRPCClient();

  // Fetch debug trace
  const trace = await client.debugTraceTransaction(hash, {
    timeout: "120s",
    enableMemory: true,
    enableReturnData: true,
    disableStack: false,
    disableStorage: false,
  });

  // Build contract name map for parser
  const contractNameMap = contractMap
    ? new Map<string, { contractName?: string }>()
    : undefined;
  if (contractMap && contractNameMap) {
    contractMap.forEach((contract, addr) => {
      contractNameMap.set(addr, { contractName: contract.contractName });
    });
  }

  // Parse to Tenderly format
  const tenderlyTrace = parseToTenderlyFormat(
    trace.structLogs,
    hash,
    txFrom,
    txTo,
    txInput,
    blockTimestamp,
    abiMap,
    contractNameMap
  );

  return {
    structLogs: trace.structLogs,
    gas: trace.gas,
    returnValue: trace.returnValue,
    parsed: {
      tenderlyTrace,
    },
  };
}
