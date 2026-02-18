# Step 1: RPC Client Setup ✅

## What Was Implemented

### 1. RPC Client Module (`src/lib/rpc/`)

- **`client.ts`**: Main RPC client class dengan methods:
  - `getTransaction()` - Get transaction by hash
  - `getTransactionReceipt()` - Get transaction receipt
  - `getBlock()` - Get block by number
  - `debugTraceTransaction()` - **Core method** untuk get structLogs
  - `validateTxHash()` - Validate transaction hash format

- **`types.ts`**: TypeScript types untuk:
  - `StructLog` - Individual opcode execution log
  - `TraceResult` - Full trace result dengan structLogs array
  - `TraceOptions` - Options untuk debug_traceTransaction
  - `Transaction`, `TransactionReceipt`, `Block` - Standard RPC types

- **`index.ts`**: Module exports

### 2. Dependencies Installed

- `viem` - Modern Ethereum library untuk RPC calls
- `tsx` - TypeScript executor untuk test scripts

### 3. Test Script (`scripts/test-rpc.ts`)

Script untuk verify RPC client bekerja dengan baik. Test:
- Transaction fetch
- Receipt fetch
- Block fetch
- **Debug trace transaction** (main feature)
- StructLogs parsing
- Operation statistics

### 4. Environment Configuration

- `.env.example` - Template untuk environment variables

---

## Usage

### Setup Environment Variables

Copy `.env.example` ke `.env` dan isi:

```bash
cp .env.example .env
```

Edit `.env`:
```env
RPC_URL=https://rpc.demigohu.com
RPC_API_KEY=your_api_key_here
RPC_TIMEOUT=120
```

### Test RPC Client

```bash
# Test dengan transaction hash
npm run test:rpc 0x1234567890abcdef...

# Atau langsung dengan tsx
npx tsx scripts/test-rpc.ts 0x1234567890abcdef...
```

### Use in Code

```typescript
import { createRPCClient } from "@/lib/rpc";

const client = createRPCClient();

// Get transaction
const tx = await client.getTransaction("0x...");

// Get receipt
const receipt = await client.getTransactionReceipt("0x...");

// Debug trace (THE MAIN ONE!)
const trace = await client.debugTraceTransaction("0x...", {
  timeout: "120s",
  enableMemory: true,
  enableReturnData: true,
  disableStack: false,
  disableStorage: false,
});

console.log(`Found ${trace.structLogs.length} structLogs`);
```

---

## Key Features

### ✅ debug_traceTransaction Support

RPC client support full `debug_traceTransaction` dengan options:
- `timeout` - Request timeout (default: 120s)
- `enableMemory` - Include memory in structLogs (needed untuk extract calldata)
- `enableReturnData` - Include return data
- `disableStack` - Disable stack (default: false, kita perlu stack)
- `disableStorage` - Disable storage (default: false, kita perlu untuk SLOAD/SSTORE)

### ✅ Type Safety

Semua RPC responses fully typed dengan TypeScript untuk:
- Better IDE autocomplete
- Compile-time error checking
- Self-documenting code

### ✅ Error Handling

- Hash validation
- RPC error handling dengan clear error messages
- Timeout support

---

## Next Steps

Step 1 ✅ Complete! 

**Step 2**: Implement structLogs parser untuk convert raw structLogs menjadi TraceNode tree.

---

## Notes

- RPC client menggunakan `viem` untuk standard eth methods (getTransaction, getReceipt, getBlock)
- Untuk `debug_traceTransaction`, kita pakai raw fetch karena viem tidak support debug methods
- API key di-pass via `x-api-key` header sesuai PRD spec
