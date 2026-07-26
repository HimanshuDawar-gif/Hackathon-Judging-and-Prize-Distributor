"use client";

import React from "react";
import { useWallet } from "@/hooks/useWallet";
import { useUIStore } from "@/store/ui";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { type WalletModule } from "@/lib/wallet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExternalLink, Loader2, AlertCircle } from "lucide-react";

export function WalletModal() {
  const { modalOpen, setModalOpen } = useUIStore();
  const { availableWallets, connect, connecting, error } = useWallet();
  const { addToast } = useToast();

  const handleConnect = async (wallet: typeof availableWallets[number]) => {
    const installed = await wallet.installed();
    if (!installed) {
      addToast(`${wallet.name} is not installed. Please install the browser extension.`, "error");
      return;
    }
    await connect(wallet);
    addToast(`Connected to ${wallet.name}`, "success");
    setModalOpen(false);
  };

  return (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2 pt-2">
          {availableWallets.map((wallet) => (
            <WalletItem
              key={wallet.id}
              wallet={wallet}
              onConnect={handleConnect}
              connecting={connecting}
            />
          ))}
        </div>

        {error && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-800/40 bg-red-950/50 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <p className="pt-2 text-center text-xs text-zinc-500">
          By connecting, you agree to the app&apos;s terms of service.
        </p>
      </DialogContent>
    </Dialog>
  );
}

function WalletItem({
  wallet,
  onConnect,
  connecting,
}: {
  wallet: WalletModule;
  onConnect: (wallet: WalletModule) => void;
  connecting: boolean;
}) {
  const installed = useWalletInstalled(wallet);

  return (
    <button
      onClick={() => onConnect(wallet)}
      disabled={connecting}
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors cursor-pointer ${
        installed
          ? "border-zinc-700 bg-zinc-800/60 hover:border-zinc-600 hover:bg-zinc-800"
          : "border-zinc-800 bg-zinc-900 opacity-70"
      } disabled:pointer-events-none disabled:opacity-50`}
    >
      <span className="text-2xl">{wallet.icon}</span>
      <div className="flex-1">
        <p className="text-sm font-medium text-zinc-100">{wallet.name}</p>
        <p className="text-xs text-zinc-500">
          {installed ? "Installed" : "Not installed"}
        </p>
      </div>
      {connecting ? (
        <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
      ) : installed ? (
        <span className="rounded-md bg-blue-600/20 px-2 py-0.5 text-xs font-medium text-blue-400">
          Connect
        </span>
      ) : (
        <a
          href={`https://${wallet.name.toLowerCase()}.xyz`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 rounded-md bg-zinc-700/50 px-2 py-0.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100"
        >
          Install
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </button>
  );
}

function useWalletInstalled(wallet: WalletModule): boolean {
  const [installed, setInstalled] = React.useState(false);
  React.useEffect(() => {
    wallet.installed().then(setInstalled);
  }, [wallet]);
  return installed;
}
