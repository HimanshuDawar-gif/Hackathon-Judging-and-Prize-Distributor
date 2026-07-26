"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { truncateAddress } from "@/lib/constants";
import {
  UserPlus,
  FilePlus,
  Star,
  Coins,
  Trophy,
  ExternalLink,
  Inbox,
} from "lucide-react";

interface FeedEntry {
  id: string;
  type: "JudgeAdded" | "SubmissionAdded" | "ScoreSubmitted" | "PoolFunded" | "PrizesDistributed";
  timestamp: number;
  address: string;
  description: string;
  txHash?: string;
}

const placeholderEntries: FeedEntry[] = [];

const typeConfig: Record<
  FeedEntry["type"],
  { icon: React.ElementType; label: string; color: string }
> = {
  JudgeAdded: {
    icon: UserPlus,
    label: "Judge Added",
    color: "text-blue-400 bg-blue-600/20",
  },
  SubmissionAdded: {
    icon: FilePlus,
    label: "Submission Added",
    color: "text-purple-400 bg-purple-600/20",
  },
  ScoreSubmitted: {
    icon: Star,
    label: "Score Submitted",
    color: "text-yellow-400 bg-yellow-600/20",
  },
  PoolFunded: {
    icon: Coins,
    label: "Pool Funded",
    color: "text-green-400 bg-green-600/20",
  },
  PrizesDistributed: {
    icon: Trophy,
    label: "Prizes Distributed",
    color: "text-orange-400 bg-orange-600/20",
  },
};

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FeedPage() {
  const isLoading = false;

  return (
    <div className="flex flex-col gap-6 py-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Activity Feed</h1>
        <p className="text-sm text-zinc-400">
          Recent on-chain events from this hackathon.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Events</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {placeholderEntries.length} events
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : placeholderEntries.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Inbox className="h-10 w-10 text-zinc-700" />
              <p className="text-sm text-zinc-500">
                No events yet. Events appear as scores are submitted and
                prizes are distributed.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {placeholderEntries.map((entry) => {
                const config = typeConfig[entry.type];
                const Icon = config.icon;
                return (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 rounded-lg border border-zinc-800/50 px-4 py-3 transition-colors hover:bg-zinc-800/40"
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.color}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">
                          {config.label}
                        </Badge>
                        <span className="text-[10px] text-zinc-600">
                          {formatTimestamp(entry.timestamp)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-zinc-400">
                        {entry.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono text-zinc-600">
                        {truncateAddress(entry.address, 4)}
                      </span>
                      {entry.txHash && (
                        <a
                          href={`https://stellar.expert/testnet/tx/${entry.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-600 hover:text-zinc-300 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
