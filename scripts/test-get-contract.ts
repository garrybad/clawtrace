/**
 * Script untuk test fungsi get ABI dan get source code contract
 *
 * Lokasi fungsi:
 *   - getABI / getSourceCode (low-level): src/lib/etherscan/client.ts
 *     createEtherscanClient() -> client.getABI(address) | client.getSourceCode(address)
 *   - getContractData (high-level + cache): src/lib/trace/services/contract-service.ts
 *     getContractData(address) -> { abi, sourceCode, contractName, ... }
 *
 * Usage:
 *   npx tsx scripts/test-get-contract.ts [address]
 *
 * Contoh:
 *   npx tsx scripts/test-get-contract.ts 0xeb3d55510962db74e9ba1c4a5c3b1fe15d842667
 *
 * Perlu ETHERSCAN_API_KEY dan CHAIN_ID di .env:
 *   CHAIN_ID=97  → BSC Testnet (api-testnet.bscscan.com)
 *   CHAIN_ID=56  → BSC Mainnet (api.bscscan.com)
 *   CHAIN_ID=1   → Ethereum (api.etherscan.io)
 * Contract harus verified di explorer yang sesuai. Jika dapat null, coba ubah CHAIN_ID
 * atau jalankan dengan --debug untuk lihat raw response: npx tsx scripts/test-get-contract.ts <address> --debug
 */

import { config } from "dotenv";
import { getContractData } from "../src/lib/trace/services/contract-service";
import { createEtherscanClient } from "../src/lib/etherscan/client";

config();

const DEFAULT_ADDRESS = "0xBB9bc244D798123fDe783fCc1C72d3Bb8C189413"; // Etherscan example
const address = process.argv[2] || DEFAULT_ADDRESS;

function main() {
  console.log("=== Test Get Contract ABI & Source Code ===\n");
  console.log("Address:", address);
  console.log("");

  if (!process.env.ETHERSCAN_API_KEY) {
    console.warn("⚠️  ETHERSCAN_API_KEY tidak di-set di .env");
    console.warn("   Set ETHERSCAN_API_KEY untuk fetch dari Etherscan.\n");
  }

  runTests();
}

async function runTests() {
  // --- 1. Test via Contract Service (getContractData) ---
  console.log("--- 1. Contract Service (getContractData) ---");
  try {
    const data = await getContractData(address);
    console.log("Contract Name:", data.contractName ?? "(none)");
    console.log("Compiler:", data.compilerVersion ?? "(none)");
    console.log("Optimization:", data.optimizationUsed ?? "(none)");
    console.log("Runs:", data.runs ?? "(none)");
    console.log("EVM Version:", data.evmVersion ?? "(none)");
    console.log("License:", data.licenseType ?? "(none)");
    console.log("Is Proxy:", data.isProxy ?? false);
    console.log("Implementation:", data.implementation ?? "(none)");
    console.log("");
    console.log("ABI:", data.abi ? `✅ ${data.abi.length} items` : "❌ null (not verified or fetch failed)");
    if (data.abi && data.abi.length > 0) {
      const functions = (data.abi as any[]).filter((x) => x.type === "function");
      const events = (data.abi as any[]).filter((x) => x.type === "event");
      console.log("   - functions:", functions.length);
      console.log("   - events:", events.length);
      if (functions.length > 0) {
        console.log("   - first function:", (functions[0] as any).name ?? (functions[0] as any).type);
      }
    }
    console.log("");
    console.log("Source Code:", data.sourceCode ? `✅ ${data.sourceCode.length} chars` : "❌ null");
    if (data.sourceCode) {
      const firstLines = data.sourceCode.split("\n").slice(0, 5).join("\n");
      console.log("   First lines:");
      console.log("   ---");
      console.log(firstLines.split("\n").map((l) => "   " + l).join("\n"));
      console.log("   ---");
    }
  } catch (e) {
    console.error("Error:", e);
  }

  console.log("");

  // --- 2. Test langsung Etherscan client (getABI + getSourceCode) ---
  console.log("--- 2. Etherscan Client (getABI + getSourceCode) ---");
  const etherscan = createEtherscanClient();
  if (!etherscan) {
    console.log("Etherscan client not available (no API key).");
    return;
  }

  const chainId = process.env.CHAIN_ID || "97";
  console.log("CHAIN_ID:", chainId, "(97 = BSC Testnet, 56 = BSC Mainnet, 1 = Ethereum)");
  console.log("");

  try {
    // Optional: raw fetch untuk debug jika masih null
    const debug = process.argv.includes("--debug");
    if (debug) {
      const baseUrl = "https://api.etherscan.io/v2/api";
      const url = `${baseUrl}?chainid=${chainId}&module=contract&action=getabi&address=${address}&apikey=${process.env.ETHERSCAN_API_KEY}`;
      const res = await fetch(url);
      const raw = await res.json();
      console.log("Raw getabi response:", JSON.stringify({ status: raw.status, message: raw.message, resultType: typeof raw.result, resultPreview: typeof raw.result === "string" ? raw.result.slice(0, 80) + "..." : raw.result }).slice(0, 300));
      console.log("");
    }

    const [abi, sourceResult] = await Promise.all([
      etherscan.getABI(address),
      etherscan.getSourceCode(address),
    ]);
    console.log("getABI():", abi ? `✅ ${abi.length} items` : "❌ null");
    console.log("getSourceCode():", sourceResult ? "✅ ok" : "❌ null");
    if (sourceResult) {
      console.log("   ContractName:", sourceResult.ContractName);
      console.log("   Source length:", sourceResult.SourceCode?.length ?? 0);
    }
  } catch (e) {
    console.error("Error:", e);
  }

  console.log("");
  console.log("Done.");
}

main();
