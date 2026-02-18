/**
 * Test script untuk verify RPC client & debug_traceTransaction
 * 
 * Usage:
 *   npx tsx scripts/test-rpc.ts <txHash>
 * 
 * Example:
 *   npx tsx scripts/test-rpc.ts 0x1234...
 */

// Load environment variables
import { config } from "dotenv";
config();

import { createRPCClient, RPCClient } from "../src/lib/rpc";

async function testRPC(txHash: string) {
  console.log("🔍 Testing RPC Client...\n");
  console.log(`Transaction Hash: ${txHash}\n`);

  // Validate hash
  if (!RPCClient.validateTxHash(txHash)) {
    console.error("❌ Invalid transaction hash format!");
    console.error("Expected format: 0x followed by 64 hex characters");
    process.exit(1);
  }

  try {
    const client = createRPCClient();
    console.log("✅ RPC Client created\n");

    // Test 1: Get transaction
    console.log("📥 Fetching transaction...");
    const tx = await client.getTransaction(txHash);
    console.log("✅ Transaction fetched:");
    console.log(`   From: ${tx.from}`);
    console.log(`   To: ${tx.to || "(Contract Creation)"}`);
    console.log(`   Value: ${tx.value}`);
    console.log(`   Gas: ${tx.gas}`);
    console.log(`   Input: ${tx.input.slice(0, 20)}...\n`);

    // Test 2: Get receipt
    console.log("📥 Fetching transaction receipt...");
    const receipt = await client.getTransactionReceipt(txHash);
    console.log("✅ Receipt fetched:");
    console.log(`   Status: ${receipt.status === "0x1" ? "✅ Success" : "❌ Failed/Reverted"}`);
    console.log(`   Gas Used: ${receipt.gasUsed}`);
    console.log(`   Block: ${receipt.blockNumber}`);
    console.log(`   Logs: ${receipt.logs.length}\n`);

    // Test 3: Get block
    if (receipt.blockNumber) {
      console.log("📥 Fetching block...");
      const block = await client.getBlock(receipt.blockNumber);
      console.log("✅ Block fetched:");
      console.log(`   Number: ${block.number}`);
      console.log(`   Timestamp: ${new Date(parseInt(block.timestamp, 16) * 1000).toISOString()}\n`);
    }

    // Test 4: Debug trace transaction (THE MAIN ONE!)
    console.log("🔬 Debug tracing transaction (this may take a while)...");
    console.log("   Options: enableMemory=true, enableReturnData=true\n");

    const startTime = Date.now();
    const trace = await client.debugTraceTransaction(txHash, {
      timeout: "120s",
      enableMemory: true,
      enableReturnData: true,
      disableStack: false,
      disableStorage: false,
    });
    const elapsed = Date.now() - startTime;

    console.log("✅ Trace completed!");
    console.log(`   Time taken: ${(elapsed / 1000).toFixed(2)}s`);
    console.log(`   Total gas: ${trace.gas}`);
    console.log(`   Return value: ${trace.returnValue.slice(0, 20)}...`);
    console.log(`   StructLogs count: ${trace.structLogs.length}\n`);

    // Show sample structLogs
    console.log("📊 Sample structLogs (first 10):");
    trace.structLogs.slice(0, 10).forEach((log, i) => {
      console.log(`   [${i}] ${log.op} @ depth=${log.depth}, gas=${log.gas}, pc=${log.pc}`);
    });

    if (trace.structLogs.length > 10) {
      console.log(`   ... and ${trace.structLogs.length - 10} more\n`);
    }

    // Find REVERT if any
    const reverts = trace.structLogs.filter((log) => log.op === "REVERT");
    if (reverts.length > 0) {
      console.log(`⚠️  Found ${reverts.length} REVERT operation(s):`);
      reverts.forEach((log, i) => {
        console.log(`   [${i + 1}] REVERT @ depth=${log.depth}, pc=${log.pc}`);
        if (log.error) {
          console.log(`       Error: ${log.error}`);
        }
      });
      console.log();
    }

    // Show operation statistics
    const opCounts: Record<string, number> = {};
    trace.structLogs.forEach((log) => {
      opCounts[log.op] = (opCounts[log.op] || 0) + 1;
    });

    console.log("📈 Operation statistics:");
    Object.entries(opCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([op, count]) => {
        console.log(`   ${op}: ${count}`);
      });

    console.log("\n✅ All tests passed! RPC client is working correctly.\n");

  } catch (error: any) {
    console.error("\n❌ Error occurred:");
    console.error(error.message);
    if (error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Main
const txHash = process.argv[2];

if (!txHash) {
  console.error("❌ Usage: npx tsx scripts/test-rpc.ts <txHash>");
  console.error("\nExample:");
  console.error("  npx tsx scripts/test-rpc.ts 0x1234567890abcdef...");
  process.exit(1);
}

testRPC(txHash).catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
