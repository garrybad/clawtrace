/**
 * Parser untuk menghasilkan format mirip Tenderly dari structLogs.
 * 
 * Format output:
 * - call_trace: nested structure dengan calls[] recursive
 * - stack_trace: array untuk error path
 * - storage tracking: storage_slot, storage_value_original, storage_value_dirty
 */

import type { StructLog } from "@/lib/rpc";
import { decodeRevertData } from "./decoder";
import { decodeFunctionCall, decodeFunctionResult, formatDecodedInput, type DecodedFunction } from "./abi-decoder";
import type { Abi } from "viem";

export type TenderlyCallTrace = {
  hash?: string;
  contract_name?: string;
  function_name?: string;
  function_pc?: number;
  function_op?: string;
  function_file_index?: number;
  function_code_start?: number;
  function_line_number?: number;
  function_code_length?: number;
  absolute_position: number;
  caller_pc?: number;
  caller_op?: string;
  caller_file_index?: number;
  caller_line_number?: number;
  caller_code_start?: number;
  caller_code_length?: number;
  call_type: string; // "CALL" | "DELEGATECALL" | "STATICCALL" | "JUMPDEST" | "SLOAD" | "SSTORE" | "STOP" | ...
  address: string;
  from: string;
  from_balance?: string;
  to: string;
  to_balance?: string;
  value?: string;
  block_timestamp?: string;
  gas: number;
  gas_used: number;
  refund_gas?: number;
  intrinsic_gas?: number;
  storage_address?: string;
  input?: string;
  decoded_input?: Array<{
    soltype: {
      name: string;
      type: string;
      storage_location?: string;
      offset?: number;
      index?: string;
      indexed?: boolean;
      simple_type?: { type: string };
    };
    value: string;
  }>;
  output?: string;
  decoded_output?: Array<{
    soltype: {
      name: string;
      type: string;
      storage_location?: string;
      offset?: number;
      index?: string;
      indexed?: boolean;
      simple_type?: { type: string };
    };
    value: string;
  }> | null;
  error?: string;
  error_op?: string;
  error_message?: string;
  error_absolute_position?: number;
  error_file_index?: number;
  error_line_number?: number;
  error_code_start?: number;
  error_code_length?: number;
  error_hex_data?: string;
  network_id?: string;
  storage_slot?: string[];
  storage_value_original?: string[];
  storage_value_dirty?: string[];
  calls?: TenderlyCallTrace[];
  caller?: {
    address: string;
    balance?: string;
  };
};

export type TenderlyStackTrace = {
  file_index: number | null;
  contract: string;
  name: string | null;
  line: number | null;
  error: string | null;
  error_message?: string;
  code: string | null;
  op: string;
  length?: number | null;
};

export type TenderlyTraceResult = {
  call_trace: TenderlyCallTrace;
  stack_trace: TenderlyStackTrace[];
  balance_diff?: Array<{
    address: string;
    original: string;
    dirty: string;
    is_miner: boolean;
  }>;
  nonce_diff?: Array<{
    address: string;
    original: string;
    dirty: string;
  }>;
};

const ZERO = BigInt(0);
const TWO = BigInt(2);

function hexToBigInt(value: string | undefined): bigint {
  if (!value) return ZERO;
  return BigInt(value);
}

function extractStackItem(stack: string[] | undefined, indexFromEnd: number): bigint {
  if (!stack || stack.length === 0) return ZERO;
  const idx = stack.length - 1 - indexFromEnd;
  if (idx < 0 || idx >= stack.length) return ZERO;
  return hexToBigInt(stack[idx]);
}

function extractAddress(stack: string[] | undefined, indexFromEnd: number): string | undefined {
  const val = extractStackItem(stack, indexFromEnd);
  if (val === ZERO) return undefined;
  const hex = val.toString(16).padStart(40, "0");
  return `0x${hex}`;
}

function extractRevertData(memory: string[] | undefined, offset: bigint, size: bigint): string | undefined {
  if (!memory || size === ZERO) return undefined;
  const joined = memory.map((w) => w.replace(/^0x/, "")).join("");
  const start = Number(offset * TWO);
  const end = Number((offset + size) * TWO);
  if (start >= joined.length) return "0x";
  const slice = joined.slice(start, Math.min(end, joined.length));
  return `0x${slice}`;
}

function getStorageValue(storage: Record<string, string> | undefined, slotHex: string): string | undefined {
  if (!storage) return undefined;
  const withPrefix = slotHex.startsWith("0x") ? slotHex : `0x${slotHex}`;
  const withoutPrefix = withPrefix.slice(2);
  const padded = "0x" + withoutPrefix.padStart(64, "0").slice(-64);
  const paddedNoPrefix = padded.slice(2);
  return storage[withPrefix] ?? storage[withoutPrefix] ?? storage[slotHex]
    ?? storage[padded] ?? storage[paddedNoPrefix];
}

function padHex32(value: bigint): string {
  return `0x${value.toString(16).padStart(64, "0")}`;
}

/**
 * Parse structLogs ke format Tenderly-style call trace.
 * @param abiMap Map dari contract address ke ABI untuk decode function calls
 * @param contractMap Map dari contract address ke ContractData untuk contract names
 */
export function parseToTenderlyFormat(
  structLogs: StructLog[],
  txHash: string,
  from: string,
  to: string | null,
  input?: string,
  blockTimestamp?: string,
  abiMap?: Map<string, Abi>,
  contractMap?: Map<string, { contractName?: string }>
): TenderlyTraceResult {
  if (structLogs.length === 0) {
    return {
      call_trace: {
        absolute_position: 0,
        call_type: "CALL",
        address: to || from,
        from,
        to: to || from,
        gas: 0,
        gas_used: 0,
        input,
        decoded_input: input ? decodeInput(input) : undefined,
      },
      stack_trace: [],
    };
  }

  // Track call boundaries berdasarkan depth changes
  const callStack: Array<{
    trace: TenderlyCallTrace;
    startIndex: number;
    depth: number;
    gasStart: number;
  }> = [];

  const stackTrace: TenderlyStackTrace[] = [];
  let rootTrace: TenderlyCallTrace | null = null;
  let errorTrace: TenderlyCallTrace | null = null;

  // Track storage changes untuk SSTORE
  const storageBefore: Map<string, Map<string, string>> = new Map(); // address -> slot -> value

  // Note: Tidak track setiap JUMPDEST sebagai internal call karena terlalu granular
  // Tenderly hanya menampilkan internal function calls yang meaningful (dengan function selector)
  // Kita akan fokus ke CALL/DELEGATECALL/STATICCALL dan storage operations saja

  // Build root trace first
  const firstLog = structLogs[0];
  const lastLog = structLogs[structLogs.length - 1];
  // Decode root input jika ada ABI
  let rootFunctionName: string | undefined;
  let rootDecodedInput: TenderlyCallTrace["decoded_input"] | undefined;
  if (input && to && abiMap?.has(to.toLowerCase())) {
    const decoded = decodeFunctionCall(input, abiMap.get(to.toLowerCase())!);
    if (decoded) {
      rootFunctionName = decoded.name;
      rootDecodedInput = convertDecodedToTenderlyFormat(decoded);
    }
  }

  // Get contract name if available
  const rootContractName = to && contractMap?.has(to.toLowerCase())
    ? contractMap.get(to.toLowerCase())?.contractName
    : undefined;

  rootTrace = {
    hash: txHash,
    contract_name: rootContractName || (to ? undefined : "Unverified"),
    function_name: rootFunctionName || (input ? extractFunctionName(input) : undefined),
    absolute_position: 0,
    caller_pc: 0,
    caller_op: "CALL",
    call_type: "CALL",
    address: from,
    from,
    to: to || from,
    gas: firstLog.gas,
    gas_used: firstLog.gas - lastLog.gas,
    input,
    decoded_input: rootDecodedInput || (input ? decodeInput(input) : undefined),
    block_timestamp: blockTimestamp,
    calls: [],
  };

  callStack.push({
    trace: rootTrace,
    startIndex: 0,
    depth: 0,
    gasStart: firstLog.gas,
  });

  for (let i = 0; i < structLogs.length; i++) {
    const log = structLogs[i];
    const prev = structLogs[i - 1];
    const next = structLogs[i + 1];

    const gasAfter = log.gas;
    const gasBefore = i === 0 ? gasAfter + log.gasCost : prev.gas + prev.gasCost;

    // Detect call boundaries (depth increase setelah CALL op)
    const isCallStart =
      (log.op === "CALL" || log.op === "DELEGATECALL" || log.op === "STATICCALL" || log.op === "CALLCODE") &&
      next &&
      next.depth > log.depth;

    // Detect call end (depth decrease = return from call)
    const isCallEnd = prev && log.depth < prev.depth && prev.depth > 0;

    // Extract call info untuk CALL ops
    if (isCallStart) {
      let callTo: string | undefined;
      let callValue: bigint = ZERO;
      let callInput: string | undefined;

      if (log.op === "CALL" || log.op === "CALLCODE") {
        // Stack (bottom to top): [gas, to, value, inOffset, inSize, outOffset, outSize]
        // extractStackItem(stack, indexFromEnd): idx = length - 1 - indexFromEnd
        // gas=index6 (bottom), to=index5, value=index4, inOffset=index3, inSize=index2, outOffset=index1, outSize=index0 (top)
        callTo = extractAddress(log.stack, 1); // to is 1st from end (index 5)
        callValue = extractStackItem(log.stack, 2); // value is 2nd from end (index 4)
        const inOffset = extractStackItem(log.stack, 3); // inOffset is 3rd from end (index 3)
        const inSize = extractStackItem(log.stack, 4); // inSize is 4th from end (index 2)
        if (log.memory && inSize > ZERO) {
          callInput = extractRevertData(log.memory, inOffset, inSize);
        }
      } else if (log.op === "DELEGATECALL" || log.op === "STATICCALL") {
        // Stack (bottom to top): [gas, to, inOffset, inSize, outOffset, outSize]
        // extractStackItem(stack, indexFromEnd): idx = length - 1 - indexFromEnd
        // gas=index6 (bottom), to=index5, inOffset=index4, inSize=index3, outOffset=index2, outSize=index1 (top)
        callTo = extractAddress(log.stack, 1); // to is 1st from end (index 5)
        const inOffset = extractStackItem(log.stack, 2); // inOffset is 2nd from end (index 4)
        const inSize = extractStackItem(log.stack, 3); // inSize is 3rd from end (index 3)
        if (log.memory && inSize > ZERO) {
          callInput = extractRevertData(log.memory, inOffset, inSize);
        }
      }

      const callerTrace = callStack.length > 0 ? callStack[callStack.length - 1].trace : rootTrace;
      const callerAddress = callerTrace?.to || to || from;

      // Decode function call jika ada ABI
      let callFunctionName: string | undefined;
      let callDecodedInput: TenderlyCallTrace["decoded_input"] | undefined;
      if (callInput && callTo && abiMap?.has(callTo.toLowerCase())) {
        const decoded = decodeFunctionCall(callInput, abiMap.get(callTo.toLowerCase())!);
        if (decoded) {
          callFunctionName = decoded.name;
          callDecodedInput = convertDecodedToTenderlyFormat(decoded);
        }
      }

      // Get contract name if available
      const callContractName = callTo && contractMap?.has(callTo.toLowerCase())
        ? contractMap.get(callTo.toLowerCase())?.contractName
        : undefined;

      const newCall: TenderlyCallTrace = {
        hash: "",
        contract_name: callContractName || (callTo ? undefined : "Unverified"),
        function_name: callFunctionName || (callInput ? extractFunctionName(callInput) : undefined),
        function_pc: next?.pc,
        function_op: next?.op === "JUMPDEST" ? "JUMPDEST" : undefined,
        absolute_position: i + 1, // Next log is start of call
        caller_pc: log.pc,
        caller_op: log.op,
        call_type: log.op,
        address: callerAddress,
        from: callerAddress,
        to: callTo || callerAddress,
        value: callValue > ZERO ? padHex32(callValue) : undefined,
        gas: next?.gas || log.gas,
        gas_used: 0, // Will be computed at end
        input: callInput,
        decoded_input: callDecodedInput || (callInput ? decodeInput(callInput) : undefined),
        output: undefined,
        decoded_output: null,
        calls: [],
        caller: {
          address: callerAddress,
        },
      };

      if (callerTrace) {
        if (!callerTrace.calls) callerTrace.calls = [];
        callerTrace.calls.push(newCall);
      }

      callStack.push({
        trace: newCall,
        startIndex: i + 1,
        depth: log.depth + 1,
        gasStart: next?.gas || log.gas,
      });
    }

    // Handle storage ops
    if (log.op === "SLOAD" || log.op === "SSTORE") {
      const slot = extractStackItem(log.stack, 0);
      const slotHex = padHex32(slot);
      const currentTrace = callStack.length > 0 ? callStack[callStack.length - 1].trace : rootTrace;
      const currentAddress = currentTrace?.to || to || from;

      if (!storageBefore.has(currentAddress)) {
        storageBefore.set(currentAddress, new Map());
      }
      const addressStorage = storageBefore.get(currentAddress)!;

      if (log.op === "SLOAD") {
        const value = getStorageValue(log.storage, slotHex);
        if (value) {
          addressStorage.set(slotHex, value);
        }

        // Get contract name for storage display
        const storageContractName = contractMap?.has(currentAddress.toLowerCase())
          ? contractMap.get(currentAddress.toLowerCase())?.contractName
          : undefined;

        const storageCall: TenderlyCallTrace = {
          absolute_position: i,
          call_type: "SLOAD",
          address: currentAddress,
          from: currentAddress,
          to: currentAddress,
          gas: log.gas,
          gas_used: log.gasCost,
          storage_address: currentAddress,
          storage_slot: [slotHex],
          storage_value_original: value ? [value] : undefined,
          contract_name: storageContractName,
        };

        if (currentTrace) {
          if (!currentTrace.calls) currentTrace.calls = [];
          currentTrace.calls.push(storageCall);
        }
      } else if (log.op === "SSTORE") {
        const value = extractStackItem(log.stack, 1);
        const valueHex = padHex32(value);
        const originalValue = addressStorage.get(slotHex) || getStorageValue(log.storage, slotHex) || padHex32(ZERO);
        const dirtyValue = valueHex;

        addressStorage.set(slotHex, dirtyValue);

        // Get contract name for storage display
        const storageContractName = contractMap?.has(currentAddress.toLowerCase())
          ? contractMap.get(currentAddress.toLowerCase())?.contractName
          : undefined;

        const storageCall: TenderlyCallTrace = {
          absolute_position: i,
          call_type: "SSTORE",
          address: currentAddress,
          from: currentAddress,
          to: currentAddress,
          gas: log.gas,
          gas_used: log.gasCost,
          storage_address: currentAddress,
          storage_slot: [slotHex],
          storage_value_original: [originalValue],
          storage_value_dirty: [dirtyValue],
          contract_name: storageContractName,
        };

        if (currentTrace) {
          if (!currentTrace.calls) currentTrace.calls = [];
          currentTrace.calls.push(storageCall);
        }
      }
    }

    // Handle REVERT
    if (log.op === "REVERT") {
      const offset = extractStackItem(log.stack, 0);
      const size = extractStackItem(log.stack, 1);
      const revertData = extractRevertData(log.memory, offset, size);
      const decoded = revertData && revertData !== "0x" ? decodeRevertData(revertData) : null;

      const currentTrace = callStack.length > 0 ? callStack[callStack.length - 1].trace : rootTrace;
      if (currentTrace) {
        currentTrace.error = decoded?.reason || "Reverted";
        currentTrace.error_op = "REVERT";
        currentTrace.error_absolute_position = i;
        currentTrace.error_hex_data = revertData;

        if (decoded) {
          currentTrace.error_message = decoded.reason || decoded.panicCode || "Unknown error";
        }

        errorTrace = currentTrace;
      }
    }

    // Note: Tidak track JUMP/JUMPI ke JUMPDEST sebagai internal calls
    // Alasannya:
    // 1. Terlalu granular - setiap basic block jadi entry terpisah
    // 2. Tenderly tidak menampilkan setiap JUMPDEST, hanya internal function calls yang meaningful
    // 3. Internal function calls yang meaningful biasanya punya function selector di stack/memory
    //    atau bisa diidentifikasi via source maps (yang kita belum punya)
    // 
    // Untuk sekarang, kita fokus ke:
    // - CALL/DELEGATECALL/STATICCALL (external calls)
    // - SLOAD/SSTORE (storage operations)
    // - REVERT/RETURN (execution boundaries)
    //
    // TODO: Implement proper internal function call detection dengan:
    // - Source map analysis untuk identify function boundaries
    // - Function selector detection dari stack sebelum JUMP
    // - Heuristic: hanya track JUMPDEST yang punya children (calls, storage ops, dll)

    // Handle RETURN
    if (log.op === "RETURN") {
      const offset = extractStackItem(log.stack, 0);
      const size = extractStackItem(log.stack, 1);
      const returnData = extractRevertData(log.memory, offset, size);

      const currentTrace = callStack.length > 0 ? callStack[callStack.length - 1].trace : rootTrace;
      if (currentTrace && returnData && returnData !== "0x") {
        currentTrace.output = returnData;
        
        // Decode return value jika ada function name dan ABI
        if (currentTrace.function_name && currentTrace.to && abiMap?.has(currentTrace.to.toLowerCase())) {
          const decodedOutput = decodeFunctionResult(
            returnData,
            abiMap.get(currentTrace.to.toLowerCase())!,
            currentTrace.function_name
          );
          if (decodedOutput) {
            currentTrace.decoded_output = decodedOutput.map((val, idx) => ({
              soltype: {
                name: `return${idx}`,
                type: typeof val === "bigint" ? "uint256" : typeof val === "string" ? "string" : "bytes",
              },
              value: typeof val === "bigint" ? padHex32(val) : String(val),
            }));
          }
        }
      }
    }

    // Update gas_used saat call berakhir
    if (isCallEnd && callStack.length > 0) {
      const callInfo = callStack.pop()!;
      const actualGasUsed = callInfo.gasStart - log.gas;
      callInfo.trace.gas_used = actualGasUsed;
    }
  }

  // Finalize remaining calls
  while (callStack.length > 0) {
    const callInfo = callStack.pop()!;
    const lastLog = structLogs[structLogs.length - 1];
    callInfo.trace.gas_used = callInfo.gasStart - lastLog.gas;
  }

  // Build stack trace dari error path (bottom-up)
  if (errorTrace) {
    // Collect all traces in error path
    const errorPath: TenderlyCallTrace[] = [];
    let current: TenderlyCallTrace | null = errorTrace;

    // Walk up the call stack
    const allCalls: TenderlyCallTrace[] = [];
    function collectCalls(trace: TenderlyCallTrace) {
      allCalls.push(trace);
      if (trace.calls) {
        trace.calls.forEach(collectCalls);
      }
    }
    collectCalls(rootTrace!);

    // Find path to error
    function findPath(target: TenderlyCallTrace, trace: TenderlyCallTrace, path: TenderlyCallTrace[]): boolean {
      if (trace === target) {
        path.push(trace);
        return true;
      }
      if (trace.calls) {
        for (const call of trace.calls) {
          if (findPath(target, call, path)) {
            path.unshift(trace);
            return true;
          }
        }
      }
      return false;
    }

    const path: TenderlyCallTrace[] = [];
    findPath(errorTrace, rootTrace!, path);

    // Build stack trace
    path.forEach((trace) => {
      stackTrace.push({
        file_index: trace.function_file_index || null,
        contract: trace.to,
        name: trace.function_name || null,
        line: trace.function_line_number || null,
        error: trace.error || null,
        error_message: trace.error_message,
        code: trace.function_name || null,
        op: trace.error_op || trace.call_type,
        length: trace.function_code_length || null,
      });
    });
  }

  return {
    call_trace: rootTrace,
    stack_trace: stackTrace,
  };
}

/**
 * Convert DecodedFunction ke format Tenderly decoded_input
 * Improved: Better type inference and formatting
 */
function convertDecodedToTenderlyFormat(
  decoded: DecodedFunction
): TenderlyCallTrace["decoded_input"] {
  if (!decoded.args || decoded.args.length === 0) return undefined;

  return decoded.args.map((arg, idx) => {
    // Try to infer type dari value dengan lebih akurat
    let type = "uint256";
    let value = arg;
    let name = `param${idx}`;

    if (typeof arg === "bigint") {
      type = "uint256";
      value = padHex32(arg);
    } else if (typeof arg === "string") {
      if (arg.startsWith("0x") && arg.length === 42) {
        type = "address";
        // Format address untuk readability
        value = arg.length > 20 ? `${arg.slice(0, 10)}...${arg.slice(-8)}` : arg;
      } else if (arg.startsWith("0x") && arg.length > 42) {
        type = "bytes";
      } else {
        type = "string";
      }
    } else if (typeof arg === "boolean") {
      type = "bool";
      value = arg ? "true" : "false";
    } else if (Array.isArray(arg)) {
      type = "bytes";
      value = JSON.stringify(arg);
    } else if (typeof arg === "number") {
      type = "uint256";
      value = padHex32(BigInt(arg));
    }

    return {
      soltype: {
        name,
        type,
        storage_location: "default",
        offset: idx * 32,
        index: `0x${idx.toString(16).padStart(64, "0")}`,
        indexed: false,
        simple_type: { type },
      },
      value: String(value),
    };
  });
}

/**
 * Extract function name dari input (4-byte selector).
 */
function extractFunctionName(input: string): string | undefined {
  if (!input || input.length < 10) return undefined;
  const selector = input.slice(0, 10);
  // TODO: Map selector ke function name via ABI jika tersedia
  return undefined;
}

/**
 * Decode input ke decoded_input format Tenderly (fallback tanpa ABI).
 */
function decodeInput(input: string): TenderlyCallTrace["decoded_input"] {
  if (!input || input.length < 10) return undefined;
  const selector = input.slice(0, 10);
  const data = input.slice(10);

  // Simple decode: assume first param is uint256
  // TODO: Proper ABI decoding
  if (data.length >= 64) {
    return [
      {
        soltype: {
          name: "param0",
          type: "uint256",
          storage_location: "default",
          offset: 0,
          index: "0x0000000000000000000000000000000000000000000000000000000000000000",
          indexed: false,
          simple_type: { type: "uint" },
        },
        value: BigInt(`0x${data.slice(0, 64)}`).toString(),
      },
    ];
  }

  return undefined;
}
