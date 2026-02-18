/**
 * Script untuk test parser format Tenderly dari trace.json
 * 
 * Usage:
 *   npx tsx scripts/parse-tenderly-format.ts <txHash>
 *   atau
 *   npx tsx scripts/parse-tenderly-format.ts trace.json <txHash>
 */

import { config } from "dotenv";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { parseRawTrace } from "../src/lib/trace/raw-trace";
import { parseToTenderlyFormat } from "../src/lib/trace/tenderly-parser";
import { createRPCClient } from "../src/lib/rpc";
import { createEtherscanClient } from "../src/lib/etherscan/client";
import type { Abi } from "viem";

// Load environment variables
config();

async function main() {
  // Parse arguments
  // Usage: npx tsx scripts/parse-tenderly-format.ts <txHash>
  //   atau: npx tsx scripts/parse-tenderly-format.ts trace.json <txHash>
  let txHash: string | undefined;
  let traceFile = "trace.json";

  if (process.argv[2]?.endsWith(".json")) {
    traceFile = process.argv[2];
    txHash = process.argv[3];
  } else {
    txHash = process.argv[2];
  }

  if (!txHash || !txHash.startsWith("0x")) {
    console.error("Usage: npx tsx scripts/parse-tenderly-format.ts <txHash>");
    console.error("   atau: npx tsx scripts/parse-tenderly-format.ts trace.json <txHash>");
    process.exit(1);
  }

  console.log("Transaction Hash:", txHash);
  console.log("Reading trace file:", traceFile);

  // Read trace file
  const filePath = resolve(process.cwd(), traceFile);
  const raw = JSON.parse(readFileSync(filePath, "utf-8"));

  const trace = parseRawTrace(raw);
  console.log("\nRaw result: gas=%s returnValue=%s structLogs=%d", 
    trace.gas, trace.returnValue?.slice(0, 20) + "...", trace.structLogs.length);

  // Fetch transaction dari RPC
  console.log("\n📥 Fetching transaction from RPC...");
  const rpcClient = createRPCClient();
  const tx = await rpcClient.getTransaction(txHash);

console.log("✅ Transaction fetched:");
console.log("   From:", tx.from);
console.log("   To:", tx.to || "(Contract Creation)");
console.log("   Input:", tx.input.slice(0, 50) + "...");

// Fetch ABI untuk semua contract addresses yang ditemukan
console.log("\n📥 Fetching ABIs from Etherscan...");
const etherscanClient = createEtherscanClient();
const abiMap = new Map<string, Abi>();

// Collect unique contract addresses dari trace
const addresses = new Set<string>();
if (tx.to) addresses.add(tx.to.toLowerCase());

// Extract addresses dari CALL ops dalam structLogs
for (const log of trace.structLogs) {
  if (log.op === "CALL" || log.op === "DELEGATECALL" || log.op === "STATICCALL" || log.op === "CALLCODE") {
    if (log.stack && log.stack.length > 0) {
      // Extract address dari stack (index 1 from end untuk CALL, index 1 untuk DELEGATECALL)
      const stackLen = log.stack.length;
      let addrIdx = -1;
      if (log.op === "CALL" || log.op === "CALLCODE") {
        addrIdx = stackLen - 1 - 1; // to is 1st from end
      } else {
        addrIdx = stackLen - 1 - 1; // to is 1st from end
      }
      if (addrIdx >= 0 && addrIdx < stackLen) {
        const addrHex = log.stack[addrIdx];
        if (addrHex && addrHex !== "0x0") {
          const addr = `0x${BigInt(addrHex).toString(16).padStart(40, "0")}`;
          if (addr.length === 42) {
            addresses.add(addr.toLowerCase());
          }
        }
      }
    }
  }
}

console.log(`   Found ${addresses.size} unique contract addresses`);

// Fetch ABI untuk setiap address
let fetchedCount = 0;
for (const addr of addresses) {
  if (etherscanClient) {
    const abi = await etherscanClient.getABI(addr);
    if (abi) {
      abiMap.set(addr, abi);
      fetchedCount++;
      console.log(`   ✅ ABI fetched for ${addr.slice(0, 10)}...`);
    } else {
      console.log(`   ⚠️  No ABI found for ${addr.slice(0, 10)}...`);
    }
  }
}

console.log(`\n✅ Fetched ${fetchedCount} ABIs`);

// Get block timestamp jika perlu
let blockTimestamp: string | undefined;
if (tx.blockNumber) {
  try {
    const block = await rpcClient.getBlock(tx.blockNumber);
    blockTimestamp = block.timestamp;
  } catch (error) {
    console.warn("Failed to fetch block timestamp:", error);
  }
}

// Parse dengan ABI
console.log("\n🔬 Parsing trace dengan ABI decoding...");
const tenderlyResult = parseToTenderlyFormat(
  trace.structLogs,
  tx.hash,
  tx.from,
  tx.to,
  tx.input,
  blockTimestamp,
  abiMap.size > 0 ? abiMap : undefined
);

console.log("\n=== Tenderly Format Result ===");
console.log("\nCall Trace:");
console.log(JSON.stringify(tenderlyResult.call_trace, null, 2));

console.log("\n\nStack Trace:");
console.log(JSON.stringify(tenderlyResult.stack_trace, null, 2));

console.log("\n\nSummary:");
console.log("- Root call_type:", tenderlyResult.call_trace.call_type);
console.log("- Root gas_used:", tenderlyResult.call_trace.gas_used);
console.log("- Root has calls:", tenderlyResult.call_trace.calls?.length || 0);
console.log("- Stack trace entries:", tenderlyResult.stack_trace.length);
console.log("- Root error:", tenderlyResult.call_trace.error || "none");

if (tenderlyResult.call_trace.calls && tenderlyResult.call_trace.calls.length > 0) {
  console.log("\nFirst nested call:");
  const firstCall = tenderlyResult.call_trace.calls[0];
  console.log("- call_type:", firstCall.call_type);
  console.log("- function_name:", firstCall.function_name || "none");
  console.log("- gas_used:", firstCall.gas_used);
  console.log("- has nested calls:", firstCall.calls?.length || 0);
  
  if (firstCall.storage_slot) {
    console.log("- storage_slot:", firstCall.storage_slot[0]);
    console.log("- storage_value:", firstCall.storage_value_original?.[0] || "none");
  }
}

  console.log("\nDone. Output saved to tenderly-output.json");
  writeFileSync("tenderly-output.json", JSON.stringify(tenderlyResult, null, 2));
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
