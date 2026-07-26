"use client";
// ── Contract Client (using auto-generated bindings) ───────────────────

import { Client, networks, type LeaderboardEntry, type SubmissionData } from "contract";
import { type AssembledTransaction } from "@stellar/stellar-sdk/contract";
import { CONTRACT_ADDRESS, RPC_URL, NETWORK_PASSPHRASE } from "./constants";

// ── Singleton client ─────────────────────────────────────────────────

let _client: Client | null = null;

export function getContractClient(): Client {
  if (!_client) {
    _client = new Client({
      contractId: CONTRACT_ADDRESS || networks.testnet.contractId,
      networkPassphrase: NETWORK_PASSPHRASE,
      rpcUrl: RPC_URL,
    });
  }
  return _client;
}

// ── Sign-and-send helper ─────────────────────────────────────────────

async function signAndSend(
  assembled: AssembledTransaction<unknown>,
  signFn: (xdr: string) => Promise<{ signedTxXdr: string }>,
): Promise<string> {
  const sent = await assembled.signAndSend({ signTransaction: signFn as any });
  // The hash is available from the sendTransactionResponse
  const hash = sent.sendTransactionResponse?.hash ?? "";
  return hash;
}

// ── Read-only helpers ────────────────────────────────────────────────

export async function getOrganizer(): Promise<string> {
  const c = getContractClient();
  const result = await c.get_organizer();
  return result.result;
}

export async function getTopN(): Promise<number> {
  const c = getContractClient();
  const result = await c.get_top_n();
  return result.result;
}

export async function getPayoutSplit(): Promise<number[]> {
  const c = getContractClient();
  const result = await c.get_payout_split();
  return result.result.map(Number);
}

export async function getTokenAddress(): Promise<string> {
  const c = getContractClient();
  const result = await c.get_token();
  return result.result;
}

export async function getPoolBalance(): Promise<bigint> {
  const c = getContractClient();
  const result = await c.get_pool_balance();
  return BigInt(result.result.toString());
}

export async function isDistributed(): Promise<boolean> {
  const c = getContractClient();
  const result = await c.is_distributed();
  return result.result;
}

export async function getSubmissionCount(): Promise<bigint> {
  const c = getContractClient();
  const result = await c.get_submission_count();
  return BigInt(result.result.toString());
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const c = getContractClient();
  const result = await c.get_leaderboard();
  return result.result;
}

export async function getJudges(): Promise<string[]> {
  const c = getContractClient();
  const result = await c.get_judges();
  const map = result.result;
  return Array.from(map.entries())
    .filter(([, v]) => v)
    .map(([k]) => k);
}

export async function getSubmissions(): Promise<SubmissionData[]> {
  const c = getContractClient();
  const result = await c.get_submissions();
  const map = result.result;
  return Array.from(map.values());
}

export async function hasJudged(submissionId: bigint, judge: string): Promise<boolean> {
  const c = getContractClient();
  const result = await c.has_judged({ submission_id: submissionId, judge });
  return result.result;
}

// ── State-changing wrappers ──────────────────────────────────────────

export async function addJudge(
  caller: string,
  judge: string,
  signFn: (xdr: string) => Promise<{ signedTxXdr: string }>,
): Promise<string> {
  const c = getContractClient();
  const tx = await c.add_judge({ caller, judge });
  return signAndSend(tx, signFn);
}

export async function addSubmission(
  caller: string,
  name: string,
  teamAddress: string,
  signFn: (xdr: string) => Promise<{ signedTxXdr: string }>,
): Promise<string> {
  const c = getContractClient();
  const tx = await c.add_submission({ caller, name, team_address: teamAddress });
  return signAndSend(tx, signFn);
}

export async function fundPool(
  funder: string,
  amount: bigint,
  signFn: (xdr: string) => Promise<{ signedTxXdr: string }>,
): Promise<string> {
  const c = getContractClient();
  const tx = await c.fund_pool({ funder, amount });
  return signAndSend(tx, signFn);
}

export async function submitScore(
  judge: string,
  submissionId: bigint,
  score: number,
  signFn: (xdr: string) => Promise<{ signedTxXdr: string }>,
): Promise<string> {
  const c = getContractClient();
  const tx = await c.submit_score({
    judge,
    submission_id: submissionId,
    score,
  });
  return signAndSend(tx, signFn);
}

export async function distributePrizes(
  caller: string,
  signFn: (xdr: string) => Promise<{ signedTxXdr: string }>,
): Promise<string> {
  const c = getContractClient();
  const tx = await c.distribute_prizes({ caller });
  return signAndSend(tx, signFn);
}

export type { LeaderboardEntry, SubmissionData };
