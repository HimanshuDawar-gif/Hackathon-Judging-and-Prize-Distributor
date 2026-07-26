// ── Network Configuration (Testnet) ──────────────────────────────────
export const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
export const RPC_URL = "https://soroban-testnet.stellar.org";
export const FRIENDBOT_URL = "https://friendbot.stellar.org";

// ── Explorer ─────────────────────────────────────────────────────────
export const STELLAR_EXPLORER = "https://stellar.expert";
export const explorerTx = (hash: string, network: "testnet" | "public" = "testnet") =>
  `${STELLAR_EXPLORER}/${network}/tx/${hash}`;
export const explorerContract = (id: string, network: "testnet" | "public" = "testnet") =>
  `${STELLAR_EXPLORER}/${network}/contract/${id}`;

// ── Contract ─────────────────────────────────────────────────────────
// Deployed address goes here — or read from env at runtime
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";

// ── Polling / Event config ───────────────────────────────────────────
export const EVENT_POLL_INTERVAL_MS = 12_000; // ~2 ledgers
export const EVENT_BACKOFF_MAX_MS = 60_000;

// ── Display helpers ──────────────────────────────────────────────────
export const truncateAddress = (addr: string, chars = 6) =>
  `${addr.slice(0, chars)}…${addr.slice(-chars)}`;

export const formatAmount = (drops: number | bigint) => {
  const xlm = Number(drops) / 10_000_000;
  return xlm.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
