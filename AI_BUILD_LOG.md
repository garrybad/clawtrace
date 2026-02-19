# AI Build Log – ClawTrace

This document describes how AI (Cursor + Claude) was used to build ClawTrace for Good Vibes Only: OpenClaw Edition.

---

## Tools Used

- **Cursor** – IDE with AI pair programming (Claude)
- **Model** – Claude (via Cursor Agent)

---

## How to Capture Prompts in Cursor

Cursor does not have a built-in "export prompts" feature. To document AI usage:

1. **Copy from chat** – Select key prompts/responses in the Cursor chat panel and copy manually.
2. **Screenshots** – Capture the chat panel showing prompts and generated code.
3. **Transcript files** – Cursor stores agent transcripts in:
   ```
   ~/.cursor/projects/<project-id>/agent-transcripts/*.jsonl
   ```
   These are JSONL files; you can parse them to extract prompts and responses. Example:
   ```bash
   # List transcripts
   ls ~/.cursor/projects/*/agent-transcripts/
   ```
4. **Manual summary** – Write down the main prompts you used (see examples below).

---

## Example Prompts & AI Contributions

### 1. Tenderly-style parser

**Prompt (summary):**  
"Buatkan parser dari structLogs dan hasil format datanya mirip seperti Tenderly"

**AI output:**  
- Implemented `tenderly-parser.ts` with call stack tracking, SLOAD/SSTORE extraction, REVERT decoding
- Tenderly-style `call_trace` structure with nested `calls[]`, `stack_trace`

---

### 2. Backend pipeline

**Prompt (summary):**  
"get tx hash / receipt > parse > balikin json, get contract abi > parse > json, gabungkan dan tampilin di frontend?"

**AI output:**  
- Refactored into modular services: `TransactionService`, `ContractService`, `TraceParsingService`, `TraceService`
- API flow: RPC → Etherscan → parse → return combined `TraceResponse`

---

### 3. Flash loan mock

**Prompt (summary):**  
"Brainstorm contract yang gagal interact, maybe flash loan? Develop di contracts/, BSC testnet 97"

**AI output:**  
- `MockToken.sol`, `FlashLoanPool.sol`, `FlashLoanBorrower.sol` (reverts in callback)
- Deploy script, test script, `test-flashloan-onchain.sh`

---

### 4. AI insight integration

**Prompt (summary):**  
"Kirim source code juga dong ke AI" (for root cause analysis)

**AI output:**  
- Updated `buildAIPayload()` to include truncated source code in the prompt
- Groq integration for `rootCause`, `fixSuggestions`, `codeSnippet`

---

### 5. Trace display & parser fixes

**Prompts (summary):**  
- "Kok internal gitu dan panjang banget" → Removed granular JUMPDEST tracking
- "Ada line error di parser.ts" → Fixed BigInt literals for ES2017 compatibility

---

## What Was Built by AI vs Human

| Area | AI | Human |
|------|----|-------|
| Tenderly parser logic | Structure, opcode handling, call stack | Review, edge cases |
| Service architecture | Modular split, flow design | Naming, final structure |
| Flash loan contracts | Full Solidity + deploy/test scripts | Design choices |
| AI prompt (Groq) | System prompt, payload shape | Domain context |
| Frontend components | Trace tree, AI panel UI | Styling, UX tweaks |
| README & docs | Structure, sections | Facts, URLs |

---

## Screenshots (Optional)

Add screenshots of Cursor chat showing:
- A prompt that led to a major feature
- Generated code being used in the codebase
- Iteration on a complex task (e.g. parser fixes)

---

## Tips for Future AI Build Logs

1. **Note prompts as you go** – Copy or screenshot important prompts right after using them.
2. **Use short summaries** – You don’t need the exact prompt, a summary is enough.
3. **Link to files** – Mention which files were created or heavily modified by AI.
4. **Transcript parsing** – For long sessions, you can write a small script to extract prompts from `agent-transcripts/*.jsonl`.
