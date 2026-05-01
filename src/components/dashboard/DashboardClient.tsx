"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AreaChart } from "@/components/ui/AreaChart";
import { RadialProgress } from "@/components/ui/RadialProgress";
import { Sparkline } from "@/components/ui/Sparkline";
import {
  IconUser,
  IconChat,
  IconFlame,
  IconAlert,
  IconEye,
  IconSparkles,
  IconArrowRight,
} from "@/components/ui/Icons";
import type {
  IntelligenceFeedItem,
  LeadVelocityPoint,
} from "@/types";

interface DashboardData {
  product: { id: string; name: string | null; websiteUrl: string };
  metrics: {
    highIntentCount: number;
    totalLeads: number;
    activeThreads: number;
    conversionRate: number;
    aiCredits: number;
    aiCreditsMax: number;
  };
  velocity: LeadVelocityPoint[];
  intelligenceFeed: IntelligenceFeedItem[];
}

type Range = "7D" | "30D" | "YTD";

export default function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>("7D");

  useEffect(() => {
    (async () => {
      try {
        const first = await fetch("/api/products?first=1").then((r) => r.json());
        if (!first.product) {
          setError("no-product");
          return;
        }
        const res = await fetch(`/api/dashboard?productId=${first.product.id}`);
        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? "failed");
          return;
        }
        setData(json);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (!loading && error === "no-product") return <EmptyState />;

  return (
    <>
      <Header
        title="Intelligence Hub"
        searchPlaceholder="Search leads, posts..."
      />
      <main className="flex-1 space-y-5 px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6 md:px-8 md:py-8">
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          {loading ? (
            <>
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
            </>
          ) : (
            <>
              <MetricCard
                label="High-Intent Leads"
                value={data?.metrics.highIntentCount ?? 0}
                trend={`+${Math.max(0, data?.metrics.highIntentCount ?? 0)} today`}
                trendTone="up"
                icon={<IconUser className="h-4 w-4" />}
                spark={data?.velocity.slice(-7).map((v) => v.count) ?? []}
              />
              <MetricCard
                label="Active Threads"
                value={data?.metrics.activeThreads ?? 0}
                trend="→ Steady"
                trendTone="neutral"
                icon={<IconChat className="h-4 w-4" />}
                spark={data?.velocity.slice(-7).map((v) => v.count) ?? []}
              />
              <MetricCard
                label="Conversion Rate"
                value={data?.metrics.conversionRate ?? 0}
                suffix="%"
                trend={`${data?.metrics.conversionRate ? "+" : ""}${data?.metrics.conversionRate ?? 0}% this week`}
                trendTone="up"
                icon={<IconFlame className="h-4 w-4" />}
              />
            </>
          )}
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <div className="flex flex-col gap-3 px-4 pt-4 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:pt-6">
              <div>
                <h2 className="text-base font-semibold text-ink-900">
                  Lead Velocity
                </h2>
                <p className="mt-0.5 text-xs text-ink-500">
                  Volume of qualified prospects identified over time
                </p>
              </div>
              <div className="flex self-start rounded-lg bg-ink-100 p-0.5 text-xs">
                {(["7D", "30D", "YTD"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`rounded-md px-3 py-1 font-medium transition ${
                      range === r
                        ? "bg-white text-ink-900 shadow-sm"
                        : "text-ink-500"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-1 pb-4 sm:px-2">
              {loading ? (
                <div className="h-[220px] animate-pulse rounded-xl bg-ink-100" />
              ) : (
                <AreaChart
                  data={(data?.velocity ?? []).map((v) => ({
                    label: new Date(v.date).toLocaleDateString(undefined, {
                      weekday: "short",
                    }),
                    value: v.count,
                  }))}
                  height={220}
                />
              )}
            </div>
          </Card>

          <Card className="ring-1 ring-brand-100">
            <div className="flex items-center gap-2 px-4 pt-4 sm:px-5 sm:pt-5">
              <IconSparkles className="h-4 w-4 text-brand-600" />
              <h2 className="text-base font-semibold text-ink-900">
                Intelligence Feed
              </h2>
            </div>
            <div className="space-y-3 px-3 pb-4 pt-3 sm:px-4 sm:pt-4">
              {loading ? (
                <>
                  <IntelligenceCardSkeleton />
                  <IntelligenceCardSkeleton />
                  <IntelligenceCardSkeleton />
                </>
              ) : (
                <>
                  {(data?.intelligenceFeed ?? []).map((item) => (
                    <IntelligenceCard key={item.id} item={item} />
                  ))}
                  {data && data.intelligenceFeed.length === 0 && (
                    <div className="rounded-xl border border-dashed border-ink-200 p-6 text-center text-xs text-ink-400">
                      No insights yet. Fetch posts from the Power Feed to start.
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>
        </section>

      </main>
    </>
  );
}

function MetricCardSkeleton() {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="h-3 w-24 animate-pulse rounded bg-ink-100" />
        <div className="h-7 w-7 animate-pulse rounded-lg bg-ink-100" />
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="space-y-2">
          <div className="h-8 w-16 animate-pulse rounded bg-ink-100" />
          <div className="h-3 w-20 animate-pulse rounded bg-ink-100" />
        </div>
        <div className="h-6 w-20 animate-pulse rounded bg-ink-100 opacity-80" />
      </div>
    </Card>
  );
}

function IntelligenceCardSkeleton() {
  return (
    <div className="rounded-xl border border-ink-200/60 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="h-4 w-20 animate-pulse rounded bg-ink-100" />
        <div className="h-3 w-8 animate-pulse rounded bg-ink-100" />
      </div>
      <div className="mt-2 space-y-1.5">
        <div className="h-3.5 w-full animate-pulse rounded bg-ink-100" />
        <div className="h-3.5 w-3/4 animate-pulse rounded bg-ink-100" />
      </div>
      <div className="mt-2 h-3 w-16 animate-pulse rounded bg-ink-100" />
    </div>
  );
}

function MetricCard({
  label,
  value,
  suffix,
  trend,
  trendTone,
  icon,
  spark,
  radial,
}: {
  label: string;
  value: number;
  suffix?: string;
  trend: string;
  trendTone: "up" | "down" | "neutral" | "danger";
  icon: React.ReactNode;
  spark?: number[];
  radial?: number;
}) {
  const toneCls = {
    up: "text-brand-600",
    down: "text-red-600",
    neutral: "text-ink-500",
    danger: "text-red-600",
  }[trendTone];

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-ink-500">{label}</span>
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-100 text-ink-500">
          {icon}
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <div className="text-3xl font-bold tracking-tight text-ink-900">
            {typeof value === "number" ? value.toLocaleString() : value}
            {suffix && <span className="text-2xl text-ink-400">{suffix}</span>}
          </div>
          <div className={`mt-1 text-xs font-medium ${toneCls}`}>{trend}</div>
        </div>
        {spark && spark.length > 1 && (
          <div className="opacity-80">
            <Sparkline points={spark} width={80} height={24} />
          </div>
        )}
        {radial !== undefined && (
          <RadialProgress value={radial} size={48} strokeWidth={5} />
        )}
      </div>
    </Card>
  );
}

function IntelligenceCard({ item }: { item: IntelligenceFeedItem }) {
  const tone =
    item.priority === "high"
      ? "danger"
      : item.priority === "opportunity"
        ? "brand"
        : "neutral";
  const label =
    item.priority === "high"
      ? "HIGH PRIORITY"
      : item.priority === "opportunity"
        ? "OPPORTUNITY"
        : "ROUTINE";
  return (
    <div className="rounded-xl border border-ink-200/60 bg-white p-4">
      <div className="flex items-center justify-between">
        <Badge tone={tone}>{label}</Badge>
        <span className="flex items-center gap-1 text-[11px] text-ink-400">
          <IconEye className="h-3 w-3" /> live
        </span>
      </div>
      <h3 className="mt-2 line-clamp-2 text-sm font-semibold text-ink-900">
        {item.title}
      </h3>
      {item.body && (
        <p className="mt-1 line-clamp-2 text-xs text-ink-500">{item.body}</p>
      )}
      {item.cta && (
        item.contextUrl ? (
          <Link
            href={item.contextUrl}
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            {item.cta}
            <IconArrowRight className="h-3 w-3" />
          </Link>
        ) : (
          <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-brand-600">
            {item.cta}
            <IconArrowRight className="h-3 w-3" />
          </div>
        )
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <>
      <Header title="Intelligence Hub" />
      <main className="flex-1 px-4 py-8 sm:px-8 sm:py-12">
        <Card className="mx-auto max-w-2xl p-6 text-center sm:p-10">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <IconAlert className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-ink-900">
            No product analyzed yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
            Give us your product URL and we&apos;ll map out the best
            subreddits, keywords, and intent signals for you.
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
