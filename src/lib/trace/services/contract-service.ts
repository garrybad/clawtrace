/**
 * Contract Service: Fetch ABI and source code from Etherscan
 * 
 * Input: address (or addresses[] for batch)
 * Output: { abi, sourceCode, contractName, ... }
 * 
 * Features:
 * - Caching for ABI and source code
 * - Skip if not verified (return null)
 * - Batch fetching support
 */

import { createEtherscanClient } from "@/lib/etherscan/client";
import { abiCache, sourceCodeCache } from "./cache";
import type { Abi } from "viem";

export interface ContractData {
  address: string;
  abi: Abi | null;
  sourceCode: string | null;
  contractName?: string;
  compilerVersion?: string;
  optimizationUsed?: string;
  runs?: string;
  evmVersion?: string;
  licenseType?: string;
  isProxy?: boolean;
  implementation?: string;
}

/**
 * Get contract data for a single address
 */
export async function getContractData(address: string): Promise<ContractData> {
  const normalizedAddr = address.toLowerCase();
  const etherscan = createEtherscanClient();

  // Check cache first
  const cachedABI = abiCache.get(`abi:${normalizedAddr}`);
  const cachedSource = sourceCodeCache.get(`source:${normalizedAddr}`);

  let abi: Abi | null = cachedABI;
  let sourceCode: string | null = cachedSource;
  let contractName: string | undefined;
  let compilerVersion: string | undefined;
  let optimizationUsed: string | undefined;
  let runs: string | undefined;
  let evmVersion: string | undefined;
  let licenseType: string | undefined;
  let isProxy: string | undefined;
  let implementation: string | undefined;

  // Fetch if not cached
  if (!abi || !sourceCode) {
    if (etherscan) {
      // Fetch ABI and source code in parallel
      const [abiResult, sourceResult] = await Promise.all([
        abi ? Promise.resolve(null) : etherscan.getABI(normalizedAddr),
        sourceCode ? Promise.resolve(null) : etherscan.getSourceCode(normalizedAddr),
      ]);

      // Update ABI
      if (abiResult) {
        abi = abiResult;
        abiCache.set(`abi:${normalizedAddr}`, Array.from(abi));
      }

      // Update source code and metadata
      if (sourceResult) {
        sourceCode = sourceResult.SourceCode || null;
        contractName = sourceResult.ContractName;
        compilerVersion = sourceResult.CompilerVersion;
        optimizationUsed = sourceResult.OptimizationUsed;
        runs = sourceResult.Runs;
        evmVersion = sourceResult.EVMVersion;
        licenseType = sourceResult.LicenseType;
        isProxy = sourceResult.Proxy ? "1" : "0";
        implementation = sourceResult.Implementation;

        if (sourceCode) {
          sourceCodeCache.set(`source:${normalizedAddr}`, sourceCode);
        }
      }
    }
  } else {
    // If cached, we still need metadata - fetch source code for metadata
    if (etherscan && !sourceCode) {
      const sourceResult = await etherscan.getSourceCode(normalizedAddr);
      if (sourceResult) {
        contractName = sourceResult.ContractName;
        compilerVersion = sourceResult.CompilerVersion;
        optimizationUsed = sourceResult.OptimizationUsed;
        runs = sourceResult.Runs;
        evmVersion = sourceResult.EVMVersion;
        licenseType = sourceResult.LicenseType;
        isProxy = sourceResult.Proxy ? "1" : "0";
        implementation = sourceResult.Implementation;
      }
    }
  }

  return {
    address: normalizedAddr,
    abi: abi || null,
    sourceCode: sourceCode || null,
    contractName,
    compilerVersion,
    optimizationUsed,
    runs,
    evmVersion,
    licenseType,
    isProxy: isProxy ? isProxy === "1" : false,
    implementation,
  };
}

/**
 * Get contract data for multiple addresses (batch)
 */
export async function getContractDataBatch(
  addresses: string[]
): Promise<Map<string, ContractData>> {
  const result = new Map<string, ContractData>();

  // Fetch all contracts in parallel
  await Promise.all(
    addresses.map(async (addr) => {
      try {
        const data = await getContractData(addr);
        result.set(addr.toLowerCase(), data);
      } catch (error) {
        // Skip on error, return partial data
        console.warn(`Failed to fetch contract data for ${addr}:`, error);
        result.set(addr.toLowerCase(), {
          address: addr.toLowerCase(),
          abi: null,
          sourceCode: null,
        });
      }
    })
  );

  return result;
}
