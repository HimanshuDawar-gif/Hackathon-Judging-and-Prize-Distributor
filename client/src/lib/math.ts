// ── Basis-point payout math ──────────────────────────────────────────

/** Given a total pool (in drops) and a Vec of basis-point allocations,
 *  return each winner's share (in drops). */
export function computePayouts(poolDrops: bigint, bpsSplit: number[]): bigint[] {
  const totalBps = bpsSplit.reduce((a, b) => a + b, 0);
  if (totalBps !== 10_000) throw new Error("bps split must sum to 10 000");
  return bpsSplit.map((bps) => (poolDrops * BigInt(bps)) / BigInt(10_000));
}

/** Average score from a vote total. Returns value × 100 for display precision. */
export function avgScoreX100(totalScore: number, voteCount: number): number {
  if (voteCount === 0) return 0;
  return Math.round((totalScore * 100) / voteCount);
}

/** Format avg_x100 to a human-readable score like "85.50" */
export function formatScore(avgX100: number): string {
  return (avgX100 / 100).toFixed(2);
}
