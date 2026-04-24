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
} from "@/components/ui/Icons";
import { useFeedStore } from "@/store/useFeedStore";
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
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [scanningSub, setScanningSub] = useState<string | null>(null);
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
      .then((j) => setTargets(j.targets ?? []));
  }, [product, view, subredditFilter, load]);

  const autoFetchedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!product || targets.length === 0) return;
    if (autoFetchedFor.current === product.id) return;
    autoFetchedFor.current = product.id;

    const cooldownKey = (sub: string) =>
      `redditleads:lastFetch:${product.id}:${sub.toLowerCase()}`;

    const due = targets.filter((t) => {
      const last = Number(localStorage.getItem(cooldownKey(t.name)) ?? 0);
      return Date.now() - last > AUTO_FETCH_COOLDOWN_MS;
    });
    if (due.length === 0) return;

    let cancelled = false;
    (async () => {
      for (const t of due) {
        if (cancelled) break;
        setScanningSub(t.name);
        try {
          const res = await fetch("/api/fetch-posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productId: product.id,
              subreddit: t.name,
              score: true,
              limit: 50,
            }),
          });
          if (res.status === 429) break; // rate-limited, stop scanning
          if (res.ok) {
            localStorage.setItem(cooldownKey(t.name), String(Date.now()));
            await load(product.id);
          }
        } catch {
          /* skip single-sub failure */
        }
      }
      if (!cancelled) setScanningSub(null);
    })();

    return () => {
      cancelled = true;
    };
  }, [product, targets, load]);

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

  const visibleItems = useMemo(
    () => sorted.filter((item) => isInTimeRange(item.post.createdAt, timeRange)),
    [sorted, timeRange],
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

  return (
    <div className="flex h-screen min-h-0 flex-col">
      <Header title="Power Feed" searchPlaceholder="Search posts, keywords..." />
      <main className="flex min-h-0 flex-1 overflow-hidden">
        <FiltersPanel
          items={visibleItems}
          targets={targets}
          view={view}
          setView={setView}
          subreddit={subredditFilter}
          setSubreddit={setSubreddit}
        />

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink-100 bg-white px-6 py-3">
            <div className="flex items-center gap-3">
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
              {scanningSub && (
                <div className="flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-700">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />
                  Scanning r/{scanningSub}…
                </div>
              )}
            </div>
            <button
              onClick={() => setIsFiltersOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-50"
            >
              <IconFilter className="h-3.5 w-3.5" />
              Filters: {timeRangeLabel(timeRange)}
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

function FiltersPanel({
  items,
  targets,
  view,
  setView,
  subreddit,
  setSubreddit,
}: {
  items: ScoredPost[];
  targets: SubredditTarget[];
  view: "all" | "high-intent" | "saved";
  setView: (v: "all" | "high-intent" | "saved") => void;
  subreddit: string | null;
  setSubreddit: (name: string | null) => void;
}) {
  const counts = {
    all: items.length,
    highIntent: items.filter((i) => i.intentScore >= 70).length,
  };

  const viewItems = [
    { key: "all" as const, label: "All Leads", count: counts.all, icon: <IconFlame className="h-3.5 w-3.5" /> },
    { key: "high-intent" as const, label: "High Intent", count: counts.highIntent, icon: <IconSparkles className="h-3.5 w-3.5" /> },
  ];

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-ink-100 bg-white">
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
              <button
                key={t.id}
                onClick={() => setSubreddit(t.name)}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-sm transition ${
                  subreddit === t.name
                    ? "bg-ink-100 text-ink-900"
                    : "text-ink-600 hover:bg-ink-50"
                }`}
              >
                <span className="truncate">r/{t.name}</span>
                {t.priority === "high" && (
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                )}
              </button>
            ))}
            {targets.length === 0 && (
              <p className="px-2.5 py-2 text-xs text-ink-400">
                No subreddits tracked yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </aside>
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
  const risk = riskInfo(item.riskLevel);
  const rule = ruleBadgeInfo(item.ruleBadge ?? null);
  const age = timeAgo(item.post.createdAt);
  const body = item.post.body?.trim() || "";

  return (
    <button
      onClick={onSelect}
      className={`w-full rounded-2xl border bg-white p-5 text-left transition ${
        isSelected
          ? "border-brand-400 ring-2 ring-brand-100"
          : "border-ink-100 hover:border-ink-200 hover:shadow-card"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-xs text-ink-500">
          <span className="font-semibold text-ink-700">
            r/{item.post.subreddit}
          </span>
          {rule && (
            <Badge tone={rule.tone} title={item.rulesSummary ?? undefined}>
              {rule.label}
            </Badge>
          )}
          <span className="text-ink-300">•</span>
          <span>{age}</span>
          <span className="text-ink-300">•</span>
          <span className="truncate">u/{item.post.author}</span>
        </div>
        <Badge tone={risk.tone} icon={risk.icon}>
          {risk.label}
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
        <span className="flex items-center gap-1 text-xs font-medium text-brand-600">
          View
          <IconArrowRight className="h-3 w-3" />
        </span>
      </div>
    </button>
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
          throw new Error(
            "You've reached today's approach guide limit (20/day). Please try again tomorrow.",
          );
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
    <aside className="hidden h-full min-h-0 w-[420px] shrink-0 flex-col overflow-hidden border-l border-ink-100 bg-white xl:flex">
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

      <div className="flex items-center gap-2 border-t border-ink-100 bg-white px-5 py-4">
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
      setError("No tracked subreddits. Add some in Settings.");
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
          setError(json.error ?? "You've reached today's limit.");
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
  if (badge === "green") return { label: "Rules: Open", tone: "success" };
  if (badge === "yellow") return { label: "Rules: Limited", tone: "warning" };
  if (badge === "red") return { label: "Rules: No-Promo", tone: "danger" };
  return null;
}

function riskInfo(risk: RiskLevel): {
  label: string;
  tone: "success" | "warning" | "danger";
  icon: React.ReactNode;
} {
  if (risk === "safe")
    return {
      label: "Safe Lead",
      tone: "success",
      icon: <IconShield className="h-3 w-3" />,
    };
  if (risk === "review")
    return {
      label: "Review Needed",
      tone: "warning",
      icon: <IconAlert className="h-3 w-3" />,
    };
  return {
    label: "High Risk",
    tone: "danger",
    icon: <IconAlert className="h-3 w-3" />,
  };
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
