import { create } from "zustand";
import type { Lead, LeadInteraction, LeadStatus } from "@/types";

interface LeadsState {
  leads: Lead[];
  isLoading: boolean;
  error: string | null;
  selectedId: string | null;
  detail: { lead: Lead; interactions: LeadInteraction[] } | null;
  select: (id: string | null) => void;
  load: (productId: string) => Promise<void>;
  loadDetail: (id: string) => Promise<void>;
  updateStatus: (id: string, status: LeadStatus) => Promise<void>;
  deleteLeads: (ids: string[]) => Promise<void>;
}

export const useLeadsStore = create<LeadsState>((set, get) => ({
  leads: [],
  isLoading: false,
  error: null,
  selectedId: null,
  detail: null,
  select: (selectedId) => set({ selectedId }),
  load: async (productId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/leads?productId=${productId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "failed to load leads");
      set({ leads: json.leads ?? [] });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "error" });
    } finally {
      set({ isLoading: false });
    }
  },
  loadDetail: async (id) => {
    const res = await fetch(`/api/leads/${id}`);
    const json = await res.json();
    if (res.ok) {
      set({ detail: { lead: json.lead, interactions: json.interactions ?? [] } });
    }
  },
  updateStatus: async (id, status) => {
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    set({
      leads: get().leads.map((l) => (l.id === id ? { ...l, status } : l)),
    });
    if (get().detail?.lead.id === id) {
      await get().loadDetail(id);
    }
  },
  deleteLeads: async (ids) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    // Optimistic: drop them from local state immediately. If a delete fails
    // server-side the next `load(productId)` will reconcile by bringing the
    // row back. Keeping the UI snappy matters more than perfect consistency
    // for a destructive action the user just confirmed.
    set({
      leads: get().leads.filter((l) => !idSet.has(l.id)),
      selectedId:
        get().selectedId && idSet.has(get().selectedId!) ? null : get().selectedId,
      detail:
        get().detail && idSet.has(get().detail!.lead.id) ? null : get().detail,
    });
    await Promise.all(
      ids.map((id) =>
        fetch(`/api/leads/${id}`, { method: "DELETE" }).catch(() => undefined),
      ),
    );
  },
}));
