"use client";

import { useState } from "react";
import { useUIStore } from "@/store/ui";
import { useWallet } from "@/hooks/useWallet";
import { useRole } from "@/hooks/useRole";
import { truncateAddress } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, X, LogOut, Wallet } from "lucide-react";

const tabs = [
  { id: "home" as const, label: "Home" },
  { id: "dashboard" as const, label: "Dashboard" },
  { id: "app" as const, label: "App" },
  { id: "feed" as const, label: "Activity Feed" },
  { id: "history" as const, label: "History" },
];

const roleVariant: Record<string, "default" | "secondary" | "destructive"> = {
  organizer: "destructive",
  judge: "default",
  observer: "secondary",
};

const roleLabel: Record<string, string> = {
  organizer: "Organizer",
  judge: "Judge",
  observer: "Observer",
};

export function Navbar() {
  const { activeTab, setActiveTab, setModalOpen } = useUIStore();
  const { address, connecting, connect, disconnect } = useWallet();
  const { data: role } = useRole(address);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleTabClick = (tab: typeof tabs[number]["id"]) => {
    setActiveTab(tab);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <span className="text-sm font-bold tracking-tight text-zinc-100 sm:text-base">
            Mew3 Hackathon Judging
          </span>

          <nav className="hidden items-center gap-1 md:flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {role && (
            <Badge variant={roleVariant[role]} className="hidden sm:inline-flex">
              {roleLabel[role]}
            </Badge>
          )}

          {address ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Badge variant="outline" className="font-mono">
                {truncateAddress(address)}
              </Badge>
              <div className="h-2 w-2 rounded-full bg-green-500" title="Connected" />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => disconnect()}
                title="Disconnect"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="default"
              size="sm"
              disabled={connecting}
              onClick={() => setModalOpen(true)}
              className="hidden sm:inline-flex"
            >
              <Wallet className="h-4 w-4" />
              {connecting ? "Connecting…" : "Connect Wallet"}
            </Button>
          )}

          <button
            className="inline-flex items-center justify-center rounded-md p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-zinc-800 bg-zinc-950 px-4 pb-4 pt-2 md:hidden">
          <nav className="flex flex-col gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`rounded-md px-3 py-2 text-left text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="mt-3 flex flex-col gap-2 border-t border-zinc-800 pt-3">
            {role && (
              <Badge variant={roleVariant[role]} className="w-fit">
                {roleLabel[role]}
              </Badge>
            )}

            {address ? (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {truncateAddress(address)}
                </Badge>
                <div className="h-2 w-2 rounded-full bg-green-500" title="Connected" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => disconnect()}
                  title="Disconnect"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="default"
                size="sm"
                disabled={connecting}
                onClick={() => {
                  setModalOpen(true);
                  setMobileOpen(false);
                }}
              >
                <Wallet className="h-4 w-4" />
                {connecting ? "Connecting…" : "Connect Wallet"}
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
