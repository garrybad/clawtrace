/**
 * Address Collector: Extract contract addresses from structLogs
 * 
 * Input: structLogs[] + txTo
 * Output: Set<string> (unique contract addresses)
 */

import type { StructLog } from "@/lib/rpc";

/**
 * Collect contract addresses from structLogs (CALL/DELEGATECALL/STATICCALL stack)
 */
export function collectContractAddresses(
  structLogs: StructLog[],
  txTo: string | null
): Set<string> {
  const addresses = new Set<string>();
  
  // Add tx.to if exists
  if (txTo) {
    addresses.add(txTo.toLowerCase());
  }

  // Extract addresses from CALL ops
  for (const log of structLogs) {
    if (
      log.op === "CALL" ||
      log.op === "DELEGATECALL" ||
      log.op === "STATICCALL" ||
      log.op === "CALLCODE"
    ) {
      if (log.stack && log.stack.length > 0) {
        const stackLen = log.stack.length;
        const addrIdx = stackLen - 1 - 1; // "to" is 1st from end
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

  return addresses;
}
