// ── Contract Types (mirrors generated bindings) ──────────────────────

export type { LeaderboardEntry, SubmissionData } from "contract";

// ── UI / App Types ──────────────────────────────────────────────────

export type UserRole = "organizer" | "judge" | "observer";

export interface WalletState {
  address: string | null;
  connected: boolean;
  network: "testnet" | "public" | null;
}

export interface TxRecord {
  hash: string;
  method: string;
  status: "pending" | "success" | "failed";
  error?: string;
  timestamp: number;
}

export interface ActivityEvent {
  type: "JudgeAdded" | "SubmissionAdded" | "ScoreSubmitted" | "PoolFunded" | "PrizesDistributed";
  ledger: number;
  timestamp: number;
  data: Record<string, unknown>;
  txHash?: string;
}
