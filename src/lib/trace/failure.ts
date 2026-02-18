/**
 * Failure detection and analysis from parsed trace nodes.
 */

import type { TraceNode } from "./types";

export interface FailureInfo {
  failingNodeId: string;
  failingPath: string[]; // array of node IDs from root to failing node
  revertData: string;
  decodedReason?: string;
  errorKind: "REVERT" | "PANIC" | "CUSTOM_ERROR" | "UNKNOWN";
  panicCode?: string; // bigint as hex string for JSON serialization
  customErrorSelector?: string;
  customErrorName?: string;
}

/**
 * Find the deepest REVERT node in the trace tree.
 */
export function findFailure(
  nodes: TraceNode[],
  roots: TraceNode[]
): FailureInfo | undefined {
  // Find all REVERT nodes
  const revertNodes = nodes.filter((n) => n.op === "REVERT");

  if (revertNodes.length === 0) {
    return undefined;
  }

  // Find deepest REVERT (highest depth)
  const deepestRevert = revertNodes.reduce((deepest, current) =>
    current.depth > deepest.depth ? current : deepest
  );

  // Build path from root to failing node
  const failingPath = buildPathToNode(roots, deepestRevert.id);

  // Extract error info
  const revertData = deepestRevert.input || "0x";
  const decoded = deepestRevert.decodedError;

  return {
    failingNodeId: deepestRevert.id,
    failingPath,
    revertData,
    decodedReason: decoded?.reason,
    errorKind: decoded?.kind || "UNKNOWN",
    panicCode: decoded?.panicCode
      ? `0x${decoded.panicCode.toString(16)}`
      : undefined,
    customErrorSelector: decoded?.customErrorSelector,
    customErrorName: decoded?.customErrorName,
  };
}

/**
 * Build path from root nodes to target node ID.
 */
function buildPathToNode(
  roots: TraceNode[],
  targetId: string
): string[] {
  const path: string[] = [];

  function dfs(node: TraceNode): boolean {
    path.push(node.id);

    if (node.id === targetId) {
      return true;
    }

    for (const child of node.children) {
      if (dfs(child)) {
        return true;
      }
    }

    path.pop();
    return false;
  }

  for (const root of roots) {
    if (dfs(root)) {
      return path;
    }
  }

  return path;
}
