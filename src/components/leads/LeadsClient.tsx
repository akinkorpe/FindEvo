"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import {
  IconAlert,
  IconArrowRight,
  IconBoard,
  IconChat,
  IconCheck,
  IconClose,
  IconFlame,
  IconSparkles,
  IconTable,
  IconUser,
} from "@/components/ui/Icons";
import { useLeadsStore } from "@/store/useLeadsStore";
import type { Lead, LeadStatus } from "@/types";

interface Product {
  id: string;
  name: string | null;
}

type Mode = "table" | "board";

const STATUS_META: Record<
  LeadStatus,
  { label: string; tone: "neutral" | "brand" | "info" | "success" | "danger" }
> = {
  new: { label: "New", tone: "info" },
  engaged: { label: "Engaged", tone: "brand" },
  active_pipeline: { label: "Active Pipeline", tone: "brand" },
  converted: { label: "Converted", tone: "success" },
  dismissed: { label: "Dismissed", tone: "neutral" },
};

const BOARD_COLUMNS: LeadStatus[] = [
  "new",
  "engaged",
  "active_pipeline",
  "converted",
];

export default function LeadsClient() {
  const [product, setProduct] = useState<Product | null>(null);
  const [noProduct, setNoProduct] = useState(false);
  const [mode, setMode] = useState<Mode>("table");
  const {
    leads,
    selectedId,
    detail,
    load,
    select,
    loadDetail,
    updateStatus,
    isLoading,
  } = useLeadsStore();

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
    if (product) load(product.id);
  }, [product, load]);

  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  const stats = useMemo(() => {
    const totalActive = leads.filter(
      (l) => l.status !== "dismissed" && l.status !== "converted",
    ).length;
    const highIntent = leads.filter((l) => /high/i.test(l.intentLabel)).length;
    const converted = leads.filter((l) => l.status === "converted").length;
    const conversionRate = leads.length
      ? Math.round((converted / leads.length) * 100)
      : 0;
    return { totalActive, highIntent, conversionRate, converted };
  }, [leads]);

  if (noProduct) return <EmptyShell />;

  return (
    <>
      <Header title="CRM Leads" searchPlaceholder="Search leads..." />
      <main className="flex-1 space-y-6 px-6 py-6 md:px-8 md:py-8">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            label="Total Active"
            value={stats.totalActive}
            helper="Leads in pipeline"
            icon={<IconUser className="h-4 w-4" />}
          />
          <StatCard
            label="High Intent"
            value={stats.highIntent}
            helper="Ready for outreach"
            icon={<IconFlame className="h-4 w-4" />}
            accent
          />
          <StatCard
            label="AI Insights"
            value={stats.conversionRate}
            suffix="%"
            helper={`${stats.converted} converted so far`}
            icon={<IconSparkles className="h-4 w-4" />}
          />
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink-900">
              Recent Activity
            </h2>
            <div className="flex rounded-lg bg-ink-100 p-0.5 text-xs">
              <button
                onClick={() => setMode("table")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition ${
                  mode === "table"
                    ? "bg-white text-ink-900 shadow-sm"
                    : "text-ink-500"
                }`}
              >
                <IconTable className="h-3.5 w-3.5" />
                Table
              </button>
              <button
                onClick={() => setMode("board")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition ${
                  mode === "board"
                    ? "bg-white text-ink-900 shadow-sm"
                    : "text-ink-500"
                }`}
              >
                <IconBoard className="h-3.5 w-3.5" />
                Board
              </button>
            </div>
          </div>

          {isLoading && leads.length === 0 ? (
            <LoadingRows />
          ) : leads.length === 0 ? (
            <EmptyLeads productId={product?.id} />
          ) : mode === "table" ? (
            <LeadsTable leads={leads} onSelect={(id) => select(id)} />
          ) : (
            <LeadsBoard
              leads={leads}
              onSelect={(id) => select(id)}
              onMove={(id, status) => updateStatus(id, status)}
            />
          )}
        </section>
      </main>

      {selectedId && (
        <LeadDrawer
          lead={leads.find((l) => l.id === selectedId) ?? null}
          detail={detail}
          onClose={() => select(null)}
          onStatus={(status) => updateStatus(selectedId, status)}
        />
      )}
    </>
  );
}

function StatCard({
  label,
  value,
  suffix,
  helper,
  icon,
  accent,
}: {
  label: string;
  value: number;
  suffix?: string;
  helper: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <Card className={`p-5 ${accent ? "ring-1 ring-brand-100" : ""}`}>
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-ink-500">{label}</span>
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-lg ${
            accent ? "bg-brand-50 text-brand-600" : "bg-ink-100 text-ink-500"
          }`}
        >
          {icon}
        </span>
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight text-ink-900">
        {value.toLocaleString()}
        {suffix && <span className="text-2xl text-ink-400">{suffix}</span>}
      </div>
      <div className="mt-1 text-xs text-ink-500">{helper}</div>
    </Card>
  );
}

function LeadsTable({
  leads,
  onSelect,
}: {
  leads: Lead[];
  onSelect: (id: string) => void;
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-100 bg-ink-50/60 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
            <tr>
              <th className="w-10 px-4 py-3">
                <input type="checkbox" className="rounded border-ink-300" />
              </th>
              <th className="px-4 py-3 text-left">Lead Identity</th>
              <th className="px-4 py-3 text-left">Source</th>
              <th className="px-4 py-3 text-left">Intent</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Last Seen</th>
              <th className="w-10 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const status = STATUS_META[lead.status];
              const high = /high/i.test(lead.intentLabel);
              return (
                <tr
                  key={lead.id}
                  onClick={() => onSelect(lead.id)}
                  className="cursor-pointer border-b border-ink-100 transition hover:bg-ink-50/60"
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" className="rounded border-ink-300" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={lead.redditUsername} size="sm" />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-ink-900">
                          u/{lead.redditUsername}
                        </div>
                        <div className="truncate text-xs text-ink-500">
                          {lead.notes || "No notes yet"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-600">{lead.source}</td>
                  <td className="px-4 py-3">
                    <Badge tone={high ? "brand" : "neutral"}>
                      {lead.intentLabel}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-500">
                    {lead.lastSeenAt ? relTime(lead.lastSeenAt) : "—"}
                  </td>
                  <td className="px-4 py-3 text-ink-300">
                    <IconArrowRight className="h-4 w-4" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function LeadsBoard({
  leads,
  onSelect,
  onMove,
}: {
  leads: Lead[];
  onSelect: (id: string) => void;
  onMove: (id: string, status: LeadStatus) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {BOARD_COLUMNS.map((col) => {
        const items = leads.filter((l) => l.status === col);
        const meta = STATUS_META[col];
        return (
          <div key={col} className="flex flex-col">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    col === "new"
                      ? "bg-blue-500"
                      : col === "engaged"
                        ? "bg-brand-500"
                        : col === "active_pipeline"
                          ? "bg-amber-500"
                          : "bg-ink-400"
                  }`}
                />
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-600">
                  {meta.label}
                </span>
              </div>
              <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold text-ink-500">
                {items.length}
              </span>
            </div>
            <div className="flex-1 space-y-2 rounded-2xl bg-ink-50/60 p-2">
              {items.map((lead) => (
                <button
                  key={lead.id}
                  onClick={() => onSelect(lead.id)}
                  className="w-full rounded-xl border border-ink-100 bg-white p-3 text-left transition hover:border-ink-200 hover:shadow-card"
                >
                  <div className="flex items-center gap-2">
                    <Avatar name={lead.redditUsername} size="xs" />
                    <span className="truncate text-sm font-semibold text-ink-900">
                      u/{lead.redditUsername}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-ink-500">{lead.source}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge tone={/high/i.test(lead.intentLabel) ? "brand" : "neutral"}>
                      {lead.intentLabel}
                    </Badge>
                    {col !== "converted" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const next = nextStatus(col);
                          if (next) onMove(lead.id, next);
                        }}
                        className="text-ink-400 hover:text-brand-600"
                      >
                        <IconArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </button>
              ))}
              {items.length === 0 && (
                <div className="rounded-xl border border-dashed border-ink-200 p-6 text-center text-[11px] text-ink-400">
                  Empty
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LeadDrawer({
  lead,
  detail,
  onClose,
  onStatus,
}: {
  lead: Lead | null;
  detail: { lead: Lead; interactions: { id: string; kind: string; content: string; createdAt: string }[] } | null;
  onClose: () => void;
  onStatus: (status: LeadStatus) => void;
}) {
  if (!lead) return null;
  const status = STATUS_META[lead.status];
  const interactions = detail?.interactions ?? [];
  const nextAction = nextStatus(lead.status);

  return (
    <div className="fixed inset-0 z-40 flex">
      <div
        className="flex-1 bg-ink-900/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="flex w-full max-w-md flex-col border-l border-ink-100 bg-white shadow-pop">
        <div className="flex items-start justify-between border-b border-ink-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <Avatar name={lead.redditUsername} size="md" />
            <div>
              <div className="text-base font-semibold text-ink-900">
                u/{lead.redditUsername}
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-500">
                <span>{lead.source}</span>
                <span className="text-ink-300">•</span>
                <Badge tone={status.tone}>{status.label}</Badge>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
              Signal
            </div>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <IconFlame className="h-4 w-4 text-brand-500" />
                <span className="text-sm font-semibold text-ink-900">
                  {lead.intentLabel}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-ink-500">
                Last surfaced {lead.lastSeenAt ? relTime(lead.lastSeenAt) : "—"} from {lead.source}.
              </p>
            </Card>
          </div>

          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
              Move to next stage
            </div>
            <div className="flex flex-wrap gap-2">
              {(["new", "engaged", "active_pipeline", "converted", "dismissed"] as LeadStatus[]).map(
                (s) => (
                  <button
                    key={s}
                    onClick={() => onStatus(s)}
                    disabled={s === lead.status}
                    className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition ${
                      s === lead.status
                        ? "bg-ink-100 text-ink-400 ring-ink-200"
                        : "bg-white text-ink-700 ring-ink-200 hover:bg-ink-50"
                    }`}
                  >
                    {STATUS_META[s].label}
                  </button>
                ),
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
              Interaction History
            </div>
            {interactions.length === 0 ? (
              <p className="rounded-xl border border-dashed border-ink-200 p-4 text-center text-xs text-ink-400">
                No interactions recorded yet.
              </p>
            ) : (
              <ol className="space-y-3">
                {interactions.map((ix) => (
                  <li key={ix.id} className="flex gap-3">
                    <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                      {ix.kind === "ai_suggestion" ? (
                        <IconSparkles className="h-3 w-3" />
                      ) : ix.kind === "comment" ? (
                        <IconChat className="h-3 w-3" />
                      ) : ix.kind === "status_change" ? (
                        <IconArrowRight className="h-3 w-3" />
                      ) : (
                        <IconCheck className="h-3 w-3" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1 rounded-xl border border-ink-100 bg-white p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                          {ix.kind.replace(/_/g, " ")}
                        </span>
                        <span className="text-[11px] text-ink-400">
                          {relTime(ix.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-ink-700">{ix.content}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-ink-100 bg-white px-5 py-4">
          <Button
            variant="ghost"
            className="flex-1"
            onClick={() => onStatus("dismissed")}
            disabled={lead.status === "dismissed"}
          >
            Dismiss
          </Button>
          <Button
            className="flex-1"
            rightIcon={<IconArrowRight className="h-4 w-4" />}
            onClick={() => nextAction && onStatus(nextAction)}
            disabled={!nextAction}
          >
            {nextAction
              ? `Execute → ${STATUS_META[nextAction].label}`
              : "Converted"}
          </Button>
        </div>
      </aside>
    </div>
  );
}

function LoadingRows() {
  return (
    <Card className="p-4">
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-ink-100" />
        ))}
      </div>
    </Card>
  );
}

function EmptyLeads({ productId }: { productId?: string }) {
  return (
    <Card className="mx-auto max-w-lg p-10 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <IconUser className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold text-ink-900">
        No leads yet
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-ink-500">
        Add high-intent posts from the Power Feed and they&apos;ll show up here
        as tracked leads.
      </p>
      <div className="mt-5 flex justify-center">
        <Link href={productId ? "/feed" : "/onboarding"}>
          <Button rightIcon={<IconArrowRight className="h-4 w-4" />}>
            {productId ? "Open Power Feed" : "Start Onboarding"}
          </Button>
        </Link>
      </div>
    </Card>
  );
}

function EmptyShell() {
  return (
    <>
      <Header title="CRM Leads" />
      <main className="flex-1 px-8 py-12">
        <Card className="mx-auto max-w-2xl p-10 text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <IconAlert className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-ink-900">
            Analyze a product first
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
            Leads are tracked per product. Onboard your product to start
            surfacing qualified prospects.
          </p>
          <div className="mt-6 flex justify-center">
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

function nextStatus(s: LeadStatus): LeadStatus | null {
  switch (s) {
    case "new":
      return "engaged";
    case "engaged":
      return "active_pipeline";
    case "active_pipeline":
      return "converted";
    default:
      return null;
  }
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
