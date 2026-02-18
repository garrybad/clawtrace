# ClawTrace PRD
## AI Transaction Trace & Failure Analyzer for BNB Chain

---

# 1. Overview

ClawTrace adalah developer tool untuk melakukan full transaction tracing, failure diagnosis, dan AI-assisted debugging pada transaksi di BNB Chain.

ClawTrace memungkinkan developer:

- Menelusuri call tree lengkap transaksi
- Mengidentifikasi titik kegagalan internal call
- Mendecode revert reason dan custom error
- Mendapatkan analisis penyebab kegagalan dari AI
- Mendapatkan saran perbaikan teknis yang actionable

Produk ini berfungsi sebagai:

> Tenderly-like tracing + AI debugging layer khusus untuk BNB Chain.

---

# 2. Goals

## Primary Goals

1. Memberikan call trace lengkap dari transaksi BNB testnet
2. Mengidentifikasi root cause kegagalan transaksi
3. Memberikan analisis AI berbasis data trace
4. Memberikan solusi teknis konkret untuk developer
5. Menyediakan UI yang mudah dipahami dalam demo hackathon

## Secondary Goals

- Membuat tool reusable oleh developer lain
- Menjadi fondasi debugging infra untuk BNB ecosystem
- Menyediakan reproducible output dari tx hash saja

---

# 3. Target Users

## Primary Users
- Smart contract developers
- Web3 frontend integrators
- DeFi protocol builders
- Hackathon participants

## Secondary Users
- QA engineers
- Junior dev belajar debugging
- Auditor tahap awal

---

# 4. Product Scope

ClawTrace menerima:

- Transaction hash
- Network selection (BNB Testnet)

ClawTrace menghasilkan:

1. Transaction summary  
2. Decoded function call  
3. Full internal call tree  
4. Failing frame detection  
5. Revert reason decoding  
6. AI root cause explanation  
7. Fix suggestions  

---

# 5. System Architecture

## 5.1 High-Level Flow

User input tx hash  
↓  
Frontend sends request to API  
↓  
Backend fetches trace from Own RPC  
↓  
Trace parser extracts call tree & failure node  
↓  
Decoder resolves function + errors  
↓  
AI Groq analyzes structured trace  
↓  
Response returned to UI  
↓  
UI renders trace + explanation  

---

## 5.2 Components

### Frontend
- Next.js + TypeScript
- Trace visualization UI
- Report viewer
- Prompt-free UX (tx hash driven)

### Backend API
- Next.js API routes / server actions
- OWN RPC client
- Trace parser Opcode like Tenderly
- Decoder engine
- Groq AI integration

### External Services

#### RPC Provider
- Own BNB Testnet node  
- Debug & trace enabled  
- Supports `debug_traceTransaction`

### RPC USAGE
```
curl -X POST https://rpc.demigohu.com   
-H "Content-Type: application/json"   
-H "x-api-key: API_KEY"   

-d '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"debug_traceTransaction",
    "params":[
      "TX_HASH",
      {
        "timeout":"120s",
        "enableMemory": true,
        "enableReturnData": true,
        "disableStack": false,
        "disableStorage": false
      }
    ]
  }' | jq .
```

#### AI Provider
- Groq LLM endpoint  
- Used for reasoning & suggestions

---

# 6. Core Features

---

## 6.1 Transaction Input

User provides:

- tx hash
- network selector

System validates:
- hash format
- existence on chain

---

## 6.2 Transaction Summary

Display:

- status (success/failed)
- block number
- gas used
- gas limit
- from/to
- value sent
- contract address
- timestamp

---

## 6.3 Function Decoder

Decode:

- function name
- parameters
- token addresses
- values

Resolution priority:

1. Explorer ABI lookup  
2. Signature DB lookup  
3. Fallback to raw selector  

---

## 6.4 Full Call Trace Viewer (Core Feature)

ClawTrace requests:

debug_traceTransaction(txHash, { tracer: "callTracer" })

System extracts:

- call hierarchy
- nested contract calls
- gas per call
- input/output data
- error propagation

UI shows tree structure where failing frame is highlighted.

---

## 6.5 Failure Detection Engine

System identifies:

- deepest failing frame
- revert data
- panic code
- custom error
- require failure
- out-of-gas pattern

---

## 6.6 Revert Decoder

ClawTrace attempts:

1. Decode standard `Error(string)`
2. Decode `Panic(uint256)`
3. Decode custom errors via ABI
4. Map router known errors
5. Fallback to hex explanation

---

## 6.7 AI Diagnosis Panel (Groq)

AI receives structured JSON:

- decoded call tree
- failing frame
- revert reason
- tx context

AI outputs:

- explanation in natural language
- root cause classification
- confidence level
- actionable fix suggestions

Example output:

The transaction failed because the router attempted to transfer tokens using transferFrom, but the wallet had not granted allowance to the router. Without allowance, ERC20 transfers revert.

---

## 6.8 Fix Suggestions

System provides:

- checklist actions
- parameter corrections
- call order changes
- common DeFi fixes

Examples:

- Approve token before swap
- Increase slippage tolerance
- Provide msg.value
- Extend deadline
- Increase gas limit

---

# 7. UX Design

---

## Page 1 — Input

Fields:

- Transaction hash
- Network dropdown
- Analyze button

---

## Page 2 — Report

Sections:

### Header
- status
- function
- gas summary

### Call Trace Panel
- tree visualization
- failing node highlighted

### Failure Diagnosis
- decoded reason
- classification

### AI Explanation
- natural language summary
- fix suggestions

---

# 8. Technical Stack

## Frontend
- Next.js
- TypeScript
- React
- Tailwind CSS (optional)

## Backend
- Next.js API routes
- viem / ethers for RPC calls
- custom trace parser

## AI
- Groq API
- structured prompt template

## RPC
- Own BNB Testnet
- debug enabled
- archive-capable node

---

# 9. Non-Goals (Hackathon Scope Control)

Not included:

- full smart contract auditing
- vulnerability scanning
- exploit detection
- multi-chain support
- automated patch generation
- static code analysis

---

# 10. Demo Plan

### Scenario 1
Send swap tx with too strict slippage → fail  
Paste tx hash → ClawTrace detects root cause  

### Scenario 2
Send tx without allowance → fail  
ClawTrace highlights failing transferFrom  

Judge verifies tx hash on explorer.

---

# 11. Success Metrics

- Trace retrieval < 5 seconds
- Root cause detected correctly
- AI suggestions relevant
- Demo reproducible
- UI understandable in < 1 minute
