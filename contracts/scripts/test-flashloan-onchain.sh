#!/usr/bin/env bash
# Test Flash Loan on BSC Testnet - sends failing txs for ClawTrace
# Run from contracts/: ./scripts/test-flashloan-onchain.sh

set -e

BORROWER="0xC9E8e68de7ECBFe54C573003e09B945DD7A42018"
RPC="${BSC_TESTNET_URL:-https://bsc-testnet.4everland.org/v1/1da45bd8c7fef7f1c59ebaf4ef5bfea0}"

# Load .env from contracts/ or parent
if [ -f .env ]; then
  set -a
  source .env
  set +a
elif [ -f ../.env ]; then
  set -a
  source ../.env
  set +a
fi

if [ -z "$PRIVATE_KEY" ]; then
  echo "Error: PRIVATE_KEY not set in .env"
  exit 1
fi

echo "=== Flash Loan On-Chain Test (BSC Testnet) ==="
echo "Borrower: $BORROWER"
echo ""

# --gas-limit: skip gas estimation (tx reverts, so estimation fails)
# --async: print hash immediately (tx still gets mined and will revert)
echo "1. executeFlashLoan(1e18) - reverts with InsufficientRepayment"
HASH1=$(cast send "$BORROWER" "executeFlashLoan(uint256)" 1000000000000000000 \
  --rpc-url "$RPC" \
  --private-key "$PRIVATE_KEY" \
  --gas-limit 500000 \
  --async)
echo "   Tx hash: $HASH1"
[ -n "$HASH1" ] && echo "   https://testnet.bscscan.com/tx/$HASH1"
echo ""

echo "2. executeFlashLoanAndRevert(1e18) - reverts with 'Arbitrage failed'"
HASH2=$(cast send "$BORROWER" "executeFlashLoanAndRevert(uint256)" 1000000000000000000 \
  --rpc-url "$RPC" \
  --private-key "$PRIVATE_KEY" \
  --gas-limit 500000 \
  --async)
echo "   Tx hash: $HASH2"
[ -n "$HASH2" ] && echo "   https://testnet.bscscan.com/tx/$HASH2"
echo ""
echo "=== Paste tx hash above into ClawTrace to inspect trace ==="
