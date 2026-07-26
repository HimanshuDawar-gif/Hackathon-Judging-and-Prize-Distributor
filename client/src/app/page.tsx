"use client";

import Link from "next/link";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  UserPlus,
  ClipboardCheck,
  Coins,
  Trophy,
  ShieldCheck,
  Scale,
  Eye,
  BarChart3,
} from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    label: "Register",
    description: "Organizer sets up the hackathon and adds judges on-chain.",
  },
  {
    icon: ClipboardCheck,
    label: "Judge",
    description: "Judges score submissions directly through the smart contract.",
  },
  {
    icon: Coins,
    label: "Fund",
    description: "Organizer funds the prize pool with XLM.",
  },
  {
    icon: Trophy,
    label: "Distribute",
    description: "Prizes auto-split to top-ranked teams. Fully on-chain.",
  },
];

const features = [
  {
    icon: Scale,
    title: "Transparent Scoring",
    description:
      "All scores are recorded on-chain. No backdoors, no hidden edits.",
  },
  {
    icon: Coins,
    title: "Auto Prize Distribution",
    description:
      "Basis-point splits auto-calculate payouts per rank. One tx to distribute.",
  },
  {
    icon: ShieldCheck,
    title: "Role-Based Access",
    description:
      "Organizer, judge, and observer roles enforced at the contract level.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Leaderboard",
    description:
      "Live leaderboard updates as judges submit scores every ledger.",
  },
];

export default function HomePage() {
  const { address } = useWallet();

  return (
    <div className="flex flex-col gap-16 py-8">
      {/* Hero */}
      <section className="flex flex-col items-center text-center gap-6">
        <Badge variant="secondary" className="text-xs">
          Built on Stellar
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Mew3 Hackathon Judging
        </h1>
        <p className="max-w-xl text-lg text-zinc-400">
          On-chain judging and auto-split prize distribution for Stellar
          hackathons.
        </p>
        <div className="flex gap-3">
          {address ? (
            <Link href="/app">
              <Button size="lg">
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Link href="/dashboard">
              <Button size="lg">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="flex flex-col gap-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight">How It Works</h2>
          <p className="mt-2 text-zinc-400">
            Four simple steps from setup to payout.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <Card key={step.label} className="relative">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/20">
                    <step.icon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-1 text-[10px]">
                      Step {i + 1}
                    </Badge>
                    <CardTitle className="text-base">{step.label}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-400">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="flex flex-col gap-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight">Why On-Chain?</h2>
          <p className="mt-2 text-zinc-400">
            Fairness and transparency you can verify yourself.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((feat) => (
            <Card key={feat.title}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800">
                    <feat.icon className="h-4 w-4 text-zinc-300" />
                  </div>
                  <CardTitle className="text-base">{feat.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-400">{feat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="flex flex-col items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
        <Eye className="h-8 w-8 text-zinc-500" />
        <h3 className="text-xl font-semibold">Ready to judge?</h3>
        <p className="max-w-md text-sm text-zinc-400">
          Connect your wallet to start scoring, fund the pool, or just watch
          the leaderboard evolve.
        </p>
        <Link href={address ? "/app" : "/dashboard"}>
          <Button>
            {address ? "Open App" : "Connect Wallet"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </section>
    </div>
  );
}
