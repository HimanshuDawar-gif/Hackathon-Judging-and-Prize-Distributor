#!/usr/bin/env bash
# ── Fund a Testnet account via Friendbot ──────────────────────────────
# Usage: bash scripts/fund-account.sh [address]
#
# If no address is given, generates and funds a new keypair named "dev".

set -euo pipefail

NETWORK="testnet"
KEY_NAME="${1:-dev}"

echo "🔑 Generating keypair '${KEY_NAME}'..."
stellar keys generate "${KEY_NAME}" --network ${NETWORK} --fund 2>/dev/null || true

ADDRESS=$(stellar keys address "${KEY_NAME}")
echo "📡 Funding ${ADDRESS} via Friendbot..."

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://friendbot.stellar.org?addr=${ADDRESS}")

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ Account funded successfully!"
  echo "   Address: ${ADDRESS}"
  echo "   Secret:  $(stellar keys show ${KEY_NAME})"
else
  echo "⚠️  Friendbot returned HTTP ${HTTP_CODE}"
  echo "   The account may already be funded or the network may be slow."
  echo "   Address: ${ADDRESS}"
fi
