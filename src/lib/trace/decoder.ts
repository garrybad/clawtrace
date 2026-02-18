/**
 * Basic ABI-level decoders for revert data.
 *
 * Step 4 focuses on:
 * - decoding standard Error(string) and Panic(uint256)
 * - providing a small, typed summary we can attach to TraceNode.decodedError
 */

export type DecodedErrorKind = "REVERT" | "PANIC" | "CUSTOM_ERROR" | "UNKNOWN";

export interface DecodedError {
  kind: DecodedErrorKind;
  reason?: string;
  panicCode?: string; // bigint as hex string for JSON serialization
  customErrorSelector?: string;
  customErrorName?: string;
}

const ERROR_SELECTOR = "0x08c379a0"; // Error(string)
const PANIC_SELECTOR = "0x4e487b71"; // Panic(uint256)

const ZERO = BigInt(0);

function strip0x(value: string): string {
  return value.startsWith("0x") ? value.slice(2) : value;
}

function hexToUtf8(hex: string): string {
  if (!hex) return "";
  const buf = Buffer.from(strip0x(hex), "hex");
  return buf.toString("utf8");
}

/**
 * Decode standard Error(string) ABI-encoded revert data.
 */
function decodeErrorString(data: string): string | undefined {
  const body = strip0x(data).slice(8 * 2); // skip selector (4 bytes)
  if (body.length < 64 * 2) return undefined;

  // layout: offset (32 bytes) | length (32 bytes) | data (length bytes, padded)
  const lengthHex = body.slice(64, 64 + 64);
  const length = BigInt(`0x${lengthHex}`);
  if (length === ZERO) return "";

  const strHex = body.slice(64 + 64, 64 + 64 + Number(length) * 2);
  return hexToUtf8(strHex);
}

/**
 * Decode Panic(uint256) revert data.
 */
function decodePanic(data: string): bigint | undefined {
  const body = strip0x(data).slice(8 * 2); // skip selector
  if (body.length < 64) return undefined;
  const codeHex = body.slice(0, 64);
  return BigInt(`0x${codeHex}`);
}

/**
 * High-level revert decoder used by the trace pipeline.
 */
export function decodeRevertData(data: string | undefined): DecodedError | undefined {
  if (!data || data === "0x") return undefined;

  const selector = data.slice(0, 10);

  if (selector === ERROR_SELECTOR) {
    const reason = decodeErrorString(data);
    return { kind: "REVERT", reason };
  }

  if (selector === PANIC_SELECTOR) {
    const panicCode = decodePanic(data);
    return {
      kind: "PANIC",
      panicCode: panicCode ? `0x${panicCode.toString(16)}` : undefined,
    };
  }

  // Custom error: we only know the selector at this stage.
  if (data.length >= 10) {
    return {
      kind: "CUSTOM_ERROR",
      customErrorSelector: selector,
    };
  }

  return { kind: "UNKNOWN" };
}

