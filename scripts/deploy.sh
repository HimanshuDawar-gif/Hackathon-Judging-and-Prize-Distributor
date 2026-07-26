#!/usr/bin/env bash
# ── Deploy hackathon-judging contract to Testnet ──────────────────────
# Usage: bash scripts/deploy.sh
#
# Prerequisites:
#   - stellar CLI installed (v27+)
#   - A funded Testnet account (or run fund-account.sh first)
#
# What it does:
#   1. Builds the contract Wasm
#   2. Generates a deployer keypair (or uses existing)
#   3. Funds the deployer via Friendbot
#   4. Deploys the contract
#   5. Prints the contract address

set -euo pipefail

NETWORK="testnet"
RPC_URL="https://soroban-testnet.stellar.org"
CONTRACT_DIR="contract/contracts/contract"
WASM_PATH="contract/target/wasm32v1-none/release/hello_world.wasm"
DEPLOYER_KEY="dev"

echo "🔨 Building contract..."
cd "$(dirname "$0")/.."
cargo build --target wasm32v1-none --release --manifest-path "${CONTRACT_DIR}/Cargo.toml"

echo ""
echo "🔑 Generating / loading deployer keypair..."
stellar keys generate ${DEPLOYER_KEY} --network ${NETWORK} --fund 2>/dev/null || true
PUBKEY=$(stellar keys address ${DEPLOYER_KEY})
echo "   Deployer address: ${PUBKEY}"

echo ""
echo "🚀 Deploying contract..."
CONTRACT_ID=$(stellar contract deploy \
  --wasm "${WASM_PATH}" \
  --source-account ${DEPLOYER_KEY} \
  --network ${NETWORK})

echo ""
echo "✅ Contract deployed!"
echo "   Contract address: ${CONTRACT_ID}"
echo ""
echo "Add this to your .env.local:"
echo "   NEXT_PUBLIC_CONTRACT_ADDRESS=${CONTRACT_ID}"
