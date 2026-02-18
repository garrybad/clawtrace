# Backend Pipeline Design - ClawTrace

## 🎯 Goal
Parse `debug_traceTransaction` structLogs menjadi **Tenderly-like call tree** dengan:
- Opcode-level operations (CALL, DELEGATECALL, STATICCALL, JUMP, SLOAD, SSTORE, REVERT, dll)
- Gas cost per operation
- Storage operations dengan addresses & values
- Function call decoding
- Nested call tree dengan indentation
- Failure detection & revert decoding

---

## 📊 Response Schema (TypeScript)

```typescript
// Main API Response
interface TraceResponse {
  summary: TransactionSummary;
  callTree: TraceNode[];
  failure?: FailureInfo;
  ai?: AIInsight;
  metadata: TraceMetadata;
}

// Transaction Summary (untuk OverviewCard)
interface TransactionSummary {
  hash: string;
  status: "success" | "failed" | "reverted";
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string | null; // null jika contract creation
  value: string; // wei as hex
  gasUsed: string;
  gasLimit: string;
  effectiveGasPrice: string;
  contractAddress?: string; // jika CREATE
  nonce: number;
}

// Trace Node (untuk TraceTreePanel & TraceTreeDetail)
interface TraceNode {
  id: string; // unique ID untuk key di React
  type: TraceNodeType;
  depth: number;
  index: number; // sibling index
  
  // Operation info
  op: string; // "CALL", "DELEGATECALL", "STATICCALL", "JUMP", "SLOAD", "SSTORE", "REVERT", "EVENT", etc.
  gasCost: number; // gas consumed by this operation
  gasLimit?: number; // gas limit (untuk CALL ops)
  
  // Call context (untuk CALL/DELEGATECALL/STATICCALL)
  from?: string;
  to?: string;
  value?: string; // wei as hex
  input?: string; // calldata hex
  output?: string; // return data hex
  
  // Function decoding (jika berhasil decode)
  functionName?: string;
  functionSignature?: string;
  decodedInput?: Record<string, any>; // decoded parameters
  decodedOutput?: any; // decoded return value
  
  // Storage operations (untuk SLOAD/SSTORE)
  storageSlot?: string;
  storageValue?: string;
  storageValueBefore?: string; // untuk SSTORE
  
  // Jump operations
  jumpType?: "JUMP" | "JUMPI";
  jumpTarget?: number; // PC target
  
  // Events (untuk LOG0-LOG4)
  eventName?: string;
  eventSignature?: string;
  eventTopics?: string[];
  eventData?: string;
  
  // Error info (untuk REVERT)
  error?: {
    kind: "REVERT" | "OOG" | "PANIC" | "CUSTOM_ERROR" | "UNKNOWN";
    revertData?: string; // hex
    decodedReason?: string; // decoded error message
    panicCode?: number; // untuk Panic(uint256)
    customErrorSelector?: string;
  };
  
  // Warning flags
  warnings?: {
    highGas?: boolean; // gas > threshold
    suspicious?: boolean; // suspicious pattern
    failed?: boolean; // operation failed
  };
  
  // Children (nested calls)
  children?: TraceNode[];
  
  // Metadata
  pc?: number; // program counter
  stepIndex?: number; // index dalam structLogs array
}

type TraceNodeType = 
  | "CALL"
  | "DELEGATECALL"
  | "STATICCALL"
  | "CREATE"
  | "CREATE2"
  | "SELFDESTRUCT"
  | "JUMP"
  | "JUMPI"
  | "SLOAD"
  | "SSTORE"
  | "LOG0" | "LOG1" | "LOG2" | "LOG3" | "LOG4"
  | "REVERT"
  | "RETURN"
  | "STOP"
  | "INTERNAL"; // untuk internal operations yang tidak masuk kategori di atas

// Failure Info
interface FailureInfo {
  failingNodeId: string; // ID dari TraceNode yang fail
  failingPath: string[]; // array of node IDs dari root ke failing node
  revertData: string; // hex
  decodedReason: string;
  errorKind: "REVERT" | "OOG" | "PANIC" | "CUSTOM_ERROR" | "UNKNOWN";
  panicCode?: number;
  customErrorSelector?: string;
  customErrorName?: string;
}

// AI Insight
interface AIInsight {
  rootCause: string; // natural language explanation
  confidence: number; // 0-1
  fixSuggestions: FixSuggestion[];
  nextChecks: string[];
  codeSnippet?: {
    contract: string;
    line: number;
    code: string;
  };
}

interface FixSuggestion {
  action: string; // "Approve token before swap", "Increase slippage tolerance", etc.
  priority: "high" | "medium" | "low";
  details?: string;
}

// Metadata
interface TraceMetadata {
  totalSteps: number;
  maxDepth: number;
  totalGasUsed: number;
  hasStorageOps: boolean;
  hasEvents: boolean;
  parsedAt: number; // timestamp
}
```

---

## 🔄 Pipeline Flow

### Step 1: Fetch Transaction Context
```typescript
// Parallel fetch untuk speed
const [tx, receipt, block] = await Promise.all([
  rpc.eth_getTransactionByHash(hash),
  rpc.eth_getTransactionReceipt(hash),
  rpc.eth_getBlockByNumber(receipt.blockNumber, true)
]);

// Build TransactionSummary
const summary: TransactionSummary = {
  hash: tx.hash,
  status: receipt.status === "0x1" ? "success" : "failed",
  blockNumber: parseInt(receipt.blockNumber, 16),
  timestamp: parseInt(block.timestamp, 16),
  from: tx.from,
  to: tx.to || null,
  value: tx.value,
  gasUsed: receipt.gasUsed,
  gasLimit: tx.gas,
  effectiveGasPrice: receipt.effectiveGasPrice || tx.gasPrice,
  contractAddress: receipt.contractAddress,
  nonce: parseInt(tx.nonce, 16)
};
```

### Step 2: Fetch structLogs Trace
```typescript
const traceOptions = {
  timeout: "120s",
  enableMemory: true, // perlu untuk extract calldata & revert data
  enableReturnData: true, // untuk return values
  disableStack: false, // perlu untuk extract CALL parameters
  disableStorage: false // perlu untuk SLOAD/SSTORE
};

const traceResult = await rpc.debug_traceTransaction(hash, traceOptions);
const structLogs = traceResult.structLogs || [];
```

### Step 3: Parse structLogs → TraceNode Tree

**Algoritma utama:**

1. **Iterate structLogs sequentially**
   - Maintain `frameStack: Frame[]` untuk track call frames
   - Maintain `currentFrame: Frame | null`
   - Maintain `nodes: TraceNode[]` untuk hasil akhir

2. **Frame tracking berdasarkan depth:**
   ```typescript
   interface Frame {
     depth: number;
     startStepIndex: number;
     type: "CALL" | "DELEGATECALL" | "STATICCALL" | "CREATE";
     from: string;
     to: string;
     value: string;
     gasLimit: number;
     input: string;
     children: TraceNode[];
   }
   
   // Ketika depth naik → masuk sub-call
   if (log.depth > currentFrame?.depth) {
     // Detect CALL opcode dari step sebelumnya
     const callOp = detectCallOpcode(structLogs[i-1]);
     const newFrame = createFrame(callOp, log.depth);
     frameStack.push(newFrame);
     currentFrame = newFrame;
   }
   
   // Ketika depth turun → keluar dari frame
   if (log.depth < currentFrame?.depth) {
     // Finalize current frame
     finalizeFrame(currentFrame, log);
     frameStack.pop();
     currentFrame = frameStack[frameStack.length - 1] || null;
   }
   ```

3. **Detect operation types dari opcode:**
   ```typescript
   // Untuk setiap structLog:
   switch (log.op) {
     case "CALL":
     case "DELEGATECALL":
     case "STATICCALL":
     case "CALLCODE":
       // Extract dari stack:
       // CALL: stack[stack.length-1] = gas, to, value, inOffset, inSize, outOffset, outSize
       // DELEGATECALL/STATICCALL: stack[stack.length-1] = gas, to, inOffset, inSize, outOffset, outSize (no value)
       const callParams = extractCallParams(log.stack, log.op);
       // Create CALL node (akan jadi parent untuk children)
       break;
       
     case "SLOAD":
       // Extract slot dari stack: stack[stack.length-1] = slot
       const slot = log.stack[log.stack.length - 1];
       const value = log.storage?.[slot] || "0x0";
       // Create SLOAD node
       break;
       
     case "SSTORE":
       // Extract slot & value dari stack: stack[stack.length-1] = slot, stack[stack.length-2] = value
       const slot = log.stack[log.stack.length - 1];
       const value = log.stack[log.stack.length - 2];
       const valueBefore = log.storage?.[slot] || "0x0";
       // Create SSTORE node
       break;
       
     case "REVERT":
       // Extract revert data dari memory: memory[offset:offset+size]
       const revertParams = extractRevertParams(log.stack);
       const revertData = extractMemorySlice(log.memory, revertParams.offset, revertParams.size);
       // Create REVERT node dengan error info
       break;
       
     case "LOG0":
     case "LOG1":
     case "LOG2":
     case "LOG3":
     case "LOG4":
       // Extract topics & data dari stack & memory
       const logParams = extractLogParams(log.op, log.stack, log.memory);
       // Create EVENT node
       break;
       
     case "JUMP":
     case "JUMPI":
       // Extract target dari stack
       const target = log.stack[log.stack.length - 1];
       // Create JUMP node (optional, bisa di-skip untuk mengurangi noise)
       break;
   }
   ```

4. **Calculate gas cost:**
   ```typescript
   // Gas cost = gas sebelum opcode - gas setelah opcode
   const gasBefore = parseInt(structLogs[i-1]?.gas || "0", 16);
   const gasAfter = parseInt(log.gas, 16);
   const gasCost = gasBefore - gasAfter;
   ```

5. **Decode function calls:**
   ```typescript
   // Untuk CALL nodes dengan input data:
   if (node.input && node.input.length >= 10) {
     const selector = node.input.slice(0, 10);
     
     // Try decode dari known ABIs (local cache)
     const abi = await getABI(node.to);
     if (abi) {
       const decoded = decodeFunctionCall(node.input, abi);
       node.functionName = decoded.name;
       node.functionSignature = decoded.signature;
       node.decodedInput = decoded.params;
     } else {
       // Fallback: signature DB lookup (4byte.directory style)
       const sig = await lookupSignature(selector);
       if (sig) {
         node.functionSignature = sig;
         // Try decode dengan signature (tanpa ABI, hanya types)
       }
     }
   }
   ```

6. **Decode revert reason:**
   ```typescript
   if (node.error?.revertData) {
     const data = node.error.revertData;
     
     // Check Error(string) selector: 0x08c379a0
     if (data.startsWith("0x08c379a0")) {
       const reason = decodeErrorString(data);
       node.error.decodedReason = reason;
       node.error.kind = "REVERT";
     }
     // Check Panic(uint256) selector: 0x4e487b71
     else if (data.startsWith("0x4e487b71")) {
       const panicCode = decodePanic(data);
       node.error.panicCode = panicCode;
       node.error.kind = "PANIC";
       node.error.decodedReason = getPanicReason(panicCode); // "Arithmetic underflow", etc.
     }
     // Custom error
     else if (data.length >= 10) {
       const selector = data.slice(0, 10);
       const abi = await getABI(node.to);
       if (abi) {
         const decoded = decodeCustomError(data, abi);
         node.error.customErrorSelector = selector;
         node.error.customErrorName = decoded.name;
         node.error.decodedReason = decoded.message;
         node.error.kind = "CUSTOM_ERROR";
       } else {
         node.error.kind = "UNKNOWN";
       }
     }
   }
   ```

### Step 4: Build Failure Info
```typescript
// Find deepest REVERT node
const revertNodes = findAllNodes(nodes, (n) => n.op === "REVERT");
const deepestRevert = revertNodes.reduce((deepest, current) => 
  current.depth > deepest.depth ? current : deepest
);

if (deepestRevert) {
  const failure: FailureInfo = {
    failingNodeId: deepestRevert.id,
    failingPath: buildPathToNode(nodes, deepestRevert.id),
    revertData: deepestRevert.error?.revertData || "",
    decodedReason: deepestRevert.error?.decodedReason || "",
    errorKind: deepestRevert.error?.kind || "UNKNOWN",
    panicCode: deepestRevert.error?.panicCode,
    customErrorSelector: deepestRevert.error?.customErrorSelector,
    customErrorName: deepestRevert.error?.customErrorName
  };
}
```

### Step 5: AI Analysis (Groq)
```typescript
// Build AI prompt payload (ringkas, bukan full structLogs)
const aiPayload = {
  summary: {
    status: summary.status,
    from: summary.from,
    to: summary.to,
    function: failure?.failingNode?.functionName || "unknown",
    gasUsed: summary.gasUsed,
    gasLimit: summary.gasLimit
  },
  failingPath: failure.failingPath.map(id => {
    const node = findNodeById(nodes, id);
    return {
      type: node.op,
      function: node.functionName,
      to: node.to,
      gasCost: node.gasCost
    };
  }),
  failure: {
    kind: failure.errorKind,
    reason: failure.decodedReason,
    node: {
      function: failure.failingNode?.functionName,
      to: failure.failingNode?.to,
      input: failure.failingNode?.decodedInput
    }
  },
  context: {
    // 10-20 nodes sebelum REVERT untuk context
    beforeRevert: getNodesBeforeRevert(nodes, failure.failingNodeId, 20)
  }
};

const aiResponse = await groq.chat.completions.create({
  model: "llama-3.1-70b-versatile",
  messages: [{
    role: "system",
    content: "You are a smart contract debugging assistant. Analyze transaction failures and provide actionable fix suggestions."
  }, {
    role: "user",
    content: JSON.stringify(aiPayload)
  }],
  response_format: { type: "json_object" }
});

const aiInsight: AIInsight = JSON.parse(aiResponse.choices[0].message.content);
```

### Step 6: Build Final Response
```typescript
const response: TraceResponse = {
  summary,
  callTree: nodes,
  failure,
  ai: aiInsight,
  metadata: {
    totalSteps: structLogs.length,
    maxDepth: Math.max(...nodes.map(n => n.depth)),
    totalGasUsed: parseInt(summary.gasUsed, 16),
    hasStorageOps: nodes.some(n => n.op === "SLOAD" || n.op === "SSTORE"),
    hasEvents: nodes.some(n => n.op.startsWith("LOG")),
    parsedAt: Date.now()
  }
};
```

---

## 🛠️ Implementation Structure

```
src/
  app/
    api/
      trace/
        route.ts              # GET /api/trace?hash=0x...
  lib/
    rpc/
      client.ts               # RPC client wrapper
      types.ts                 # RPC response types
    trace/
      parser.ts               # Main structLogs parser
      frame-tracker.ts         # Call frame tracking logic
      decoder.ts               # Function & error decoder
      gas-calculator.ts       # Gas cost calculation
    abi/
      cache.ts                # ABI cache (local + external lookup)
      decoder.ts               # Function/error decoding utilities
    ai/
      groq.ts                 # Groq API client
      prompt.ts               # AI prompt builder
    types/
      trace.ts                # TypeScript types (TraceResponse, etc.)
```

---

## 🎨 Frontend Integration Points

### TraceTreePanel
- Consume `callTree: TraceNode[]`
- Filter berdasarkan `op` type (CALL, SLOAD, SSTORE, REVERT, etc.)
- Render dengan indentation berdasarkan `depth`
- Highlight nodes dengan `warnings.failed === true`
- Show gas cost dari `gasCost`

### TraceTreeDetail
- Consume same `callTree`
- Expandable nodes dengan `children`
- Show decoded function calls dari `decodedInput`
- Show storage operations dari `storageSlot` & `storageValue`
- "Go to revert" button → scroll ke node dengan `op === "REVERT"`

### OverviewCard
- Consume `summary: TransactionSummary`
- Display: from, to, value, gasUsed, gasLimit, nonce

### ClawAIPanel
- Consume `ai: AIInsight`
- Display: `rootCause`, `fixSuggestions[]`, `codeSnippet`

---

## ⚠️ Performance Considerations

1. **structLogs bisa sangat besar** (100k+ steps untuk complex tx)
   - **Solution**: Parse incrementally, jangan load semua ke memory sekaligus
   - **Alternative**: Custom tracer yang hanya emit CALL/SLOAD/SSTORE/REVERT (bukan semua opcodes)

2. **ABI lookup bisa lambat**
   - **Solution**: Cache ABI per address (in-memory + file cache)
   - **Fallback**: Signature DB lookup (4byte.directory API)

3. **AI call bisa mahal/lambat**
   - **Solution**: Cache AI response per tx hash
   - **Timeout**: Max 30s untuk AI call

4. **Response size**
   - **Solution**: Compress response dengan gzip (Next.js auto-handle)
   - **Pagination**: Untuk trace detail, bisa split jadi chunks

---

## 🚀 Next Steps

1. ✅ Setup RPC client dengan `debug_traceTransaction`
2. ✅ Implement structLogs parser dasar (frame tracking)
3. ✅ Implement operation detection (CALL, SLOAD, SSTORE, REVERT)
4. ✅ Implement function decoder (ABI lookup + signature DB)
5. ✅ Implement revert decoder (Error/Panic/Custom)
6. ✅ Implement AI integration (Groq)
7. ✅ Create API route `/api/trace`
8. ✅ Update frontend components untuk consume real data

---

## 📝 Notes

- **Custom Tracer Alternative**: Jika structLogs terlalu besar, bisa pakai custom JS tracer yang hanya emit operations yang relevan. Tapi user minta structLogs, jadi kita parse dari structLogs.

- **Storage Operations**: SLOAD/SSTORE bisa banyak sekali. Consider filter: hanya show storage ops yang relevan (dalam failing path, atau dengan value changes).

- **JUMP Operations**: Bisa di-skip untuk mengurangi noise, atau hanya show JUMP yang "interesting" (conditional jumps dengan high gas).
