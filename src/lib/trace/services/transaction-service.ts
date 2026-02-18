/**
 * Transaction Service: Fetch and parse transaction data
 * 
 * Input: txHash
 * Output: { tx, receipt, block, summary }
 */

import { createRPCClient, RPCClient } from "@/lib/rpc";
import { buildTransactionSummary } from "../summary";
import type { Transaction, TransactionReceipt, Block } from "@/lib/rpc";
import type { TransactionSummary } from "../summary";

export interface TransactionData {
  tx: Transaction;
  receipt: TransactionReceipt;
  block: Block;
  summary: TransactionSummary;
}

/**
 * Get transaction data (tx + receipt + block + summary)
 */
export async function getTransactionData(hash: string): Promise<TransactionData> {
  if (!hash) throw new Error("Missing transaction hash");
  if (!RPCClient.validateTxHash(hash)) {
    throw new Error("Invalid transaction hash format");
  }

  const client = createRPCClient();

  // Fetch tx, receipt, and block in parallel
  const [tx, receipt] = await Promise.all([
    client.getTransaction(hash),
    client.getTransactionReceipt(hash),
  ]);

  // Get block after receipt (need blockNumber from receipt)
  const block = await client.getBlock(receipt.blockNumber);

  // Build summary
  const summary = buildTransactionSummary(tx, receipt, block);

  return {
    tx,
    receipt,
    block,
    summary,
  };
}
