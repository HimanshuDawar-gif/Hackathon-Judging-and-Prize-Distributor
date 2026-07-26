"use client";

import { useUIStore } from "@/store/ui";
import { truncateAddress } from "@/lib/constants";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Inbox,
} from "lucide-react";

const statusConfig: Record<
  string,
  { variant: "default" | "destructive" | "secondary"; icon: React.ElementType; label: string }
> = {
  success: {
    variant: "default",
    icon: CheckCircle2,
    label: "Success",
  },
  failed: {
    variant: "destructive",
    icon: XCircle,
    label: "Failed",
  },
  pending: {
    variant: "secondary",
    icon: Clock,
    label: "Pending",
  },
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatMethod(method: string): string {
  return method
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function HistoryPage() {
  const txHistory = useUIStore((s) => s.txHistory);

  return (
    <div className="flex flex-col gap-6 py-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Transaction History
        </h1>
        <p className="text-sm text-zinc-400">
          Your recent on-chain transactions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Transactions</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {txHistory.length} tx{txHistory.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {txHistory.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Inbox className="h-10 w-10 text-zinc-700" />
              <p className="text-sm text-zinc-500">
                No transactions yet. Submit a score or fund the pool to see
                transactions here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {txHistory.map((tx, i) => {
                const config = statusConfig[tx.status] ?? statusConfig.pending;
                const StatusIcon = config.icon;
                return (
                  <div
                    key={`${tx.hash}-${tx.timestamp}-${i}`}
                    className="flex flex-col gap-2 rounded-lg border border-zinc-800/50 px-4 py-3 transition-colors hover:bg-zinc-800/40"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <StatusIcon
                          className={`h-4 w-4 shrink-0 ${
                            tx.status === "success"
                              ? "text-green-400"
                              : tx.status === "failed"
                                ? "text-red-400"
                                : "text-zinc-500"
                          }`}
                        />
                        <div>
                          <p className="text-sm font-medium text-zinc-100">
                            {formatMethod(tx.method)}
                          </p>
                          <p className="text-[10px] text-zinc-600">
                            {formatTime(tx.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={config.variant} className="text-[10px]">
                          {config.label}
                        </Badge>
                        {tx.hash && (
                          <a
                            href={`https://stellar.expert/testnet/tx/${tx.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-600 hover:text-zinc-300 transition-colors"
                            title="View on explorer"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    {tx.hash && (
                      <div className="flex items-center gap-2 pl-7">
                        <span className="text-[10px] font-mono text-zinc-600">
                          {truncateAddress(tx.hash, 8)}
                        </span>
                      </div>
                    )}

                    {tx.status === "failed" && tx.error && (
                      <div className="ml-7 rounded-md border border-red-800/30 bg-red-950/40 px-3 py-2">
                        <p className="text-[11px] text-red-400/80">
                          {tx.error}
                        </p>
                      </div>
                    )}
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
