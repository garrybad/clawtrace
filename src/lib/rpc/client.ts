/**
 * RPC Client for BNB Chain
 * Supports debug_traceTransaction and standard eth methods
 */

import { createPublicClient, http, type PublicClient } from "viem";
import { bscTestnet } from "viem/chains";
import type {
  StructLog,
  TraceResult,
  TraceOptions,
  Transaction,
  TransactionReceipt,
  Block,
} from "./types";

export interface RPCConfig {
  url: string;
  apiKey?: string;
  timeout?: number;
}

export class RPCClient {
  private client: PublicClient;
  private config: RPCConfig;

  constructor(config: RPCConfig) {
    this.config = config;

    // Create custom fetch that ALWAYS includes API key header (like curl)
    const customFetch: typeof fetch = async (
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> => {
      // Ensure headers object exists
      const headers = new Headers(init?.headers);
      
      // Always set Content-Type
      headers.set("Content-Type", "application/json");
      
      // ALWAYS include API key if configured (this is the key fix!)
      if (config.apiKey) {
        headers.set("x-api-key", config.apiKey);
      }


      return fetch(input, {
        ...init,
        headers,
        signal: config.timeout
          ? AbortSignal.timeout(config.timeout * 1000)
          : init?.signal,
      });
    };

    // Create viem public client with custom fetch
    this.client = createPublicClient({
      chain: bscTestnet, // BNB Testnet
      transport: http(config.url, {
        fetchFn: customFetch,
      }),
    });
  }

  /**
   * Get transaction by hash
   */
  async getTransaction(hash: string): Promise<Transaction> {
    const tx = await this.client.getTransaction({ hash: hash as `0x${string}` });
    return {
      hash: tx.hash,
      nonce: `0x${tx.nonce.toString(16)}`,
      blockHash: tx.blockHash || null,
      blockNumber: tx.blockNumber ? `0x${tx.blockNumber.toString(16)}` : null,
      transactionIndex: tx.transactionIndex
        ? `0x${tx.transactionIndex.toString(16)}`
        : null,
      from: tx.from,
      to: tx.to || null,
      value: `0x${tx.value.toString(16)}`,
      gasPrice: tx.gasPrice ? `0x${tx.gasPrice.toString(16)}` : "0x0",
      gas: `0x${tx.gas.toString(16)}`,
      input: tx.input,
    };
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(hash: string): Promise<TransactionReceipt> {
    const receipt = await this.client.getTransactionReceipt({
      hash: hash as `0x${string}`,
    });

    return {
      transactionHash: receipt.transactionHash,
      transactionIndex: `0x${receipt.transactionIndex.toString(16)}`,
      blockHash: receipt.blockHash,
      blockNumber: `0x${receipt.blockNumber.toString(16)}`,
      from: receipt.from,
      to: receipt.to || null,
      cumulativeGasUsed: `0x${receipt.cumulativeGasUsed.toString(16)}`,
      gasUsed: `0x${receipt.gasUsed.toString(16)}`,
      contractAddress: receipt.contractAddress || null,
      logs: receipt.logs.map((log) => ({
        address: log.address,
        topics: log.topics as string[],
        data: log.data,
        blockNumber: `0x${receipt.blockNumber.toString(16)}`,
        transactionHash: receipt.transactionHash,
        transactionIndex: `0x${receipt.transactionIndex.toString(16)}`,
        blockHash: receipt.blockHash,
        logIndex: `0x${log.logIndex.toString(16)}`,
        removed: log.removed,
      })),
      logsBloom: receipt.logsBloom,
      status: receipt.status === "success" ? "0x1" : "0x0",
      effectiveGasPrice: (receipt as any).gasPrice
        ? `0x${(receipt as any).gasPrice.toString(16)}`
        : undefined,
    };
  }

  /**
   * Get block by number
   */
  async getBlock(blockNumber: string | number): Promise<Block> {
    const blockNumberHex =
      typeof blockNumber === "string"
        ? blockNumber
        : `0x${blockNumber.toString(16)}`;

    const block = await this.client.getBlock({
      blockNumber: BigInt(blockNumberHex),
      includeTransactions: false,
    });

    return {
      number: `0x${block.number.toString(16)}`,
      hash: block.hash,
      parentHash: block.parentHash,
      timestamp: `0x${block.timestamp.toString(16)}`,
      gasLimit: `0x${block.gasLimit.toString(16)}`,
      gasUsed: `0x${block.gasUsed.toString(16)}`,
      miner: block.miner,
      transactions: [],
    };
  }

  /**
   * Debug trace transaction (custom RPC call)
   * This is the core method for getting structLogs
   */
  async debugTraceTransaction(
    txHash: string,
    options: TraceOptions = {}
  ): Promise<TraceResult> {
    const {
      timeout = "120s",
      enableMemory = true,
      enableReturnData = true,
      disableStack = false,
      disableStorage = false,
    } = options;

    // Build request payload
    const params: [string, TraceOptions] = [
      txHash,
      {
        timeout,
        enableMemory,
        enableReturnData,
        disableStack,
        disableStorage,
      },
    ];

    // Make raw RPC call since viem doesn't have built-in debug_traceTransaction
    const response = await fetch(this.config.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.config.apiKey && { "x-api-key": this.config.apiKey }),
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "debug_traceTransaction",
        params,
      }),
      signal: this.config.timeout
        ? AbortSignal.timeout(this.config.timeout * 1000)
        : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `RPC call failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const json = await response.json();

    if (json.error) {
      throw new Error(`RPC error: ${json.error.message} (code: ${json.error.code})`);
    }

    const result = json.result;

    // Parse structLogs (pc/gas/gasCost/depth may be number or hex string)
    const toNum = (v: unknown): number => {
      if (typeof v === "number") return v;
      const s = String(v ?? "").replace(/^0x/, "");
      return s ? parseInt(s, 16) : 0;
    };
    const structLogs: StructLog[] = (result.structLogs || []).map(
      (log: any) => ({
        pc: toNum(log.pc),
        op: log.op,
        gas: toNum(log.gas),
        gasCost: toNum(log.gasCost),
        depth: toNum(log.depth),
        stack: log.stack || [],
        memory: log.memory || [],
        storage: log.storage || {},
        error: log.error,
      })
    );

    return {
      gas: toNum(result.gas),
      returnValue: result.returnValue || "0x",
      structLogs,
    };
  }

  /**
   * Validate transaction hash format
   */
  static validateTxHash(hash: string): boolean {
    return /^0x[0-9a-fA-F]{64}$/.test(hash);
  }
}

/**
 * Create RPC client instance from environment variables
 */
export function createRPCClient(): RPCClient {
  const url = process.env.RPC_URL || "https://rpc.demigohu.com";
  const apiKey = process.env.RPC_API_KEY;
  const timeout = process.env.RPC_TIMEOUT
    ? parseInt(process.env.RPC_TIMEOUT, 10)
    : 120; // default 120 seconds


  return new RPCClient({
    url,
    apiKey,
    timeout,
  });
}
