"use client";
// ── useWallet hook ───────────────────────────────────────────────────
// Manages wallet connection, signing, and network detection.

import { useCallback, useEffect, useState } from "react";
import { useUIStore } from "@/store/ui";
import {
  AVAILABLE_WALLETS,
  saveWalletChoice,
  loadWalletChoice,
  clearWalletChoice,
  type WalletModule,
} from "@/lib/wallet";

export function useWallet() {
  const [wallet, setWallet] = useState<WalletModule | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setRole, txHistory, addTx, updateTx } = useUIStore();

  // Restore last-connected wallet on mount
  useEffect(() => {
    const saved = loadWalletChoice();
    if (saved) {
      const mod = AVAILABLE_WALLETS.find((w) => w.id === saved);
      if (mod) {
        mod.installed().then((ok) => {
          if (ok) {
            mod.getAddress().then((addr) => {
              setWallet(mod);
              setAddress(addr);
            }).catch(() => {
              clearWalletChoice();
            });
          }
        });
      }
    }
  }, []);

  const connect = useCallback(async (walletModule?: WalletModule) => {
    setConnecting(true);
    setError(null);
    try {
      const mod = walletModule ?? AVAILABLE_WALLETS[0];
      const installed = await mod.installed();
      if (!installed) {
        setError(`${mod.name} is not installed. Please install the browser extension.`);
        setConnecting(false);
        return;
      }
      const addr = await mod.connect();
      setWallet(mod);
      setAddress(addr);
      saveWalletChoice(mod.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("reject") || msg.includes("denied") || msg.includes("cancel")) {
        setError("Connection rejected. Please approve the connection in your wallet.");
      } else {
        setError(`Failed to connect: ${msg}`);
      }
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (wallet) {
      await wallet.disconnect();
    }
    setWallet(null);
    setAddress(null);
    clearWalletChoice();
    setRole("observer");
  }, [wallet, setRole]);

  const signTransaction = useCallback(
    async (xdr: string, opts?: { networkPassphrase?: string }) => {
      if (!wallet) throw new Error("No wallet connected");
      return wallet.signTransaction(xdr, opts);
    },
    [wallet],
  );

  return {
    wallet,
    address,
    connecting,
    error,
    connect,
    disconnect,
    signTransaction,
    availableWallets: AVAILABLE_WALLETS,
  };
}
