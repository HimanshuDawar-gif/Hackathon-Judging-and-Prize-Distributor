"use client";
// ── Wallet Integration ───────────────────────────────────────────────
// We implement wallet support directly via Freighter API since
// @creit-tech/stellar-wallets-kit requires JSR which may not work in all
// bundler environments. Freighter is the most common Stellar wallet.
//
// For multi-wallet support, we detect available wallets and provide
// a selection modal.

import {
  isConnected,
  isAllowed,
  requestAccess,
  getAddress,
  signTransaction as freighterSign,
} from "@stellar/freighter-api";
import { Networks } from "@stellar/stellar-sdk";
import { NETWORK_PASSPHRASE } from "./constants";

export type WalletModule = {
  id: string;
  name: string;
  icon: string;
  installed: () => Promise<boolean>;
  connect: () => Promise<string>;
  disconnect: () => Promise<void>;
  getAddress: () => Promise<string>;
  signTransaction: (xdr: string, opts?: { networkPassphrase?: string }) => Promise<{ signedTxXdr: string }>;
};

// ── Freighter wallet implementation ──────────────────────────────────
const freighterWallet: WalletModule = {
  id: "freighter",
  name: "Freighter",
  icon: "🦊",
  installed: async () => {
    try {
      const conn = await isConnected();
      return conn.isConnected;
    } catch {
      return false;
    }
  },
  connect: async () => {
    const allowed = await isAllowed();
    if (!allowed.isAllowed) {
      await requestAccess();
    }
    const { address } = await getAddress();
    return address;
  },
  disconnect: async () => {
    // Freighter doesn't have a disconnect API; we clear local state.
  },
  getAddress: async () => {
    const { address } = await getAddress();
    return address;
  },
  signTransaction: async (xdr, opts) => {
    const result = await freighterSign(xdr, {
      networkPassphrase: opts?.networkPassphrase ?? NETWORK_PASSPHRASE,
    });
    return { signedTxXdr: result.signedTxXdr };
  },
};

// ── Known wallets list ──────────────────────────────────────────────
// Extend this array to add more wallets (xBull, Albedo, etc.)
export const AVAILABLE_WALLETS: WalletModule[] = [freighterWallet];

// ── Wallet persistence ──────────────────────────────────────────────
const WALLET_KEY = "hackathon_judging_wallet";

export function saveWalletChoice(walletId: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(WALLET_KEY, walletId);
  }
}

export function loadWalletChoice(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(WALLET_KEY);
  }
  return null;
}

export function clearWalletChoice() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(WALLET_KEY);
  }
}

export { freighterWallet as defaultWallet };
