"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Minus,
  Plus,
  CircleAlert,
  AlertTriangle,
  Database,
  FileText,
  ArrowRight,
} from "lucide-react";
import type { TraceNode } from "@/lib/trace";
import type { TenderlyCallTrace, TenderlyTraceResult } from "@/lib/trace/tenderly-parser";
import { formatDecodedInput } from "@/lib/trace/abi-decoder";

type Props = {
  hash: string;
  roots: TraceNode[];
  allNodes: TraceNode[];
  metadata: {
    totalSteps: number;
    maxDepth: number;
    totalGasUsed: number;
    hasStorageOps: boolean;
    hasEvents: boolean;
    parsedAt: number;
  };
  /** When set, tree is rendered from Tenderly call_trace (get tx → ABI → debug trace → parse) */
  tenderlyTrace?: TenderlyTraceResult;
};

function shortenAddress(addr: string | undefined, chars = 4): string {
  if (!addr) return "";
  if (addr.length <= chars * 2 + 2) return addr;
  return `${addr.slice(0, 2 + chars)}...${addr.slice(-chars)}`;
}

function shortenHex(value: string | undefined, maxLength = 20): string {
  if (!value) return "";
  if (value.length <= maxLength) return value;
  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}

function formatGas(gas: number): string {
  return gas.toLocaleString();
}

function getOpcodeColor(op: string): string {
  switch (op) {
    case "CALL":
      return "text-primary";
    case "DELEGATECALL":
    case "CALLCODE":
      return "text-purple-400";
    case "STATICCALL":
      return "text-blue-400";
    case "SLOAD":
      return "text-yellow-400";
    case "SSTORE":
      return "text-orange-400";
    case "REVERT":
      return "text-error";
    case "LOG0":
    case "LOG1":
    case "LOG2":
    case "LOG3":
    case "LOG4":
      return "text-green-400";
    default:
      return "text-text-muted";
  }
}

function getOpcodeIcon(op: string) {
  switch (op) {
    case "CALL":
    case "DELEGATECALL":
    case "STATICCALL":
    case "CALLCODE":
      return <AlertTriangle className="size-3.5 text-warning" />;
    case "SLOAD":
    case "SSTORE":
      return <Database className="size-3.5 text-yellow-400" />;
    case "LOG0":
    case "LOG1":
    case "LOG2":
    case "LOG3":
    case "LOG4":
      return <FileText className="size-3.5 text-green-400" />;
    case "REVERT":
      return <CircleAlert className="size-3.5 text-error" />;
    default:
      return null;
  }
}

function renderNodeDetails(node: TraceNode): string {
  // Storage operations
  if (node.op === "SLOAD" && node.storageSlot) {
    const value = node.storageValue || "0x0";
    return `[${shortenHex(node.storageSlot, 16)}] → ${shortenHex(value, 16)}`;
  }

  if (node.op === "SSTORE" && node.storageSlot) {
    const before = node.storageValueBefore || "0x0";
    const after = node.storageValue || "0x0";
    return `[${shortenHex(node.storageSlot, 16)}]`;
  }

  // Call operations
  if (
    (node.op === "CALL" ||
      node.op === "DELEGATECALL" ||
      node.op === "STATICCALL" ||
      node.op === "CALLCODE") &&
    node.to
  ) {
    const toShort = shortenAddress(node.to);
    const value = node.value && node.value !== "0x0" ? ` [${node.value}]` : "";
    return `${toShort}${value}`;
  }

  // REVERT with decoded error
  if (node.op === "REVERT") {
    if (node.decodedError?.reason) {
      return node.decodedError.reason;
    }
    if (node.decodedError?.customErrorSelector) {
      return `Custom error ${node.decodedError.customErrorSelector}`;
    }
    if (node.decodedError?.panicCode) {
      return `Panic(${node.decodedError.panicCode})`;
    }
    return "Reverted";
  }

  // Events
  if (node.op.startsWith("LOG")) {
    const topicCount = parseInt(node.op.slice(3)) || 0;
    if (node.eventTopics && node.eventTopics.length > 0) {
      return `${topicCount} topic(s): ${node.eventTopics[0].slice(0, 10)}...`;
    }
    return `${topicCount} topic(s)`;
  }

  return "";
}

interface TreeNodeProps {
  node: TraceNode;
  hash: string;
  depth: number;
  isExpanded: boolean;
  onToggle: () => void;
  showGas: boolean;
}

function TreeNode({
  node,
  hash,
  depth,
  isExpanded,
  onToggle,
  showGas,
}: TreeNodeProps) {
  const hasChildren = node.children && node.children.length > 0;
  const isRevert = node.op === "REVERT";
  const indent = depth * 16 + 16;
  const details = renderNodeDetails(node);

  // Build tree lines
  const treeLines = [];
  for (let i = 0; i < depth; i++) {
    treeLines.push(
      <div
        key={i}
        className="absolute left-0 top-0 bottom-0 w-px border-l border-border-dim"
        style={{ left: `${16 + i * 16}px` }}
      />
    );
  }

  const content = (
    <div
      className={`relative flex items-start py-2 pr-4 group transition-colors ${
        isRevert
          ? "bg-error/10 border-l-4 border-error"
          : "hover:bg-surface-highlight/50 border-l-4 border-transparent hover:border-primary/30"
      }`}
      style={{ paddingLeft: `${indent}px` }}
    >
      {/* Tree lines */}
      {depth > 0 && (
        <>
          <div
            className="absolute left-0 top-0 bottom-0 w-px border-l border-border-dim"
            style={{ left: `${indent - 16}px` }}
          />
          <div
            className="absolute left-0 top-1/2 w-4 border-t border-border-dim"
            style={{ left: `${indent - 16}px` }}
          />
        </>
      )}

      {/* Expand/collapse button */}
      <div className="flex items-center gap-2 mr-2 shrink-0">
        {hasChildren ? (
          <button
            type="button"
            onClick={onToggle}
            className="w-5 h-5 flex items-center justify-center text-text-muted hover:text-white transition-colors"
          >
            {isExpanded ? (
              <Minus className="size-3.5" />
            ) : (
              <Plus className="size-3.5" />
            )}
          </button>
        ) : (
          <div className="w-5 h-5 flex items-center justify-center">
            {getOpcodeIcon(node.op)}
          </div>
        )}
      </div>

      {/* Opcode badge */}
      <span
        className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded mr-2 shrink-0 ${
          isRevert
            ? "bg-error/20 text-error border border-error/30"
            : getOpcodeColor(node.op) === "text-text-muted"
              ? "bg-surface-highlight text-text-muted border border-border-dim"
              : `bg-opacity-10 ${getOpcodeColor(node.op)} border border-current/20`
        }`}
      >
        {node.op}
      </span>

      {/* Details */}
      <div className="flex-1 min-w-0 font-mono text-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={isRevert ? "text-error font-semibold" : "text-text-muted"}>
            {details || node.op}
          </span>
          {node.to && (
            <>
              <ArrowRight className="size-3 text-text-muted shrink-0" />
              <span className="text-primary hover:underline cursor-pointer">
                {shortenAddress(node.to)}
              </span>
            </>
          )}
        </div>

        {/* Storage value change indicator for SSTORE */}
        {node.op === "SSTORE" && node.storageValueBefore !== undefined && (
          <div className="mt-1 flex items-center gap-2 text-xs">
            <span className="text-error line-through">
              {shortenHex(node.storageValueBefore || "0x0", 16)}
            </span>
            <span className="text-text-muted">→</span>
            <span className="text-success">
              {shortenHex(node.storageValue || "0x0", 16)}
            </span>
          </div>
        )}
      </div>

      {/* Gas cost */}
      {showGas && (
        <div className="ml-4 shrink-0 text-right">
          <div className="text-xs font-mono text-text-muted">
            {formatGas(node.gasCost)} gas
          </div>
          <div className="w-16 h-1 bg-surface-highlight rounded-full overflow-hidden mt-1">
            <div
              className={`h-full ${
                isRevert ? "bg-error" : "bg-primary"
              }`}
              style={{
                width: `${Math.min(100, (node.gasCost / 1000) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );

  if (isRevert) {
    return (
      <Link href={`/trace/${hash}/detail`} className="block">
        {content}
        {hasChildren && isExpanded && (
          <div className="relative">
            {node.children.map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                hash={hash}
                depth={depth + 1}
                isExpanded={true}
                onToggle={() => {}}
                showGas={showGas}
              />
            ))}
          </div>
        )}
      </Link>
    );
  }

  return (
    <div>
      {content}
          {hasChildren && isExpanded && (
            <div className="relative">
              {node.children.map((child) => (
                <TreeNode
                  key={child.id}
                  node={child}
                  hash={hash}
                  depth={depth + 1}
                  isExpanded={true}
                  onToggle={() => {}}
                  showGas={showGas}
                />
              ))}
            </div>
          )}
    </div>
  );
}

// --- Tenderly-style tree (from call_trace) ---
function getTenderlyOpColor(op: string): string {
  switch (op) {
    case "CALL":
      return "text-primary";
    case "DELEGATECALL":
    case "CALLCODE":
      return "text-purple-400";
    case "STATICCALL":
      return "text-blue-400";
    case "SLOAD":
      return "text-yellow-400";
    case "SSTORE":
      return "text-orange-400";
    case "REVERT":
      return "text-error";
    default:
      return "text-text-muted";
  }
}

function getTenderlyOpIcon(op: string) {
  switch (op) {
    case "CALL":
    case "DELEGATECALL":
    case "STATICCALL":
    case "CALLCODE":
      return <AlertTriangle className="size-3.5 text-warning" />;
    case "SLOAD":
    case "SSTORE":
      return <Database className="size-3.5 text-yellow-400" />;
    case "REVERT":
      return <CircleAlert className="size-3.5 text-error" />;
    default:
      return null;
  }
}

interface TenderlyTreeNodeProps {
  trace: TenderlyCallTrace;
  hash: string;
  depth: number;
  isExpanded: boolean;
  onToggle: () => void;
  showGas: boolean;
  expandedSet: Set<string>;
  onToggleId: (id: string) => void;
}

function TenderlyTreeNode({
  trace,
  hash,
  depth,
  isExpanded,
  onToggle,
  showGas,
  expandedSet,
  onToggleId,
}: TenderlyTreeNodeProps) {
  const hasChildren = trace.calls && trace.calls.length > 0;
  const isRevert = trace.error != null || trace.call_type === "REVERT";
  const nodeId = `t-${trace.absolute_position}-${trace.call_type}-${trace.to}`;
  const indent = depth * 16 + 16;

  // Build label dengan function name atau contract name
  let label = trace.function_name;
  if (!label) {
    if (trace.call_type === "SLOAD" || trace.call_type === "SSTORE") {
      label = `${trace.call_type} ${trace.storage_slot?.[0] ? shortenHex(trace.storage_slot[0], 12) : ""}`;
    } else if (trace.call_type === "INTERNAL") {
      label = `internal_${trace.function_pc || ""}`;
    } else {
      label = trace.call_type;
    }
  }
  
  // Add contract name jika ada dan berbeda dari function name
  if (trace.contract_name && trace.contract_name !== label && trace.call_type !== "SLOAD" && trace.call_type !== "SSTORE") {
    label = `${trace.contract_name}.${label}`;
  }

  // Format decoded input untuk display yang lebih baik
  const decodedInputStr = formatDecodedInput(trace.function_name, trace.decoded_input);
  
  const subLabel =
    trace.call_type === "CALL" ||
    trace.call_type === "DELEGATECALL" ||
    trace.call_type === "STATICCALL" ||
    trace.call_type === "CALLCODE"
      ? decodedInputStr || `${shortenAddress(trace.from)} → ${shortenAddress(trace.to)}`
      : trace.error_message || "";

  const content = (
    <div
      className={`relative flex items-start py-2 pr-4 group transition-colors ${
        isRevert
          ? "bg-error/10 border-l-4 border-error"
          : "hover:bg-surface-highlight/50 border-l-4 border-transparent hover:border-primary/30"
      }`}
      style={{ paddingLeft: `${indent}px` }}
    >
      {depth > 0 && (
        <>
          <div
            className="absolute left-0 top-0 bottom-0 w-px border-l border-border-dim"
            style={{ left: `${indent - 16}px` }}
          />
          <div
            className="absolute left-0 top-1/2 w-4 border-t border-border-dim"
            style={{ left: `${indent - 16}px` }}
          />
        </>
      )}
      <div className="flex items-center gap-2 mr-2 shrink-0">
        {hasChildren ? (
          <button
            type="button"
            onClick={onToggle}
            className="w-5 h-5 flex items-center justify-center text-text-muted hover:text-white transition-colors"
          >
            {isExpanded ? <Minus className="size-3.5" /> : <Plus className="size-3.5" />}
          </button>
        ) : (
          <div className="w-5 h-5 flex items-center justify-center">
            {getTenderlyOpIcon(trace.call_type)}
          </div>
        )}
      </div>
      <span
        className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded mr-2 shrink-0 ${
          isRevert
            ? "bg-error/20 text-error border border-error/30"
            : getTenderlyOpColor(trace.call_type) === "text-text-muted"
              ? "bg-surface-highlight text-text-muted border border-border-dim"
              : `bg-opacity-10 ${getTenderlyOpColor(trace.call_type)} border border-current/20`
        }`}
      >
        {trace.call_type}
      </span>
      <div className="flex-1 min-w-0 font-mono text-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={isRevert ? "text-error font-semibold" : "text-text-muted"}>
            {label}
          </span>
          {(trace.call_type === "CALL" ||
            trace.call_type === "DELEGATECALL" ||
            trace.call_type === "STATICCALL") && (
            <>
              <ArrowRight className="size-3 text-text-muted shrink-0" />
              <span className="text-primary">{shortenAddress(trace.to)}</span>
            </>
          )}
        </div>
        {subLabel && (
          <div className="text-xs text-text-muted mt-0.5">{subLabel}</div>
        )}
        {(trace.call_type === "SLOAD" || trace.call_type === "SSTORE") &&
          trace.storage_slot && (
            <div className="mt-1 flex items-center gap-2 text-xs">
              {trace.contract_name && (
                <span className="text-primary font-semibold">{trace.contract_name}</span>
              )}
              <span className="text-text-muted">
                [{shortenHex(trace.storage_slot[0] || "0x0", 12)}]
              </span>
              {trace.call_type === "SLOAD" && trace.storage_value_original && (
                <>
                  <span className="text-text-muted">→</span>
                  <span className="text-success">
                    {shortenHex(trace.storage_value_original[0] || "0x0", 16)}
                  </span>
                </>
              )}
              {trace.call_type === "SSTORE" &&
                trace.storage_value_original != null &&
                trace.storage_value_dirty != null && (
                  <>
                    <span className="text-error line-through">
                      {shortenHex(trace.storage_value_original[0] || "0x0", 16)}
                    </span>
                    <span className="text-text-muted">→</span>
                    <span className="text-success">
                      {shortenHex(trace.storage_value_dirty[0] || "0x0", 16)}
                    </span>
                  </>
                )}
            </div>
          )}
      </div>
      {showGas && (
        <div className="ml-4 shrink-0 text-right">
          <div className="text-xs font-mono text-text-muted">
            {formatGas(trace.gas_used)} gas
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div>
      {content}
      {hasChildren && isExpanded && (
        <div className="relative">
          {trace.calls!.map((child, idx) => (
            <TenderlyTreeNode
              key={`${child.absolute_position}-${child.call_type}-${child.to}-${idx}`}
              trace={child}
              hash={hash}
              depth={depth + 1}
              isExpanded={expandedSet.has(`t-${child.absolute_position}-${child.call_type}-${child.to}`)}
              onToggle={() => onToggleId(`t-${child.absolute_position}-${child.call_type}-${child.to}`)}
              showGas={showGas}
              expandedSet={expandedSet}
              onToggleId={onToggleId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TraceTreePanel({
  hash,
  roots,
  allNodes,
  metadata,
  tenderlyTrace,
}: Props) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [tenderlyExpanded, setTenderlyExpanded] = useState<Set<string>>(
    () => new Set(["t-root"])
  );
  const [allExpanded, setAllExpanded] = useState(false);
  const [showGas, setShowGas] = useState(true);
  const [showStorage, setShowStorage] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [showFullTrace, setShowFullTrace] = useState(false);

  const toggleTenderlyNode = (id: string) => {
    const next = new Set(tenderlyExpanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setTenderlyExpanded(next);
  };

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedNodes(new Set());
    } else {
      const allIds = new Set<string>();
      const collectIds = (nodes: TraceNode[]) => {
        nodes.forEach((node) => {
          allIds.add(node.id);
          if (node.children) collectIds(node.children);
        });
      };
      collectIds(roots);
      setExpandedNodes(allIds);
    }
    setAllExpanded(!allExpanded);
  };

  // Filter nodes based on toggles
  const shouldShowNode = (node: TraceNode): boolean => {
    if (node.op === "SLOAD" || node.op === "SSTORE") {
      return showStorage;
    }
    if (node.op.startsWith("LOG")) {
      return showEvents;
    }
    return true; // Always show CALL, REVERT, JUMP, etc.
  };

  // Filter function untuk recursive filtering
  const filterNode = (node: TraceNode): TraceNode | null => {
    if (!shouldShowNode(node)) {
      return null;
    }

    const filteredChildren = node.children
      .map(filterNode)
      .filter((n): n is TraceNode => n !== null);

    return {
      ...node,
      children: filteredChildren,
    };
  };

  // Build flat list of all nodes (for sequential rendering like Tenderly)
  // If all nodes are roots (same depth), render them sequentially
  // Otherwise, render hierarchical tree
  const allFilteredNodes = allNodes.filter(shouldShowNode);
  const allSameDepth = allFilteredNodes.every((n) => n.depth === allFilteredNodes[0]?.depth);
  
  // If all nodes are at same depth (or all are roots), render sequentially
  const useSequentialView = allSameDepth || roots.length === allFilteredNodes.length;
  
  const filteredRoots = roots.map(filterNode).filter((n): n is TraceNode => n !== null);
  const sortedRoots = [...filteredRoots].sort((a, b) => a.stepIndex - b.stepIndex);
  
  // For sequential view, use all filtered nodes sorted by stepIndex
  const sequentialNodes = useSequentialView
    ? [...allFilteredNodes].sort((a, b) => a.stepIndex - b.stepIndex)
    : null;

  const maxDepth = metadata.maxDepth + 1;

  return (
    <div className="bg-surface border border-border-dim rounded-xl flex flex-col overflow-hidden shadow-lg min-h-[500px]">
      <div className="px-4 py-3 border-b border-border-dim bg-surface-highlight/30 flex justify-between items-center sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <h3 className="font-display font-semibold text-sm tracking-wide text-white">
            Execution Trace
          </h3>
          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-mono border border-primary/20">
            Depth: {maxDepth}
          </span>
        </div>
        <div className="flex gap-2 items-center">
          <button
            type="button"
            onClick={toggleAll}
            className="p-1.5 rounded hover:bg-surface-highlight text-text-muted hover:text-white transition-colors"
            aria-label={allExpanded ? "Collapse all" : "Expand all"}
          >
            {allExpanded ? (
              <Minus className="size-[18px]" />
            ) : (
              <Plus className="size-[18px]" />
            )}
          </button>
          <div className="w-px h-6 bg-border-dim mx-1" />
          <div className="flex items-center gap-3 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showGas}
                onChange={(e) => setShowGas(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-border-dim bg-surface text-primary focus:ring-primary"
              />
              <span className="text-text-muted">Gas</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showStorage}
                onChange={(e) => setShowStorage(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-border-dim bg-surface text-primary focus:ring-primary"
              />
              <span className="text-text-muted">Storage</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showEvents}
                onChange={(e) => setShowEvents(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-border-dim bg-surface text-primary focus:ring-primary"
              />
              <span className="text-text-muted">Events</span>
            </label>
            {metadata.hasStorageOps && !showStorage && (
              <span className="text-warning text-[10px]">
                ({allNodes.filter((n) => n.op === "SLOAD" || n.op === "SSTORE").length}{" "}
                hidden)
              </span>
            )}
            {metadata.hasEvents && !showEvents && (
              <span className="text-warning text-[10px]">
                ({allNodes.filter((n) => n.op.startsWith("LOG")).length} hidden)
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-0 relative">
        <div className="absolute inset-y-0 left-6 border-l border-border-dim z-0" />
        <div className="relative">
          {tenderlyTrace ? (
            // Tenderly format: call_trace (from get tx → ABI → debug trace → parse)
            <TenderlyTreeNode
              trace={tenderlyTrace.call_trace}
              hash={hash}
              depth={0}
              isExpanded={tenderlyExpanded.has("t-root")}
              onToggle={() => toggleTenderlyNode("t-root")}
              showGas={showGas}
              expandedSet={tenderlyExpanded}
              onToggleId={toggleTenderlyNode}
            />
          ) : useSequentialView && sequentialNodes ? (
            sequentialNodes.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                hash={hash}
                depth={node.depth}
                isExpanded={expandedNodes.has(node.id)}
                onToggle={() => toggleNode(node.id)}
                showGas={showGas}
              />
            ))
          ) : (
            sortedRoots.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                hash={hash}
                depth={0}
                isExpanded={expandedNodes.has(node.id)}
                onToggle={() => toggleNode(node.id)}
                showGas={showGas}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
