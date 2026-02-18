# Step 5: API Route Implementation ✅

## What Was Implemented

### 1. API Route (`src/app/api/trace/route.ts`)

**Endpoint**: `GET /api/trace?hash=0x...`

**Flow**:
1. Validate transaction hash
2. Fetch transaction, receipt, and block (parallel)
3. Build transaction summary
4. Fetch trace via `debugTraceTransaction`
5. Parse structLogs to nodes
6. Find failure (deepest REVERT)
7. Build metadata
8. Return JSON response

**Response Format**:
```typescript
{
  summary: TransactionSummary,
  callTree: TraceNode[],      // Flat list of all nodes
  roots: TraceNode[],         // Root nodes (depth 0)
  failure?: FailureInfo,      // If transaction failed
  metadata: {
    totalSteps: number,
    maxDepth: number,
    totalGasUsed: number,
    hasStorageOps: boolean,
    hasEvents: boolean,
    parsedAt: number
  }
}
```

### 2. Helper Modules

**`src/lib/trace/summary.ts`**:
- `buildTransactionSummary()` - Build summary from tx, receipt, block

**`src/lib/trace/failure.ts`**:
- `findFailure()` - Find deepest REVERT node and build failure info
- `buildPathToNode()` - Build path from root to failing node

**`src/lib/trace/api-types.ts`**:
- `TraceResponse` - TypeScript type for API response

### 3. JSON Serialization Fix

- Fixed `bigint` serialization issue:
  - `panicCode` now stored as hex string (`"0x..."`) instead of `bigint`
  - Works correctly with JSON.stringify()

---

## Usage

### Test API Route

```bash
# Start dev server
npm run dev

# Test in another terminal
curl "http://localhost:3000/api/trace?hash=0xb5414a6f587b43ea43e8173521cf10d9182dbc2c1c0e504188eaeb4e6ed7a75d" | jq .
```

### Use in Frontend

```typescript
// In your React component
const response = await fetch(`/api/trace?hash=${txHash}`);
const data: TraceResponse = await response.json();

// Use data.summary for OverviewCard
// Use data.callTree / data.roots for TraceTreePanel
// Use data.failure for error display
```

---

## Error Handling

- **400**: Missing or invalid hash
- **500**: RPC error or parsing error (with error message)

---

## Next Steps

✅ Step 1: RPC Client Setup  
✅ Step 2: StructLogs Parser  
✅ Step 3: Operation Detection  
✅ Step 4: Revert Decoder  
✅ Step 5: API Route  

**Step 6**: Wire frontend components to consume `/api/trace` and render real data!

---

## Notes

- API route uses parallel fetching for tx/receipt (faster)
- Trace parsing filters out internal ops by default (cleaner output)
- Failure detection finds deepest REVERT (most accurate root cause)
- All bigint values converted to hex strings for JSON compatibility
