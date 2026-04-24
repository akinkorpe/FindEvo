import { create } from "zustand";
import type { ScoredPost } from "@/types";

type FeedView = "all" | "high-intent" | "saved";
type SortMode = "latest" | "score";

interface FeedState {
  items: ScoredPost[];
  view: FeedView;
  subredditFilter: string | null;
  sort: SortMode;
  selectedId: string | null;
  isLoading: boolean;
  error: string | null;
  markingSentId: string | null;
  setView: (view: FeedView) => void;
  setSubreddit: (name: string | null) => void;
  setSort: (mode: SortMode) => void;
  select: (id: string | null) => void;
  load: (productId: string) => Promise<void>;
  markSent: (productId: string, scoredPostId: string) => Promise<void>;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  items: [],
  view: "all",
  subredditFilter: null,
  sort: "latest",
  selectedId: null,
  isLoading: false,
  error: null,
  markingSentId: null,
  setView: (view) => set({ view }),
  setSubreddit: (subredditFilter) => set({ subredditFilter }),
  setSort: (sort) => set({ sort }),
  select: (selectedId) => set({ selectedId }),
  load: async (productId) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams({ productId });
      const { view, subredditFilter } = get();
      params.set("view", view);
      if (subredditFilter) params.set("subreddit", subredditFilter);
      const res = await fetch(`/api/feed?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "failed to load feed");
      set({ items: json.items ?? [] });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "error" });
    } finally {
      set({ isLoading: false });
    }
  },
  markSent: async (productId, scoredPostId) => {
    const target = get().items.find((i) => i.id === scoredPostId);
    if (!target) return;
    set({ markingSentId: scoredPostId });
    try {
      const res = await fetch("/api/sent-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          postId: target.post.id,
          scoredPostId: target.id,
          kind: "sent",
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "failed");
      }
      set({
        items: get().items.map((i) =>
          i.id === scoredPostId ? { ...i, sent: true } : i,
        ),
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "error" });
    } finally {
      set({ markingSentId: null });
    }
  },
}));
