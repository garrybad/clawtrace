/**
 * Build transaction summary from tx, receipt, and block data.
 */

import type { Transaction, TransactionReceipt, Block } from "@/lib/rpc";

export interface TransactionSummary {
  hash: string;
  status: "success" | "failed" | "reverted";
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string | null;
  value: string; // wei as hex
  gasUsed: string;
  gasLimit: string;
  effectiveGasPrice: string;
  contractAddress?: string;
  nonce: number;
}

export function buildTransactionSummary(
  tx: Transaction,
  receipt: TransactionReceipt,
  block: Block
): TransactionSummary {
  const status =
    receipt.status === "0x1"
      ? "success"
      : receipt.status === "0x0"
        ? "failed"
        : "reverted";

  return {
    hash: tx.hash,
    status,
    blockNumber: parseInt(receipt.blockNumber, 16),
    timestamp: parseInt(block.timestamp, 16),
    from: tx.from,
    to: tx.to || null,
    value: tx.value,
    gasUsed: receipt.gasUsed,
    gasLimit: tx.gas,
    effectiveGasPrice: receipt.effectiveGasPrice || tx.gasPrice || "0x0",
    contractAddress: receipt.contractAddress || undefined,
    nonce: parseInt(tx.nonce, 16),
  };
}
