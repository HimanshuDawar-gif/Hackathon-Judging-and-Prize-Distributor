import { create } from "zustand";
import type { TxRecord, UserRole } from "@/types/contract";

interface UIState {
  activeTab: "home" | "dashboard" | "app" | "feed" | "history";
  setActiveTab: (tab: UIState["activeTab"]) => void;

  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;

  role: UserRole;
  setRole: (r: UserRole) => void;

  txHistory: TxRecord[];
  addTx: (tx: TxRecord) => void;
  updateTx: (hash: string, patch: Partial<TxRecord>) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: "home",
  setActiveTab: (activeTab) => set({ activeTab }),

  modalOpen: false,
  setModalOpen: (modalOpen) => set({ modalOpen }),

  role: "observer",
  setRole: (role) => set({ role }),

  txHistory: [],
  addTx: (tx) => set((s) => ({ txHistory: [tx, ...s.txHistory] })),
  updateTx: (hash, patch) =>
    set((s) => ({
      txHistory: s.txHistory.map((t) => (t.hash === hash ? { ...t, ...patch } : t)),
    })),
}));
