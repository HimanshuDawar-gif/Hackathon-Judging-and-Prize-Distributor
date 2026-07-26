"use client";

import { useWallet } from "@/hooks/useWallet";
import { useRole } from "@/hooks/useRole";
import { usePoolBalance } from "@/hooks/useContract";
import { useUIStore } from "@/store/ui";
import { truncateAddress, formatAmount } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Wallet,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Users,
  ClipboardCheck,
  Eye,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const roleConfig: Record<
  string,
  { variant: "destructive" | "default" | "secondary"; label: string; icon: React.ElementType }
> = {
  organizer: { variant: "destructive", label: "Organizer", icon: ShieldCheck },
  judge: { variant: "default", label: "Judge", icon: ClipboardCheck },
  observer: { variant: "secondary", label: "Observer", icon: Eye },
};

const quickLinks = [
  { href: "/app", label: "Open App", description: "Score submissions, fund pool, view leaderboard" },
  { href: "/feed", label: "Activity Feed", description: "See recent on-chain events" },
  { href: "/history", label: "Transaction History", description: "Review your past transactions" },
];

export default function DashboardPage() {
  const { address, connecting, connect, disconnect } = useWallet();
  const { data: role } = useRole(address);
  const { data: poolBalance, isLoading: poolLoading } = usePoolBalance();
  const setModalOpen = useUIStore((s) => s.setModalOpen);

  return (
    <div className="flex flex-col gap-6 py-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-zinc-400">
          Wallet overview and quick navigation.
        </p>
      </div>

      {/* Wallet Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Wallet</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!address ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <Wallet className="h-10 w-10 text-zinc-600" />
              <p className="text-sm text-zinc-400">
                Connect your wallet to see your balance and role.
              </p>
              <Button
                onClick={() => setModalOpen(true)}
                disabled={connecting}
              >
                <Wallet className="h-4 w-4" />
                {connecting ? "Connecting…" : "Connect Wallet"}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Address */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Address</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    {truncateAddress(address)}
                  </Badge>
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <a
                    href={`https://stellar.expert/testnet/account/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              {/* Network */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Network</span>
                <Badge variant="secondary" className="text-xs">
                  Testnet
                </Badge>
              </div>

              {/* Balance */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">XLM Balance</span>
                {poolLoading ? (
                  <Skeleton className="h-5 w-20" />
                ) : (
                  <span className="text-sm font-medium tabular-nums">
                    —
                  </span>
                )}
              </div>

              {/* Role */}
              {role && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Role</span>
                  <Badge variant={roleConfig[role].variant}>
                    {(() => {
                      const Icon = roleConfig[role].icon;
                      return <Icon className="mr-1 h-3 w-3" />;
                    })()}
                    {roleConfig[role].label}
                  </Badge>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => disconnect()}
                className="mt-2 w-fit"
              >
                <LogOut className="h-4 w-4" />
                Disconnect
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pool Balance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prize Pool</CardTitle>
        </CardHeader>
        <CardContent>
          {poolLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          ) : (
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {poolBalance != null ? `${formatAmount(poolBalance)} XLM` : "0.00 XLM"}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Total funds available for prize distribution.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-800/40 px-4 py-3 transition-colors hover:border-zinc-700 hover:bg-zinc-800"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-100">
                    {link.label}
                  </p>
                  <p className="text-xs text-zinc-500">{link.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-600 transition-colors group-hover:text-zinc-300" />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
