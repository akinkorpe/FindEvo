import { create } from "zustand";
import type { Product } from "@/types";

interface ProductState {
  product: Product | null;
  isLoading: boolean;
  error: string | null;
  setProduct: (product: Product | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (err: string | null) => void;
  load: () => Promise<void>;
}

export const useProductStore = create<ProductState>((set) => ({
  product: null,
  isLoading: false,
  error: null,
  setProduct: (product) => set({ product }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  load: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/products?first=1");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "failed to load product");
      set({ product: json.product ?? null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "error" });
    } finally {
      set({ isLoading: false });
    }
  },
}));
