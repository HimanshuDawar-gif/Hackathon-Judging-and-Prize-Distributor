"use client";
// ── useContract hook ─────────────────────────────────────────────────
// React Query hooks for all contract reads and writes.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLeaderboard,
  getPoolBalance,
  getJudges,
  getSubmissions,
  isDistributed,
  getSubmissionCount,
  getOrganizer,
  getTopN,
  getPayoutSplit,
  hasJudged,
  addJudge,
  addSubmission,
  fundPool,
  submitScore,
  distributePrizes,
} from "@/lib/contract";
import { useUIStore } from "@/store/ui";

// ── Read queries ─────────────────────────────────────────────────────

export function useLeaderboard() {
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: getLeaderboard,
    refetchInterval: 12_000,
  });
}

export function usePoolBalance() {
  return useQuery({
    queryKey: ["poolBalance"],
    queryFn: getPoolBalance,
    refetchInterval: 12_000,
  });
}

export function useJudges() {
  return useQuery({
    queryKey: ["judges"],
    queryFn: getJudges,
    refetchInterval: 30_000,
  });
}

export function useSubmissions() {
  return useQuery({
    queryKey: ["submissions"],
    queryFn: getSubmissions,
    refetchInterval: 12_000,
  });
}

export function useIsDistributed() {
  return useQuery({
    queryKey: ["isDistributed"],
    queryFn: isDistributed,
    refetchInterval: 12_000,
  });
}

export function useSubmissionCount() {
  return useQuery({
    queryKey: ["submissionCount"],
    queryFn: getSubmissionCount,
  });
}

export function useOrganizer() {
  return useQuery({
    queryKey: ["organizer"],
    queryFn: getOrganizer,
    staleTime: 60_000,
  });
}

export function useTopN() {
  return useQuery({
    queryKey: ["topN"],
    queryFn: getTopN,
    staleTime: 60_000,
  });
}

export function usePayoutSplit() {
  return useQuery({
    queryKey: ["payoutSplit"],
    queryFn: getPayoutSplit,
    staleTime: 60_000,
  });
}

export function useHasJudged(submissionId: bigint | null, judge: string | null) {
  return useQuery({
    queryKey: ["hasJudged", submissionId?.toString(), judge],
    queryFn: () => hasJudged(submissionId!, judge!),
    enabled: !!submissionId && !!judge,
  });
}

// ── Write mutations ──────────────────────────────────────────────────

export function useAddJudgeMutation() {
  const qc = useQueryClient();
  const { addTx, updateTx } = useUIStore.getState();
  return useMutation({
    mutationFn: async ({ caller, judge, signFn }: { caller: string; judge: string; signFn: (xdr: string) => Promise<{ signedTxXdr: string }> }) => {
      const hash = await addJudge(caller, judge, signFn);
      return hash;
    },
    onSuccess: (hash) => {
      addTx({ hash, method: "add_judge", status: "success", timestamp: Date.now() });
      qc.invalidateQueries({ queryKey: ["judges"] });
    },
    onError: (err, vars, context) => {
      addTx({ hash: "", method: "add_judge", status: "failed", error: err.message, timestamp: Date.now() });
    },
  });
}

export function useAddSubmissionMutation() {
  const qc = useQueryClient();
  const { addTx } = useUIStore.getState();
  return useMutation({
    mutationFn: async ({ caller, name, teamAddress, signFn }: { caller: string; name: string; teamAddress: string; signFn: (xdr: string) => Promise<{ signedTxXdr: string }> }) => {
      return addSubmission(caller, name, teamAddress, signFn);
    },
    onSuccess: (hash) => {
      addTx({ hash, method: "add_submission", status: "success", timestamp: Date.now() });
      qc.invalidateQueries({ queryKey: ["submissions"] });
      qc.invalidateQueries({ queryKey: ["submissionCount"] });
    },
    onError: (err) => {
      addTx({ hash: "", method: "add_submission", status: "failed", error: err.message, timestamp: Date.now() });
    },
  });
}

export function useFundPoolMutation() {
  const qc = useQueryClient();
  const { addTx } = useUIStore.getState();
  return useMutation({
    mutationFn: async ({ funder, amount, signFn }: { funder: string; amount: bigint; signFn: (xdr: string) => Promise<{ signedTxXdr: string }> }) => {
      return fundPool(funder, amount, signFn);
    },
    onSuccess: (hash) => {
      addTx({ hash, method: "fund_pool", status: "success", timestamp: Date.now() });
      qc.invalidateQueries({ queryKey: ["poolBalance"] });
    },
    onError: (err) => {
      addTx({ hash: "", method: "fund_pool", status: "failed", error: err.message, timestamp: Date.now() });
    },
  });
}

export function useSubmitScoreMutation() {
  const qc = useQueryClient();
  const { addTx } = useUIStore.getState();
  return useMutation({
    mutationFn: async ({ judge, submissionId, score, signFn }: { judge: string; submissionId: bigint; score: number; signFn: (xdr: string) => Promise<{ signedTxXdr: string }> }) => {
      return submitScore(judge, submissionId, score, signFn);
    },
    onSuccess: (hash) => {
      addTx({ hash, method: "submit_score", status: "success", timestamp: Date.now() });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      qc.invalidateQueries({ queryKey: ["hasJudged"] });
    },
    onError: (err) => {
      addTx({ hash: "", method: "submit_score", status: "failed", error: err.message, timestamp: Date.now() });
    },
  });
}

export function useDistributePrizesMutation() {
  const qc = useQueryClient();
  const { addTx } = useUIStore.getState();
  return useMutation({
    mutationFn: async ({ caller, signFn }: { caller: string; signFn: (xdr: string) => Promise<{ signedTxXdr: string }> }) => {
      return distributePrizes(caller, signFn);
    },
    onSuccess: (hash) => {
      addTx({ hash, method: "distribute_prizes", status: "success", timestamp: Date.now() });
      qc.invalidateQueries({ queryKey: ["isDistributed"] });
      qc.invalidateQueries({ queryKey: ["poolBalance"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
    },
    onError: (err) => {
      addTx({ hash: "", method: "distribute_prizes", status: "failed", error: err.message, timestamp: Date.now() });
    },
  });
}
