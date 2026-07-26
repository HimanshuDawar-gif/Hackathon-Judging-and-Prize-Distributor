"use client";
// ── useRole hook ─────────────────────────────────────────────────────
// Detects the connected wallet's role by querying the contract.

import { useQuery } from "@tanstack/react-query";
import { getOrganizer, getJudges } from "@/lib/contract";
import type { UserRole } from "@/types/contract";

export function useRole(address: string | null) {
  return useQuery<UserRole>({
    queryKey: ["role", address],
    queryFn: async () => {
      if (!address) return "observer";
      try {
        const organizer = await getOrganizer();
        if (address === organizer) return "organizer";
        const judges = await getJudges();
        if (judges.includes(address)) return "judge";
        return "observer";
      } catch {
        return "observer";
      }
    },
    enabled: !!address,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
