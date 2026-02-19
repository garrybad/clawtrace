# Flash Loan Mock (BSC Testnet)

Mock flash loan contracts for **ClawTrace** testing — transactions that intentionally fail for trace visualization.

## Contracts

| Contract | Description |
|----------|-------------|
| `MockToken` | ERC20 token with `mint` |
| `FlashLoanPool` | Simple flash loan pool (borrow → callback → repay) |
| `FlashLoanBorrower` | Borrower that **reverts** in callback |

## Revert Scenarios

| Function | Error |
|----------|-------|
| `executeFlashLoan(amount)` | `InsufficientRepayment(required, provided)` |
| `executeFlashLoanAndRevert(amount)` | `"Arbitrage failed: insufficient profit"` |

---

## 1. Setup

### 1.1 Environment

Create `contracts/.env`:

```env
BSC_TESTNET_URL=https://data-seed-prebsc-1-s1.binance.org:8545
PRIVATE_KEY=0x...   # wallet with BNB on BSC Testnet
ETHERSCAN_API_KEY=...  # optional, for verify
```

### 1.2 Get Testnet BNB

https://testnet.bnbchain.org/faucet-smart

---

## 2. Build

```bash
cd contracts
forge build
```

---

## 3. Unit Test

```bash
cd contracts
forge test
```

Expected: all tests pass.

---

## 4. Deploy

```bash
cd contracts
forge script script/DeployFlashLoan.s.sol --rpc-url bsc-testnet --broadcast
```

Example output:

```
MockToken: 0x...
FlashLoanPool: 0x...
FlashLoanBorrower: 0x...
```

### Deploy + Verify

```bash
forge script script/DeployFlashLoan.s.sol --rpc-url bsc-testnet --broadcast --verify
```

---

## 5. Verify (manual)

If you skipped `--verify` on deploy:

```bash
forge verify-contract <ADDRESS> src/<Contract>.sol:<Contract> \
  --chain-id 97 \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

For contracts with constructor args, add `--constructor-args $(cast abi-encode ...)`. Prefer `--broadcast --verify` on deploy.

---

## 6. On-Chain Test (generate failing txs)

Run the script to send 2 failing transactions. Output: tx hashes for ClawTrace.

```bash
cd contracts
./scripts/test-flashloan-onchain.sh
```

Example output:

```
=== Flash Loan On-Chain Test (BSC Testnet) ===
Borrower: 0xC9E8e68de7ECBFe54C573003e09B945DD7A42018

1. executeFlashLoan(1e18) - reverts with InsufficientRepayment
   Tx hash: 0x...
   https://testnet.bscscan.com/tx/0x...

2. executeFlashLoanAndRevert(1e18) - reverts with 'Arbitrage failed'
   Tx hash: 0x...
   https://testnet.bscscan.com/tx/0x...

=== Paste tx hash above into ClawTrace to inspect trace ===
```

### Manual cast send

```bash
# Update BORROWER if you deployed fresh
BORROWER=0xC9E8e68de7ECBFe54C573003e09B945DD7A42018

# executeFlashLoan - InsufficientRepayment
cast send $BORROWER "executeFlashLoan(uint256)" 1000000000000000000 \
  --rpc-url bsc-testnet \
  --private-key $PRIVATE_KEY \
  --gas-limit 500000 \
  --async

# executeFlashLoanAndRevert - Arbitrage failed
cast send $BORROWER "executeFlashLoanAndRevert(uint256)" 1000000000000000000 \
  --rpc-url bsc-testnet \
  --private-key $PRIVATE_KEY \
  --gas-limit 500000 \
  --async
```

---

## Deployed Addresses (reference)

| Contract | BSC Testnet |
|----------|-------------|
| MockToken | `0xd26fc9f7FeF678C67377d655c2aC26Ae6D5c7683` |
| FlashLoanPool | `0xecce43ad5e2EaDfB3466b83A51514B51e3146797` |
| FlashLoanBorrower | `0xC9E8e68de7ECBFe54C573003e09B945DD7A42018` |

Update `BORROWER` in `scripts/test-flashloan-onchain.sh` if you deploy new contracts.
