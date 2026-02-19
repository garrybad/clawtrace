/**
 * ABI Decoder untuk decode function calls menggunakan viem
 */

import { decodeFunctionData, decodeAbiParameters, type Abi } from "viem";

export interface DecodedFunction {
  name: string;
  args: any[];
  signature: string;
}

/**
 * Decode function call dari input data menggunakan ABI
 */
export function decodeFunctionCall(
  input: string,
  abi: Abi
): DecodedFunction | null {
  try {
    const decoded = decodeFunctionData({
      abi,
      data: input as `0x${string}`,
    });

    return {
      name: decoded.functionName,
      args: Array.isArray(decoded.args) ? decoded.args : [],
      signature: `${decoded.functionName}(${decoded.args?.map(() => "?").join(",") || ""})`,
    };
  } catch (error) {
    // ABI tidak match atau input tidak valid
    return null;
  }
}

/**
 * Decode function return value menggunakan ABI
 */
export function decodeFunctionResult(
  output: string,
  abi: Abi,
  functionName: string
): any[] | null {
  try {
    // Find function in ABI
    const func = abi.find(
      (item) => item.type === "function" && (item as any).name === functionName
    ) as any;
    if (!func || !func.outputs || func.outputs.length === 0) return null;

    // Decode return data
    const decoded = decodeAbiParameters(func.outputs, output as `0x${string}`);
    return Array.isArray(decoded) ? decoded : [decoded];
  } catch (error) {
    return null;
  }
}

/**
 * Format decoded input ke readable string: functionName(param0=value0, param1=value1)
 */
export function formatDecodedInput(
  functionName: string | undefined,
  decodedInput: Array<{ soltype: { name: string; type: string }; value: string }> | undefined
): string | undefined {
  if (!functionName || !decodedInput || decodedInput.length === 0) {
    return functionName;
  }

  const params = decodedInput.map((param) => {
    const name = param.soltype.name || "param";
    const value = formatValue(param.value, param.soltype.type);
    return `${name} = ${value}`;
  });

  return `${functionName}(${params.join(", ")})`;
}

/**
 * Format value untuk display (shorten addresses, format numbers)
 */
function formatValue(value: string, type: string): string {
  if (type === "address" && value.startsWith("0x") && value.length === 66) {
    const addr = `0x${value.slice(-40)}`;
    return addr.length > 20 ? `${addr.slice(0, 10)}...${addr.slice(-8)}` : addr;
  }
  if (type.startsWith("uint") || type.startsWith("int")) {
    try {
      const num = BigInt(value);
      if (num < BigInt(1000000)) return num.toString();
      // Format large numbers dengan separator
      return num.toLocaleString();
    } catch {
      return value;
    }
  }
  if (value.length > 30) {
    return `${value.slice(0, 20)}...`;
  }
  return value;
}

/**
 * Extract function selector (4 bytes pertama)
 */
export function getFunctionSelector(input: string): string | null {
  if (!input || input.length < 10) return null;
  return input.slice(0, 10);
}

/**
 * Find function dalam ABI berdasarkan selector
 */
export function findFunctionBySelector(
  abi: Abi,
  selector: string
): any | null {
  try {
    // Try decode dengan semua functions di ABI
    for (const item of abi) {
      if (item.type === "function") {
        try {
          // viem akan throw jika selector tidak match
          decodeFunctionData({
            abi: [item],
            data: selector as `0x${string}`,
          });
          return item;
        } catch {
          // Skip jika tidak match
        }
      }
    }
  } catch {
    // Ignore errors
  }
  return null;
}
