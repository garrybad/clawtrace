/**
 * Main Trace Service: Orchestrator untuk aggregate semua data
 * 
 * Flow:
 * 1. Get transaction data (tx + receipt + block)
 * 2. Get trace (debug trace)
 * 3. Collect addresses dari trace
 * 4. Get contract data (ABI + source code) untuk semua addresses
 * 5. Re-parse trace dengan ABI
 * 6. Return combined data
 */

import { RPCClient } from "@/lib/rpc";
import { getTransactionData } from "./services/transaction-service";
import { getContractDataBatch } from "./services/contract-service";
import { getTraceParsingData } from "./services/trace-parsing-service";
import { collectContractAddresses } from "./services/address-collector";
import type { TraceResponse } from "./api-types";
import type { Abi } from "viem";

export async function getTraceData(hash: string): Promise<TraceResponse> {
  if (!hash) throw new Error("Missing transaction hash");
  if (!RPCClient.validateTxHash(hash)) {
    throw new Error("Invalid transaction hash format");
  }

  // Step 1: Get transaction data (tx + receipt + block + summary)
  const txData = await getTransactionData(hash);

  // Step 2: Get trace (raw structLogs) - without ABI first
  const traceData = await getTraceParsingData(
    hash,
    txData.tx.from,
    txData.tx.to,
    txData.tx.input,
    txData.block.timestamp,
    undefined, // No ABI yet
    undefined // No contract map yet
  );

  // Step 3: Collect contract addresses dari trace
  const addresses = collectContractAddresses(
    traceData.structLogs,
    txData.tx.to
  );

  // Step 4: Get contract data untuk semua addresses (with caching)
  const contractMap = await getContractDataBatch(Array.from(addresses));

  // Step 5: Build ABI map untuk parsing
  const abiMap = new Map<string, Abi>();
  contractMap.forEach((contract, addr) => {
    if (contract.abi) {
      abiMap.set(addr, contract.abi);
    }
  });

  // Step 6: Re-parse trace dengan ABI dan contract map (jika ada)
  const finalTraceData = abiMap.size > 0 || contractMap.size > 0
    ? await getTraceParsingData(
        hash,
        txData.tx.from,
        txData.tx.to,
        txData.tx.input,
        txData.block.timestamp,
        abiMap,
        contractMap
      )
    : traceData;

  // Step 7: Build metadata
  const metadata = {
    totalSteps: traceData.structLogs.length,
    maxDepth: Math.max(...traceData.structLogs.map((log) => log.depth)),
    totalGasUsed: parseInt(txData.summary.gasUsed, 16),
    hasStorageOps: traceData.structLogs.some(
      (log) => log.op === "SLOAD" || log.op === "SSTORE"
    ),
    hasEvents: traceData.structLogs.some((log) => log.op.startsWith("LOG")),
    parsedAt: Date.now(),
  };

  // Step 8: Return combined data
  return {
    transaction: txData,
    contracts: Object.fromEntries(contractMap), // Convert Map to object for JSON
    trace: finalTraceData.parsed.tenderlyTrace,
    metadata,
  };
}
