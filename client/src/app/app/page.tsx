"use client";

import { useState, useMemo } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useRole } from "@/hooks/useRole";
import {
  useLeaderboard,
  usePoolBalance,
  useSubmissions,
  useIsDistributed,
  usePayoutSplit,
  useTopN,
  useHasJudged,
  useAddJudgeMutation,
  useAddSubmissionMutation,
  useFundPoolMutation,
  useSubmitScoreMutation,
  useDistributePrizesMutation,
} from "@/hooks/useContract";
import { truncateAddress, formatAmount } from "@/lib/constants";
import { formatScore } from "@/lib/math";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  UserPlus,
  FilePlus,
  Coins,
  Trophy,
  Send,
  CheckCircle2,
  AlertTriangle,
  ClipboardCheck,
  Loader2,
} from "lucide-react";
import type { LeaderboardEntry } from "contract";

type ToastFn = (msg: string, variant?: "success" | "error" | "info") => void;

export default function AppPage() {
  const { address, signTransaction } = useWallet();
  const { data: role } = useRole(address);
  const { addToast } = useToast();

  const { data: leaderboard, isLoading: lbLoading } = useLeaderboard();
  const { data: poolBalance, isLoading: poolLoading } = usePoolBalance();
  const { data: isDistributed, isLoading: distLoading } = useIsDistributed();
  const { data: payoutSplit } = usePayoutSplit();
  const { data: topN } = useTopN();

  if (!address) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <UserPlus className="h-10 w-10 text-zinc-600" />
        <h1 className="text-xl font-semibold">Connect Your Wallet</h1>
        <p className="max-w-sm text-sm text-zinc-400">
          You need to connect a wallet to access the judging console.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Judging Console
          </h1>
          <p className="text-sm text-zinc-400">
            Role:{" "}
            <span className="capitalize font-medium text-zinc-200">
              {role ?? "observer"}
            </span>
          </p>
        </div>
        {isDistributed != null && (
          <Badge
            variant={isDistributed ? "default" : "secondary"}
            className="text-xs"
          >
            {isDistributed ? "Prizes Distributed" : "In Progress"}
          </Badge>
        )}
      </div>

      {isDistributed && (
        <div className="flex items-center gap-3 rounded-lg border border-green-800/40 bg-green-950/50 p-4">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-400" />
          <div>
            <p className="text-sm font-medium text-green-300">
              Prizes have been distributed
            </p>
            <p className="text-xs text-green-400/70">
              All payouts have been sent to top-ranked teams.
            </p>
          </div>
        </div>
      )}

      {role === "organizer" && (
        <OrganizerPanel
          address={address}
          signTransaction={signTransaction}
          addToast={addToast}
        />
      )}
      {role === "judge" && (
        <JudgePanel
          address={address}
          signTransaction={signTransaction}
          addToast={addToast}
        />
      )}
      {role === "observer" && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-zinc-400">
              You are viewing as an observer. Connect as a judge or organizer
              to interact.
            </p>
          </CardContent>
        </Card>
      )}

      <LeaderboardSection leaderboard={leaderboard} isLoading={lbLoading} />

      <div className="grid gap-4 sm:grid-cols-2">
        <PoolSection balance={poolBalance} isLoading={poolLoading} />
        <PayoutSplitSection
          split={payoutSplit}
          topN={topN}
          poolBalance={poolBalance}
        />
      </div>
    </div>
  );
}

// ── Organizer Panel ────────────────────────────────────────────────

function OrganizerPanel({
  address,
  signTransaction,
  addToast,
}: {
  address: string;
  signTransaction: (xdr: string) => Promise<{ signedTxXdr: string }>;
  addToast: ToastFn;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <AddJudgeForm
        address={address}
        signTransaction={signTransaction}
        addToast={addToast}
      />
      <AddSubmissionForm
        address={address}
        signTransaction={signTransaction}
        addToast={addToast}
      />
      <FundPoolForm
        address={address}
        signTransaction={signTransaction}
        addToast={addToast}
      />
      <DistributeForm
        address={address}
        signTransaction={signTransaction}
        addToast={addToast}
      />
    </div>
  );
}

function AddJudgeForm({
  address,
  signTransaction,
  addToast,
}: {
  address: string;
  signTransaction: (xdr: string) => Promise<{ signedTxXdr: string }>;
  addToast: ToastFn;
}) {
  const [judgeAddr, setJudgeAddr] = useState("");
  const addJudge = useAddJudgeMutation();

  const handleSubmit = async () => {
    if (!judgeAddr.trim()) return;
    try {
      await addJudge.mutateAsync({
        caller: address,
        judge: judgeAddr.trim(),
        signFn: signTransaction,
      });
      addToast("Judge added successfully", "success");
      setJudgeAddr("");
    } catch {
      addToast("Failed to add judge", "error");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-blue-400" />
          <CardTitle className="text-base">Add Judge</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Input
          label="Judge Address"
          placeholder="G..."
          value={judgeAddr}
          onChange={(e) => setJudgeAddr(e.target.value)}
        />
        <Button
          onClick={handleSubmit}
          disabled={addJudge.isPending || !judgeAddr.trim()}
          size="sm"
        >
          {addJudge.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          Add Judge
        </Button>
      </CardContent>
    </Card>
  );
}

function AddSubmissionForm({
  address,
  signTransaction,
  addToast,
}: {
  address: string;
  signTransaction: (xdr: string) => Promise<{ signedTxXdr: string }>;
  addToast: ToastFn;
}) {
  const [name, setName] = useState("");
  const [teamAddr, setTeamAddr] = useState("");
  const addSubmission = useAddSubmissionMutation();

  const handleSubmit = async () => {
    if (!name.trim() || !teamAddr.trim()) return;
    try {
      await addSubmission.mutateAsync({
        caller: address,
        name: name.trim(),
        teamAddress: teamAddr.trim(),
        signFn: signTransaction,
      });
      addToast("Submission added", "success");
      setName("");
      setTeamAddr("");
    } catch {
      addToast("Failed to add submission", "error");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FilePlus className="h-4 w-4 text-blue-400" />
          <CardTitle className="text-base">Add Submission</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Input
          label="Project Name"
          placeholder="My Awesome Project"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Team Payout Address"
          placeholder="G..."
          value={teamAddr}
          onChange={(e) => setTeamAddr(e.target.value)}
        />
        <Button
          onClick={handleSubmit}
          disabled={addSubmission.isPending || !name.trim() || !teamAddr.trim()}
          size="sm"
        >
          {addSubmission.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FilePlus className="h-4 w-4" />
          )}
          Add Submission
        </Button>
      </CardContent>
    </Card>
  );
}

function FundPoolForm({
  address,
  signTransaction,
  addToast,
}: {
  address: string;
  signTransaction: (xdr: string) => Promise<{ signedTxXdr: string }>;
  addToast: ToastFn;
}) {
  const [xlmAmount, setXlmAmount] = useState("");
  const fundPool = useFundPoolMutation();

  const dropsAmount = useMemo(() => {
    const num = parseFloat(xlmAmount);
    if (isNaN(num) || num <= 0) return null;
    return BigInt(Math.round(num * 10_000_000));
  }, [xlmAmount]);

  const handleSubmit = async () => {
    if (dropsAmount == null) return;
    try {
      await fundPool.mutateAsync({
        funder: address,
        amount: dropsAmount,
        signFn: signTransaction,
      });
      addToast("Pool funded successfully", "success");
      setXlmAmount("");
    } catch {
      addToast("Failed to fund pool", "error");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-blue-400" />
          <CardTitle className="text-base">Fund Pool</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Input
          label="Amount (XLM)"
          type="number"
          placeholder="100"
          min="0"
          step="0.01"
          value={xlmAmount}
          onChange={(e) => setXlmAmount(e.target.value)}
        />
        {dropsAmount != null && (
          <p className="text-xs text-zinc-500">
            = {dropsAmount.toLocaleString()} stroops
          </p>
        )}
        <Button
          onClick={handleSubmit}
          disabled={fundPool.isPending || dropsAmount == null}
          size="sm"
        >
          {fundPool.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Coins className="h-4 w-4" />
          )}
          Fund Pool
        </Button>
      </CardContent>
    </Card>
  );
}

function DistributeForm({
  address,
  signTransaction,
  addToast,
}: {
  address: string;
  signTransaction: (xdr: string) => Promise<{ signedTxXdr: string }>;
  addToast: ToastFn;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { data: isDistributed } = useIsDistributed();
  const distribute = useDistributePrizesMutation();

  const handleDistribute = async () => {
    try {
      await distribute.mutateAsync({
        caller: address,
        signFn: signTransaction,
      });
      addToast("Prizes distributed!", "success");
      setConfirmOpen(false);
    } catch {
      addToast("Failed to distribute prizes", "error");
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-400" />
            <CardTitle className="text-base">Distribute Prizes</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-xs text-zinc-400">
            Send XLM to the top-ranked teams based on the payout split.
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setConfirmOpen(true)}
            disabled={distribute.isPending || !!isDistributed}
          >
            {distribute.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trophy className="h-4 w-4" />
            )}
            {isDistributed ? "Already Distributed" : "Distribute Prizes"}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Distribution</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex items-start gap-3 rounded-lg border border-yellow-800/40 bg-yellow-950/50 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
              <p className="text-sm text-yellow-300">
                This action is irreversible. Prizes will be sent to the
                top-ranked teams immediately.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDistribute}
                disabled={distribute.isPending}
              >
                {distribute.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Judge Panel ────────────────────────────────────────────────────

function JudgePanel({
  address,
  signTransaction,
  addToast,
}: {
  address: string;
  signTransaction: (xdr: string) => Promise<{ signedTxXdr: string }>;
  addToast: ToastFn;
}) {
  const { data: submissions, isLoading: subLoading } = useSubmissions();
  const [selectedId, setSelectedId] = useState<string>("");
  const [score, setScore] = useState(50);

  const selectedBigInt = selectedId ? BigInt(selectedId) : null;
  const { data: hasJudged } = useHasJudged(selectedBigInt, address);

  const submitScore = useSubmitScoreMutation();

  const submissionList = useMemo(() => {
    if (!submissions) return [];
    return submissions.map((s) => ({
      id: s.id.toString(),
      name: s.name,
      team: s.team_address,
    }));
  }, [submissions]);

  const handleSubmit = async () => {
    if (!selectedBigInt || !address) return;
    try {
      await submitScore.mutateAsync({
        judge: address,
        submissionId: selectedBigInt,
        score,
        signFn: signTransaction,
      });
      addToast("Score submitted", "success");
      setSelectedId("");
      setScore(50);
    } catch {
      addToast("Failed to submit score", "error");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-blue-400" />
          <CardTitle className="text-base">Submit Score</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {subLoading ? (
          <Skeleton className="h-9 w-full" />
        ) : submissionList.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No submissions to score yet.
          </p>
        ) : (
          <>
            <Select
              label="Select Submission"
              placeholder="Choose a project"
              value={selectedId}
              onChange={(e) => {
                setSelectedId(e.target.value);
                setScore(50);
              }}
            >
              {submissionList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({truncateAddress(s.team, 4)})
                </option>
              ))}
            </Select>

            {selectedId && hasJudged && (
              <div className="flex items-center gap-2 rounded-lg border border-yellow-800/40 bg-yellow-950/50 p-3">
                <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-400" />
                <p className="text-xs text-yellow-300">
                  You have already scored this submission.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-300">
                Score: <span className="font-mono text-zinc-100">{score}</span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-zinc-600">
                <span>0</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100</span>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitScore.isPending || !selectedId || !!hasJudged}
              size="sm"
            >
              {submitScore.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Submit Score
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Shared Sections ────────────────────────────────────────────────

function LeaderboardSection({
  leaderboard,
  isLoading,
}: {
  leaderboard: LeaderboardEntry[] | undefined;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-400" />
            <CardTitle className="text-base">Leaderboard</CardTitle>
          </div>
          {leaderboard && (
            <Badge variant="secondary" className="text-xs">
              {leaderboard.length} projects
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !leaderboard || leaderboard.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-500">
            No scores yet. Waiting for judges to submit.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500">
                  <th className="pb-2 pr-4 font-medium">Rank</th>
                  <th className="pb-2 pr-4 font-medium">Project</th>
                  <th className="pb-2 pr-4 font-medium text-right">
                    Avg Score
                  </th>
                  <th className="pb-2 font-medium text-right">Votes</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, i) => (
                  <tr
                    key={entry.id.toString()}
                    className="border-b border-zinc-800/50"
                  >
                    <td className="py-3 pr-4">
                      <RankBadge rank={i + 1} />
                    </td>
                    <td className="py-3 pr-4">
                      <div>
                        <p className="font-medium text-zinc-100">
                          {entry.name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {truncateAddress(entry.team_address)}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-right font-mono tabular-nums">
                      {formatScore(entry.avg_x100)}
                    </td>
                    <td className="py-3 text-right tabular-nums">
                      {entry.votes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const colors: Record<number, string> = {
    1: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    2: "bg-zinc-400/20 text-zinc-300 border-zinc-400/30",
    3: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  };
  return (
    <span
      className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold ${
        colors[rank] ?? "bg-zinc-800 text-zinc-400 border-zinc-700"
      }`}
    >
      {rank}
    </span>
  );
}

function PoolSection({
  balance,
  isLoading,
}: {
  balance: bigint | undefined;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-blue-400" />
          <CardTitle className="text-base">Pool Balance</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-28" />
        ) : (
          <p className="text-2xl font-bold tabular-nums">
            {balance != null ? `${formatAmount(balance)} XLM` : "0.00 XLM"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function PayoutSplitSection({
  split,
  topN,
  poolBalance,
}: {
  split: number[] | undefined;
  topN: number | undefined;
  poolBalance: bigint | undefined;
}) {
  if (!split || !topN) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prize Split</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const rankLabels = ["1st", "2nd", "3rd", "4th", "5th"];
  const rankColors = [
    "bg-yellow-500",
    "bg-zinc-400",
    "bg-orange-500",
    "bg-blue-500",
    "bg-zinc-600",
  ];
  const totalDrops = poolBalance ?? BigInt(0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Prize Split</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex h-4 overflow-hidden rounded-full">
          {split.slice(0, topN).map((bps, i) => (
            <div
              key={i}
              className={`${rankColors[i] ?? "bg-zinc-600"} transition-all`}
              style={{ width: `${bps / 100}%` }}
              title={`${rankLabels[i]}: ${bps / 100}%`}
            />
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          {split.slice(0, topN).map((bps, i) => {
            const pct = bps / 100;
            const xlm =
              totalDrops > BigInt(0)
                ? formatAmount((totalDrops * BigInt(bps)) / BigInt(10_000))
                : "0.00";
            return (
              <div
                key={i}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${rankColors[i] ?? "bg-zinc-600"}`}
                  />
                  <span className="text-zinc-300">{rankLabels[i]}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500 tabular-nums">{pct}%</span>
                  <span className="font-mono tabular-nums text-zinc-400">
                    {xlm} XLM
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
