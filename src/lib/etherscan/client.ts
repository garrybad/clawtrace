/**
 * Etherscan API Client untuk fetch ABI dan source code
 */

export interface EtherscanConfig {
  apiKey: string;
  baseUrl?: string;
  chainId?: number; // Default: 97 (BSC Testnet)
}

export interface EtherscanABIResponse {
  status: string | number;
  message: string;
  result: string; // JSON string of ABI array, or error message
}

export interface EtherscanSourceResponse {
  status: string | number;
  message: string;
  result: Array<{
    SourceCode?: string;
    ABI?: string;
    ContractName?: string;
    CompilerVersion?: string;
    OptimizationUsed?: string;
    Runs?: string;
    ConstructorArguments?: string;
    EVMVersion?: string;
    Library?: string;
    LicenseType?: string;
    Proxy?: string;
    Implementation?: string;
  }>;
}

/** Etherscan v2 unified API – satu endpoint untuk semua chain (chainid di query) */
const ETHERSCAN_V2_API = "https://api.etherscan.io/v2/api";

export class EtherscanClient {
  private config: EtherscanConfig;
  private baseUrl: string;

  constructor(config: EtherscanConfig) {
    this.config = config;
    // Gunakan Etherscan v2 API (unified: apikey + chainid untuk chain mana pun)
    this.baseUrl = config.baseUrl || ETHERSCAN_V2_API;
  }

  /**
   * Fetch ABI untuk contract address
   * API: module=contract, action=getabi, address=0x..., apikey=..., chainid=...
   */
  async getABI(address: string): Promise<any[] | null> {
    try {
      const chainId = this.config.chainId ?? 97;
      const url = `${this.baseUrl}?module=contract&action=getabi&address=${encodeURIComponent(address)}&apikey=${this.config.apiKey}&chainid=${chainId}`;
      const response = await fetch(url);
      const data: EtherscanABIResponse = await response.json();

      // status can be number 1 or string "1" depending on API
      if (String(data.status) !== "1") {
        return null;
      }
      if (!data.result || typeof data.result !== "string") {
        return null;
      }
      if (data.result === "Contract source code not verified") {
        return null;
      }
      return JSON.parse(data.result);
    } catch (error) {
      console.error(`Failed to fetch ABI for ${address}:`, error);
      return null;
    }
  }

  /**
   * Fetch source code dan ABI untuk contract address
   * API: module=contract, action=getsourcecode, address=0x..., apikey=..., chainid=...
   */
  async getSourceCode(address: string): Promise<EtherscanSourceResponse["result"][0] | null> {
    try {
      const chainId = this.config.chainId ?? 97;
      const url = `${this.baseUrl}?module=contract&action=getsourcecode&address=${encodeURIComponent(address)}&apikey=${this.config.apiKey}&chainid=${chainId}`;
      const response = await fetch(url);
      const data: EtherscanSourceResponse = await response.json();

      // status can be number 1 or string "1"
      if (String(data.status) !== "1") {
        return null;
      }
      if (!Array.isArray(data.result) || data.result.length === 0) {
        return null;
      }
      const result = data.result[0];
      // ABI might be missing for unverified; we still return result if SourceCode exists
      if (result.ABI === "Contract source code not verified") {
        return null;
      }
      return result;
    } catch (error) {
      console.error(`Failed to fetch source code for ${address}:`, error);
      return null;
    }
  }
}

/**
 * Create Etherscan client dari environment variables
 */
export function createEtherscanClient(): EtherscanClient | null {
  const apiKey = process.env.ETHERSCAN_API_KEY;
  const chainId = process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID) : 97;

  if (!apiKey) {
    console.warn("ETHERSCAN_API_KEY not set, ABI fetching will be disabled");
    return null;
  }

  return new EtherscanClient({
    apiKey,
    chainId,
  });
}
