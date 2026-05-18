"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Avatar } from "@/components/ui/Avatar";
import {
  IconArrowRight,
  IconCheck,
  IconClose,
  IconFilter,
  IconSparkles,
  IconFlame,
  IconShield,
  IconAlert,
  IconEye,
  IconLink,
  IconPlus,
} from "@/components/ui/Icons";
import { useFeedStore } from "@/store/useFeedStore";
import { formatPlanLimit } from "@/lib/planLimitMessage";
import type {
  ApproachGuide,
  RiskLevel,
  ScoredPost,
  SubredditTarget,
} from "@/types";

interface Product {
  id: string;
  name: string | null;
}

const AUTO_FETCH_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour per subreddit

export default function PowerFeedClient() {
  const searchParams = useSearchParams();
  const focusId = searchParams.get("focus");
  const [product, setProduct] = useState<Product | null>(null);
  const [noProduct, setNoProduct] = useState(false);
  const [targets, setTargets] = useState<SubredditTarget[]>([]);
  const [targetsLoaded, setTargetsLoaded] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [scanningSub, setScanningSub] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const {
    items,
    view,
    subredditFilter,
    sort,
    selectedId,
    isLoading,
    setView,
    setSubreddit,
    setSort,
    select,
    load,
  } = useFeedStore();

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/products?first=1").then((r) => r.json());
      if (!res.product) {
        setNoProduct(true);
        return;
      }
      setProduct(res.product);
    })();
  }, []);

  useEffect(() => {
    if (!product) return;
    load(product.id);
    fetch(`/api/subreddits?productId=${product.id}`)
      .then((r) => r.json())
      .then((j) => {
        setTargets(j.targets ?? []);
        setTargetsLoaded(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  const scanningRef = useRef(false);
  const scanQueueRef = useRef<Array<{ name: string; bypassCooldown: boolean }>>([]);

  async function fetchSubreddits(
    subs: SubredditTarget[],
    productId: string,
    options: { bypassCooldown?: boolean } = {},
  ) {
    const cooldownKey = (sub: string) =>
      `redditleads:lastFetch:${productId}:${sub.toLowerCase()}`;
    for (const t of subs) {
      const already = scanQueueRef.current.some(
        (q) => q.name.toLowerCase() === t.name.toLowerCase(),
      );
      if (!already) {
        scanQueueRef.current.push({
          name: t.name,
          bypassCooldown: !!options.bypassCooldown,
        });
      }
    }
    if (scanningRef.current) return;
    scanningRef.current = true;

    // Each /api/fetch-posts call kicks off an Apify actor (~60s/sub). Running
    // them serially would blow past Vercel's maxDuration and frustrate users
    // staring at a half-loaded feed. Run a small concurrent pool so they
    // execute in parallel lambda invocations.
    const CONCURRENCY = 4;
    let rateLimited = false;

    async function scanOne(item: { name: string; bypassCooldown: boolean }) {
      const last = Number(localStorage.getItem(cooldownKey(item.name)) ?? 0);
      const dueByCooldown = Date.now() - last > AUTO_FETCH_COOLDOWN_MS;
      if (!item.bypassCooldown && !dueByCooldown) return;
      setScanningSub(item.name);
      try {
        const res = await fetch("/api/fetch-posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId,
            subreddit: item.name,
            score: true,
            limit: 50,
          }),
        });
        if (res.status === 429) {
          const j = await res.json().catch(() => ({}));
          setScanError(formatPlanLimit(j));
          rateLimited = true;
          return;
        }
        if (res.ok) {
          localStorage.setItem(cooldownKey(item.name), String(Date.now()));
          setScanError(null);
          await load(productId);
        } else {
          const j = await res.json().catch(() => ({}));
          setScanError(j.error ?? `Failed to scan r/${item.name}`);
        }
      } catch {
        setScanError(`Network error while scanning r/${item.name}`);
      }
    }

    try {
      while (scanQueueRef.current.length > 0 && !rateLimited) {
        const batch = scanQueueRef.current.splice(0, CONCURRENCY);
        await Promise.all(batch.map(scanOne));
      }
      if (rateLimited) scanQueueRef.current = [];
    } finally {
      setScanningSub(null);
      scanningRef.current = false;
    }
  }

  const initialFetchDone = useRef(false);
  useEffect(() => {
    if (!product || targets.length === 0) return;
    if (initialFetchDone.current) return;
    initialFetchDone.current = true;
    fetchSubreddits(targets, product.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, targets]);

  const sorted = useMemo(() => {
    const arr = [...items];
    if (sort === "score") arr.sort((a, b) => b.intentScore - a.intentScore);
    else
      arr.sort(
        (a, b) =>
          new Date(b.post.createdAt).getTime() -
          new Date(a.post.createdAt).getTime(),
      );
    return arr;
  }, [items, sort]);

  const trackedSubs = useMemo(
    () => new Set(targets.map((t) => t.name.toLowerCase())),
    [targets],
  );

  const visibleItems = useMemo(
    () => sorted.filter((item) =>
      // Skip the tracked-subs check until targets are loaded — otherwise the
      // feed flashes empty on initial render before /api/subreddits resolves.
      (!targetsLoaded || trackedSubs.has(item.post.subreddit.toLowerCase())) &&
      isInTimeRange(item.post.createdAt, timeRange) &&
      (subredditFilter === null || item.post.subreddit.toLowerCase() === subredditFilter.toLowerCase()) &&
      item.intentScore >= 30 &&
      (view === "all" || (view === "high-intent" && item.intentScore >= 60))
    ),
    [sorted, timeRange, subredditFilter, view, trackedSubs, targetsLoaded],
  );

  const selected = visibleItems.find((p) => p.id === selectedId) ?? null;

  useEffect(() => {
    if (!focusId) return;
    // Ensure focused post is not hidden by previous UI filters.
    setView("all");
    setSubreddit(null);
    setTimeRange("all");
  }, [focusId, setView, setSubreddit, setTimeRange]);

  useEffect(() => {
    if (!focusId) return;
    const target = sorted.find((p) => p.id === focusId);
    if (target && selectedId !== target.id) {
      select(target.id);
    }
  }, [focusId, sorted, selectedId, select]);

  if (noProduct) return <EmptyState />;

  function reloadTargets(newSubreddit?: string) {
    if (!product) return;
    fetch(`/api/subreddits?productId=${product.id}`)
      .then((r) => r.json())
      .then((j) => {
        const updated: SubredditTarget[] = j.targets ?? [];
        setTargets(updated);
        setTargetsLoaded(true);
        if (newSubreddit) {
          const newTarget = updated.filter(
            (t) => t.name.toLowerCase() === newSubreddit.toLowerCase(),
          );
          if (newTarget.length > 0) {
            // Bypass the per-sub cooldown — the user just added it and expects
            // a fresh scan, even if (somehow) a stale cooldown timestamp exists.
            fetchSubreddits(newTarget, product.id, { bypassCooldown: true });
          }
        }
      });
  }

  const filtersDrawerProps = {
    items: visibleItems,
    targets,
    view,
    setView,
    subreddit: subredditFilter,
    setSubreddit,
    productId: product?.id,
    onTargetsChange: reloadTargets,
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:h-screen">
      <Header title="Power Feed" searchPlaceholder="Search posts, keywords..." />
      <main className="flex min-h-0 flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden lg:block">
          <FiltersPanel {...filtersDrawerProps} />
        </div>
        {/* Mobile drawer */}
        <FiltersDrawer
          open={isFiltersOpen}
          onClose={() => setIsFiltersOpen(false)}
          {...filtersDrawerProps}
        />

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex rounded-lg bg-ink-100 p-0.5 text-xs">
                <button
                  onClick={() => setSort("latest")}
                  className={`rounded-md px-3 py-1 font-medium transition ${
                    sort === "latest"
                      ? "bg-white text-ink-900 shadow-sm"
                      : "text-ink-500"
                  }`}
                >
                  Latest
                </button>
                <button
                  onClick={() => setSort("score")}
                  className={`rounded-md px-3 py-1 font-medium transition ${
                    sort === "score"
                      ? "bg-white text-ink-900 shadow-sm"
                      : "text-ink-500"
                  }`}
                >
                  Top Score
                </button>
              </div>
              {scanningSub ? (
                <div className="flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-700">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />
                  <span className="hidden sm:inline">Scanning </span>r/{scanningSub}…
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (!product || targets.length === 0) return;
                    targets.forEach((t) =>
                      localStorage.removeItem(`redditleads:lastFetch:${product.id}:${t.name.toLowerCase()}`)
                    );
                    fetchSubreddits(targets, product.id);
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-50"
                >
                  ↻ <span className="hidden sm:inline">Refresh</span>
                </button>
              )}
            </div>
            <button
              onClick={() => setIsFiltersOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-50"
            >
              <IconFilter className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Filters: </span>
              {timeRangeLabel(timeRange)}
            </button>
          </div>
          {isFiltersOpen && (
            <div className="border-b border-ink-100 bg-white px-6 py-3">
              <div className="flex flex-wrap items-center gap-2">
                {TIME_RANGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setTimeRange(opt.value);
                      setIsFiltersOpen(false);
                    }}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                      timeRange === opt.value
                        ? "bg-brand-50 text-brand-700"
                        : "bg-ink-100 text-ink-600 hover:bg-ink-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {scanError && (
            <div className="flex items-start justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800 sm:px-6">
              <div className="flex items-start gap-2">
                <IconAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{scanError}</span>
              </div>
              <button
                onClick={() => setScanError(null)}
                className="shrink-0 rounded text-amber-700 hover:text-amber-900"
                aria-label="Dismiss"
              >
                <IconClose className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {(isLoading || scanningSub) && items.length === 0 ? (
              <FeedLoading />
            ) : visibleItems.length === 0 ? (
              <FeedEmpty productId={product?.id} />
            ) : (
              <div className="space-y-3">
                {visibleItems.map((item) => (
                  <FeedCard
                    key={item.id}
                    item={item}
                    isSelected={item.id === selectedId}
                    onSelect={() => select(item.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <StrategyPanel
          selected={selected}
          productId={product?.id}
          onClose={() => select(null)}
        />
      </main>
    </div>
  );
}

type TimeRange = "all" | "24h" | "3d" | "7d" | "30d";

const TIME_RANGE_OPTIONS: Array<{ value: TimeRange; label: string }> = [
  { value: "all", label: "All Time" },
  { value: "24h", label: "Last 24h" },
  { value: "3d", label: "Last 3 days" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

function timeRangeLabel(range: TimeRange): string {
  return TIME_RANGE_OPTIONS.find((x) => x.value === range)?.label ?? "All Time";
}

function isInTimeRange(iso: string, range: TimeRange): boolean {
  if (range === "all") return true;
  const created = new Date(iso).getTime();
  if (Number.isNaN(created)) return false;
  const now = Date.now();
  const maxAgeMs =
    range === "24h"
      ? 24 * 60 * 60 * 1000
      : range === "3d"
        ? 3 * 24 * 60 * 60 * 1000
        : range === "7d"
          ? 7 * 24 * 60 * 60 * 1000
          : 30 * 24 * 60 * 60 * 1000;
  return now - created <= maxAgeMs;
}

type FiltersProps = {
  items: ScoredPost[];
  targets: SubredditTarget[];
  view: "all" | "high-intent" | "saved";
  setView: (v: "all" | "high-intent" | "saved") => void;
  subreddit: string | null;
  setSubreddit: (name: string | null) => void;
  productId: string | undefined;
  onTargetsChange: (newSubreddit?: string) => void;
};

interface SubSuggestion {
  name: string;
  subscribers: number | null;
  description: string | null;
}

function FiltersBody({
  items,
  targets,
  view,
  setView,
  subreddit,
  setSubreddit,
  productId,
  onTargetsChange,
}: FiltersProps) {
  const [addInput, setAddInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addedHint, setAddedHint] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SubSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlight, setHighlight] = useState(0);

  useEffect(() => {
    if (!addedHint) return;
    const id = window.setTimeout(() => setAddedHint(null), 6000);
    return () => window.clearTimeout(id);
  }, [addedHint]);

  // Debounced autocomplete: fire 200ms after the user stops typing, ignore
  // stale responses if the input changed before the request returned.
  useEffect(() => {
    const raw = addInput.trim().replace(/^\/?r\//i, "");
    if (raw.length < 2) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const handle = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/subreddits/search?q=${encodeURIComponent(raw)}&limit=8`,
        );
        if (!res.ok) return;
        const json = (await res.json()) as { suggestions?: SubSuggestion[] };
        if (cancelled) return;
        const tracked = new Set(targets.map((t) => t.name.toLowerCase()));
        const filtered = (json.suggestions ?? []).filter(
          (s) => !tracked.has(s.name.toLowerCase()),
        );
        setSuggestions(filtered);
        setHighlight(0);
      } catch {
        // Network errors fail silently — the user can still type the name manually.
      }
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [addInput, targets]);

  const counts = {
    all: items.length,
    highIntent: items.filter((i) => i.intentScore >= 60).length,
  };

  const viewItems = [
    { key: "all" as const, label: "All Leads", count: counts.all, icon: <IconFlame className="h-3.5 w-3.5" /> },
    { key: "high-intent" as const, label: "High Intent", count: counts.highIntent, icon: <IconSparkles className="h-3.5 w-3.5" /> },
  ];

  function normalizeSubredditName(raw: string): string | null {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    // Accept: "name", "r/name", "/r/name", or full reddit URLs.
    const urlMatch = trimmed.match(/reddit\.com\/r\/([a-z0-9_]+)/i);
    const candidate = urlMatch ? urlMatch[1] : trimmed.replace(/^\/?r\//i, "");
    const clean = candidate.replace(/\/+$/, "").trim();
    if (!/^[a-z0-9_]{2,21}$/i.test(clean)) return null;
    return clean;
  }

  async function handleAdd(override?: string) {
    if (!productId || adding) return;
    const source = override ?? addInput;
    const clean = normalizeSubredditName(source);
    if (!clean) {
      setAddError("Enter a valid subreddit name (e.g. r/SaaS)");
      return;
    }
    if (targets.some((t) => t.name.toLowerCase() === clean.toLowerCase())) {
      setAddError(`r/${clean} is already tracked`);
      return;
    }
    setAdding(true);
    setAddError(null);
    setAddedHint(null);
    setShowSuggestions(false);
    try {
      const res = await fetch("/api/subreddits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, name: clean }),
      });
      const json = await res.json();
      if (res.status === 429) {
        // Capacity limit — plan caps tracked subreddits. formatPlanLimit
        // produces a "you're on Starter, upgrade to Growth for 10" message.
        throw new Error(formatPlanLimit(json));
      }
      if (!res.ok) throw new Error(json.error ?? "Failed to add subreddit");
      setAddInput("");
      setSuggestions([]);
      setAddedHint(clean);
      onTargetsChange(clean);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "error");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(id: string, name: string) {
    setRemovingId(id);
    if (subreddit === name) setSubreddit(null);
    try {
      await fetch(`/api/subreddits?id=${id}`, { method: "DELETE" });
      onTargetsChange();
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="space-y-5 overflow-y-auto p-5">
      <div>
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
          Views
        </h3>
        <div className="space-y-1">
          {viewItems.map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm transition ${
                view === v.key
                  ? "bg-brand-50 text-brand-700"
                  : "text-ink-700 hover:bg-ink-50"
              }`}
            >
              <span className="flex items-center gap-2">
                <span className={view === v.key ? "text-brand-600" : "text-ink-400"}>
                  {v.icon}
                </span>
                <span className="font-medium">{v.label}</span>
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  view === v.key
                    ? "bg-white text-brand-700"
                    : "bg-ink-100 text-ink-500"
                }`}
              >
                {v.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
          Subreddits
        </h3>
        <div className="space-y-1">
          <button
            onClick={() => setSubreddit(null)}
            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-sm transition ${
              subreddit === null
                ? "bg-ink-100 text-ink-900"
                : "text-ink-600 hover:bg-ink-50"
            }`}
          >
            <span className="font-medium">All subreddits</span>
          </button>
          {targets.map((t) => (
            <div
              key={t.id}
              className={`group flex w-full items-center rounded-lg px-2.5 py-1.5 text-sm transition ${
                subreddit === t.name ? "bg-ink-100 text-ink-900" : "text-ink-600 hover:bg-ink-50"
              }`}
            >
              <button
                className="min-w-0 flex-1 truncate text-left"
                onClick={() => setSubreddit(t.name)}
              >
                r/{t.name}
              </button>
              <button
                onClick={() => handleRemove(t.id, t.name)}
                disabled={removingId === t.id}
                className="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded opacity-0 text-ink-400 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                title="Remove subreddit"
              >
                <IconClose className="h-3 w-3" />
              </button>
            </div>
          ))}
          {targets.length === 0 && (
            <p className="px-2.5 py-2 text-xs text-ink-400">
              No subreddits tracked yet.
            </p>
          )}
        </div>

        {/* Add subreddit */}
        <div className="relative mt-3">
          <div className="flex gap-1.5">
            <input
              type="text"
              value={addInput}
              onChange={(e) => {
                setAddInput(e.target.value);
                setAddError(null);
                setAddedHint(null);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => {
                // Delay so mousedown on a suggestion still fires before close.
                window.setTimeout(() => setShowSuggestions(false), 150);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (showSuggestions && suggestions.length > 0) {
                    e.preventDefault();
                    handleAdd(suggestions[highlight]?.name ?? addInput);
                  } else {
                    handleAdd();
                  }
                } else if (e.key === "ArrowDown" && suggestions.length > 0) {
                  e.preventDefault();
                  setShowSuggestions(true);
                  setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
                } else if (e.key === "ArrowUp" && suggestions.length > 0) {
                  e.preventDefault();
                  setHighlight((h) => Math.max(h - 1, 0));
                } else if (e.key === "Escape") {
                  setShowSuggestions(false);
                }
              }}
              placeholder="r/subredditname"
              disabled={adding}
              aria-label="Add subreddit"
              aria-invalid={!!addError}
              aria-autocomplete="list"
              aria-expanded={showSuggestions && suggestions.length > 0}
              className="min-w-0 flex-1 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-xs text-ink-900 placeholder-ink-400 focus:border-brand-400 focus:outline-none disabled:opacity-60"
            />
            <button
              onClick={() => handleAdd()}
              disabled={adding || !addInput.trim()}
              aria-label="Add subreddit"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 transition"
            >
              {adding ? (
                <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
              ) : (
                <IconPlus className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <ul
              role="listbox"
              className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-lg border border-ink-200 bg-white shadow-pop"
            >
              {suggestions.map((s, idx) => (
                <li key={s.name} role="option" aria-selected={idx === highlight}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      // Prevent input blur from firing before our click handler.
                      e.preventDefault();
                      handleAdd(s.name);
                    }}
                    onMouseEnter={() => setHighlight(idx)}
                    className={`flex w-full items-start gap-2 px-2.5 py-1.5 text-left text-xs transition ${
                      idx === highlight ? "bg-brand-50" : "hover:bg-ink-50"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-ink-900">
                          r/{s.name}
                        </span>
                        {s.subscribers !== null && (
                          <span className="text-[10px] text-ink-400">
                            {formatSubs(s.subscribers)}
                          </span>
                        )}
                      </div>
                      {s.description && (
                        <div className="truncate text-[11px] text-ink-500">
                          {s.description}
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {addError && (
            <p className="mt-1.5 text-[11px] text-red-600">{addError}</p>
          )}
          {addedHint && !addError && (
            <p className="mt-1.5 text-[11px] text-brand-700">
              Added r/{addedHint} — scanning posts now…
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function FiltersPanel(props: FiltersProps) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-ink-100 bg-white">
      <FiltersBody {...props} />
    </aside>
  );
}

function FiltersDrawer({
  open,
  onClose,
  ...props
}: FiltersProps & { open: boolean; onClose: () => void }) {
  return (
    <div
      className={`fixed inset-0 z-40 lg:hidden ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-ink-900/40 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        className={`absolute left-0 top-0 h-full w-72 max-w-[85vw] overflow-hidden border-r border-ink-100 bg-white shadow-pop transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3">
          <span className="text-sm font-semibold text-ink-900">Filters</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>
        <div className="h-[calc(100%-49px)] overflow-y-auto">
          <FiltersBody {...props} />
        </div>
      </aside>
    </div>
  );
}

function FeedCard({
  item,
  isSelected,
  onSelect,
}: {
  item: ScoredPost;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const intentBadge = intentBadgeInfo(item.intentScore, item.riskLevel);
  const rule = ruleBadgeInfo(item.ruleBadge ?? null);
  const age = timeAgo(item.post.createdAt);
  const body = item.post.body?.trim() || "";

  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`w-full cursor-pointer rounded-2xl border bg-white p-5 text-left transition ${
        isSelected
          ? "border-brand-400 ring-2 ring-brand-100"
          : "border-ink-100 hover:border-ink-200 hover:shadow-card"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-500">
          <span className="whitespace-nowrap font-semibold text-ink-700">
            r/{item.post.subreddit}
          </span>
          {rule && (
            <Badge tone={rule.tone} title={item.rulesSummary ?? undefined}>
              <span className="whitespace-nowrap">{rule.label}</span>
            </Badge>
          )}
          <span className="whitespace-nowrap">{age}</span>
          <span className="truncate">u/{item.post.author}</span>
        </div>
        <Badge tone={intentBadge.tone} icon={intentBadge.icon}>
          <span className="whitespace-nowrap">{intentBadge.label}</span>
        </Badge>
      </div>

      <h3 className="mt-2 line-clamp-2 text-base font-semibold text-ink-900">
        {item.post.title}
      </h3>
      {body && (
        <p className="mt-1.5 line-clamp-2 text-sm text-ink-500">{body}</p>
      )}

      <div className="mt-4 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between text-[11px] font-medium text-ink-500">
            <span>Intent Score</span>
            <span className="font-semibold text-ink-800">
              {item.intentScore}/100
            </span>
          </div>
          <ProgressBar
            value={item.intentScore}
            size="md"
            tone={
              item.intentScore >= 70
                ? "brand"
                : item.intentScore >= 40
                  ? "warning"
                  : "neutral"
            }
            className="mt-1.5"
          />
        </div>
        <a
          href={item.post.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-medium text-ink-700 transition hover:bg-ink-50"
          title="Open original post on Reddit"
        >
          <IconLink className="h-3 w-3" />
          Reddit
        </a>
        <span className="flex items-center gap-1 text-xs font-medium text-brand-600">
          View
          <IconArrowRight className="h-3 w-3" />
        </span>
      </div>
    </div>
  );
}

function StrategyPanel({
  selected,
  productId,
  onClose,
}: {
  selected: ScoredPost | null;
  productId: string | undefined;
  onClose: () => void;
}) {
  const [guide, setGuide] = useState<ApproachGuide | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingToCrm, setAddingToCrm] = useState(false);
  const [addedLeadId, setAddedLeadId] = useState<string | null>(null);

  useEffect(() => {
    setGuide(null);
    setError(null);
    setAddedLeadId(null);
    if (!selected) return;
    setLoading(true);
    fetch("/api/approach-guide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scoredPostId: selected.id }),
    })
      .then(async (r) => {
        const json = await r.json();
        if (r.status === 429) {
          throw new Error(formatPlanLimit(json));
        }
        if (!r.ok) throw new Error(json.error ?? "failed");
        setGuide(json.guide);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "error"))
      .finally(() => setLoading(false));
  }, [selected]);

  async function addToCrm() {
    if (!selected || !productId) return;
    setAddingToCrm(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, scoredPostId: selected.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "failed");
      setAddedLeadId(json.lead.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "error");
    } finally {
      setAddingToCrm(false);
    }
  }

  if (!selected) {
    return (
      <aside className="hidden h-full min-h-0 w-[420px] shrink-0 flex-col overflow-hidden border-l border-ink-100 bg-white xl:flex">
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-500">
            <IconSparkles className="h-6 w-6" />
          </span>
          <h3 className="text-sm font-semibold text-ink-800">
            Select a post to see strategy
          </h3>
          <p className="mt-1.5 max-w-[280px] text-xs text-ink-500">
            Our AI will analyze the lead and give you a contextual approach —
            never copy-paste reply text.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside
      // Mobile: fullscreen overlay anchored to the dynamic viewport so the
      // sticky bottom action bar stays in view as iOS's URL bar shows/hides.
      // `100dvh` is the height that already accounts for retracting browser
      // chrome — `inset-0` against `100vh` would put the action bar below
      // the visible area on iOS, which was the bug the user reported.
      // Desktop: ignore all of that and become a 420px right rail.
      style={{ height: "100dvh" }}
      className="fixed inset-x-0 top-0 z-40 flex min-h-0 flex-col overflow-hidden overscroll-contain border-l border-ink-100 bg-white xl:static xl:z-auto xl:!h-full xl:w-[420px] xl:shrink-0"
    >
      <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <Badge tone="brand" icon={<IconSparkles className="h-3 w-3" />}>
            AI Analysis
          </Badge>
          <span className="flex items-center gap-1 text-[11px] text-ink-400">
            <IconEye className="h-3 w-3" /> live
          </span>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700"
        >
          <IconClose className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 pb-10">
        <div>
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
            Source
          </div>
          <Link
            href={selected.post.url}
            target="_blank"
            className="group block rounded-xl border border-ink-100 p-3 hover:border-ink-200"
          >
            <div className="text-xs text-ink-500">
              r/{selected.post.subreddit} • u/{selected.post.author}
            </div>
            <div className="mt-1 line-clamp-2 text-sm font-semibold text-ink-900 group-hover:text-brand-700">
              {selected.post.title}
            </div>
          </Link>
        </div>

        <Card className="p-4">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
            <IconFlame className="h-3.5 w-3.5 text-brand-500" />
            Why this is a lead
          </div>
          {loading && <SkeletonLines rows={3} />}
          {!loading && guide && (
            <p className="text-sm leading-relaxed text-ink-700">
              {guide.whyLead}
            </p>
          )}
          {!loading && !guide && !error && (
            <p className="text-sm text-ink-500">{selected.reason}</p>
          )}
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
            <IconShield className="h-3.5 w-3.5 text-ink-500" />
            Author Context
          </div>
          <div className="flex items-center gap-3">
            <Avatar name={selected.post.author} size="md" />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-ink-900">
                u/{selected.post.author}
              </div>
              <div className="text-xs text-ink-500">
                {selected.post.authorKarma !== undefined
                  ? `${selected.post.authorKarma.toLocaleString()} karma`
                  : "karma unknown"}
                {" • "}
                posted {timeAgo(selected.post.createdAt)}
              </div>
            </div>
          </div>
          {loading && <SkeletonLines rows={2} className="mt-3" />}
          {!loading && guide && (
            <p className="mt-3 text-sm leading-relaxed text-ink-700">
              {guide.authorContext}
            </p>
          )}
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
            <IconCheck className="h-3.5 w-3.5 text-brand-500" />
            Suggested Approach
          </div>
          {loading && <SkeletonLines rows={3} />}
          {!loading && guide && (
            <ol className="space-y-2.5">
              {guide.suggestedSteps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11px] font-semibold text-brand-700">
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-ink-700">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          )}
          {!loading && !guide && !error && (
            <p className="text-sm text-ink-500">
              Strategy guide will appear once generation completes.
            </p>
          )}
        </Card>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {error}
          </div>
        )}

        {addedLeadId && (
          <div className="rounded-xl border border-brand-200 bg-brand-50 p-3 text-xs text-brand-700">
            Added to CRM — <Link href="/leads" className="font-semibold underline">view pipeline</Link>
          </div>
        )}
      </div>

      <div
        // pb honors iOS home indicator inset on mobile; the px-5 py-4 fallback
        // still applies because env(safe-area-inset-bottom) is 0 on desktop.
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        className="flex shrink-0 items-center gap-2 border-t border-ink-100 bg-white px-5 pt-4"
      >
        <Button variant="ghost" className="flex-1" onClick={onClose}>
          Dismiss
        </Button>
        <Button
          className="flex-1"
          loading={addingToCrm}
          disabled={addingToCrm || !!addedLeadId}
          rightIcon={<IconArrowRight className="h-4 w-4" />}
          onClick={addToCrm}
        >
          {addedLeadId ? "Added" : "Add to CRM"}
        </Button>
      </div>
    </aside>
  );
}

function FeedLoading() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-36 animate-pulse rounded-2xl bg-ink-100" />
      ))}
    </div>
  );
}

function FeedEmpty({ productId }: { productId?: string }) {
  return (
    <Card className="mx-auto max-w-lg p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <IconSparkles className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold text-ink-900">
        No posts scored yet
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-ink-500">
        Fetch posts from a tracked subreddit and our AI will score them for
        buying intent in seconds.
      </p>
      {productId && (
        <div className="mt-5 flex justify-center">
          <FetchPostsButton productId={productId} />
        </div>
      )}
    </Card>
  );
}

function FetchPostsButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);
  const [targets, setTargets] = useState<SubredditTarget[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { load } = useFeedStore();

  useEffect(() => {
    fetch(`/api/subreddits?productId=${productId}`)
      .then((r) => r.json())
      .then((j) => setTargets(j.targets ?? []));
  }, [productId]);

  async function run() {
    if (targets.length === 0) {
      setError("No tracked subreddits yet — add one from the Filters panel.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      for (const t of targets.slice(0, 3)) {
        const res = await fetch("/api/fetch-posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId,
            subreddit: t.name,
            score: true,
            limit: 50,
          }),
        });
        if (res.status === 429) {
          const json = await res.json().catch(() => ({}));
          setError(formatPlanLimit(json));
          break;
        }
      }
      await load(productId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        onClick={run}
        loading={loading}
        rightIcon={<IconArrowRight className="h-4 w-4" />}
      >
        Fetch & score posts
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function SkeletonLines({
  rows = 2,
  className = "",
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-3 w-full animate-pulse rounded bg-ink-100" />
      ))}
      <div className="h-3 w-2/3 animate-pulse rounded bg-ink-100" />
    </div>
  );
}

function EmptyState() {
  return (
    <>
      <Header title="Power Feed" />
      <main className="flex-1 px-8 py-12">
        <Card className="mx-auto max-w-2xl p-10 text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <IconAlert className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-ink-900">
            Analyze a product first
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
            The Power Feed scores Reddit posts against your product&apos;s
            niche — start by onboarding a product.
          </p>
          <div className="mt-6 flex items-center justify-center">
            <Link href="/onboarding">
              <Button rightIcon={<IconArrowRight className="h-4 w-4" />}>
                Start Onboarding
              </Button>
            </Link>
          </div>
        </Card>
      </main>
    </>
  );
}

function ruleBadgeInfo(
  badge: "green" | "yellow" | "red" | null,
): { label: string; tone: "success" | "warning" | "danger" } | null {
  if (badge === "green") return { label: "Promo OK", tone: "success" };
  if (badge === "yellow") return { label: "Promo Limited", tone: "warning" };
  if (badge === "red") return { label: "No Promo", tone: "danger" };
  return null;
}

function intentBadgeInfo(
  intentScore: number,
  risk: RiskLevel,
): {
  label: string;
  tone: "success" | "warning" | "danger" | "brand" | "neutral";
  icon: React.ReactNode;
} {
  // Risk flags trump intent — a high-intent post in a self-promo-banning sub
  // is still risky to engage with, and the user needs to see that first.
  if (risk === "high_risk") {
    return {
      label: "High Risk",
      tone: "danger",
      icon: <IconAlert className="h-3 w-3" />,
    };
  }
  if (risk === "review") {
    return {
      label: "Review Needed",
      tone: "warning",
      icon: <IconAlert className="h-3 w-3" />,
    };
  }
  if (intentScore >= 85) {
    return {
      label: "Hot Lead",
      tone: "brand",
      icon: <IconFlame className="h-3 w-3" />,
    };
  }
  if (intentScore >= 70) {
    return {
      label: "Warm Lead",
      tone: "success",
      icon: <IconFlame className="h-3 w-3" />,
    };
  }
  if (intentScore >= 50) {
    return {
      label: "Lukewarm",
      tone: "success",
      icon: <IconShield className="h-3 w-3" />,
    };
  }
  return {
    label: "Cool Lead",
    tone: "neutral",
    icon: <IconShield className="h-3 w-3" />,
  };
}

function formatSubs(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return `${n}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
