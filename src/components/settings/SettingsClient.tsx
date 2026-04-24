"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toggle } from "@/components/ui/Toggle";
import {
  IconAlert,
  IconArrowRight,
  IconBell,
  IconCheck,
  IconClose,
  IconLink,
  IconPlus,
  IconSettings,
  IconShield,
  IconSparkles,
  IconUser,
} from "@/components/ui/Icons";
import type {
  Product,
  SubredditPriority,
  SubredditTarget,
  WorkspaceSettings,
} from "@/types";

type Tab = "product" | "subreddits" | "notifications" | "account";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "product", label: "Product Profile", icon: <IconSparkles className="h-4 w-4" /> },
  { key: "subreddits", label: "Subreddits & Rules", icon: <IconSettings className="h-4 w-4" /> },
  { key: "notifications", label: "Bildirimler", icon: <IconBell className="h-4 w-4" /> },
  { key: "account", label: "Hesap", icon: <IconUser className="h-4 w-4" /> },
];

export default function SettingsClient() {
  const [product, setProduct] = useState<Product | null>(null);
  const [noProduct, setNoProduct] = useState(false);
  const [tab, setTab] = useState<Tab>("subreddits");

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

  if (noProduct) return <EmptyShell />;

  return (
    <>
      <Header title="Settings" />
      <main className="flex-1 px-6 py-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <nav className="flex gap-1 overflow-x-auto border-b border-ink-100">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
                  tab === t.key
                    ? "border-brand-500 text-ink-900"
                    : "border-transparent text-ink-500 hover:text-ink-800"
                }`}
              >
                <span className={tab === t.key ? "text-brand-600" : "text-ink-400"}>
                  {t.icon}
                </span>
                {t.label}
              </button>
            ))}
          </nav>

          {product && tab === "product" && <ProductProfileTab product={product} onChange={setProduct} />}
          {product && tab === "subreddits" && <SubredditsTab product={product} />}
          {product && tab === "notifications" && <NotificationsTab product={product} />}
          {product && tab === "account" && <AccountTab product={product} />}
        </div>
      </main>
    </>
  );
}

function ProductProfileTab({
  product,
  onChange,
}: {
  product: Product;
  onChange: (p: Product) => void;
}) {
  const [name, setName] = useState(product.name ?? "");
  const [niche, setNiche] = useState(product.niche ?? "");
  const [summary, setSummary] = useState(product.summary ?? "");
  const [keywordText, setKeywordText] = useState(product.keywords.join(", "));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty =
    name !== (product.name ?? "") ||
    niche !== (product.niche ?? "") ||
    summary !== (product.summary ?? "") ||
    keywordText !== product.keywords.join(", ");

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/products`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product.id,
          patch: {
            name,
            niche,
            summary,
            keywords: keywordText
              .split(",")
              .map((k) => k.trim())
              .filter(Boolean),
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "failed");
      onChange(json.product);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "error");
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setName(product.name ?? "");
    setNiche(product.niche ?? "");
    setSummary(product.summary ?? "");
    setKeywordText(product.keywords.join(", "));
  }

  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink-900">Product Profile</h2>
          <p className="mt-0.5 text-xs text-ink-500">
            The AI uses this profile to score posts and generate strategy guides.
          </p>
        </div>
        <Badge tone="brand" icon={<IconLink className="h-3 w-3" />}>
          {product.websiteUrl}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.currentTarget.value)} />
        </Field>
        <Field label="Niche">
          <Input value={niche} onChange={(e) => setNiche(e.currentTarget.value)} />
        </Field>
        <Field label="Summary" full>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.currentTarget.value)}
            rows={3}
            className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm shadow-card outline-none focus:border-ink-300 focus:ring-2 focus:ring-ink-200/70"
          />
        </Field>
        <Field label="Keywords (comma separated)" full>
          <Input
            value={keywordText}
            onChange={(e) => setKeywordText(e.currentTarget.value)}
          />
        </Field>
      </div>

      <FormFooter
        dirty={dirty}
        saving={saving}
        saved={saved}
        error={error}
        onSave={save}
        onReset={reset}
      />
    </Card>
  );
}

function SubredditsTab({ product }: { product: Product }) {
  const [targets, setTargets] = useState<SubredditTarget[]>([]);
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);
  const [original, setOriginal] = useState<WorkspaceSettings | null>(null);
  const [newName, setNewName] = useState("");
  const [newPriority, setNewPriority] = useState<SubredditPriority>("standard");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/subreddits?productId=${product.id}`)
      .then((r) => r.json())
      .then((j) => setTargets(j.targets ?? []));
    fetch(`/api/settings?productId=${product.id}`)
      .then((r) => r.json())
      .then((j) => {
        setSettings(j.settings);
        setOriginal(j.settings);
      });
  }, [product.id]);

  async function addTarget(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim().replace(/^r\//i, "");
    if (!name) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/subreddits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, name, priority: newPriority }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "failed");
      setTargets((prev) => [...prev, json.target]);
      setNewName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "error");
    } finally {
      setAdding(false);
    }
  }

  async function removeTarget(id: string) {
    const res = await fetch(`/api/subreddits?id=${id}`, { method: "DELETE" });
    if (res.ok) setTargets((prev) => prev.filter((t) => t.id !== id));
  }

  const dirty =
    settings !== null &&
    original !== null &&
    (settings.strictProfanityFilter !== original.strictProfanityFilter ||
      settings.requireCompetitorMention !== original.requireCompetitorMention ||
      settings.minAuthorKarma !== original.minAuthorKarma ||
      settings.maxPostAgeHours !== original.maxPostAgeHours);

  async function save() {
    if (!settings) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          patch: {
            strictProfanityFilter: settings.strictProfanityFilter,
            requireCompetitorMention: settings.requireCompetitorMention,
            minAuthorKarma: settings.minAuthorKarma,
            maxPostAgeHours: settings.maxPostAgeHours,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "failed");
      setSettings(json.settings);
      setOriginal(json.settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "error");
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    if (original) setSettings(original);
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink-900">
              Target Communities
            </h2>
            <p className="mt-0.5 text-xs text-ink-500">
              Subreddits scored by the intent engine. High priority gets scanned
              first.
            </p>
          </div>
        </div>

        <form onSubmit={addTarget} className="mb-4 flex gap-2">
          <div className="flex-1">
            <Input
              leftIcon={<IconPlus className="h-4 w-4" />}
              placeholder="e.g. SaaS"
              value={newName}
              onChange={(e) => setNewName(e.currentTarget.value)}
            />
          </div>
          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.currentTarget.value as SubredditPriority)}
            className="h-11 rounded-xl border border-ink-200 bg-white px-3 text-sm shadow-card outline-none focus:border-ink-300 focus:ring-2 focus:ring-ink-200/70"
          >
            <option value="standard">Standard</option>
            <option value="high">High priority</option>
          </select>
          <Button type="submit" loading={adding} disabled={!newName.trim()}>
            Add
          </Button>
        </form>

        <div className="divide-y divide-ink-100 rounded-xl border border-ink-100">
          {targets.length === 0 && (
            <p className="p-5 text-center text-xs text-ink-400">
              No subreddits tracked yet. Add one above to start scoring.
            </p>
          )}
          {targets.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-100 text-xs font-semibold text-ink-700">
                  r/
                </span>
                <div>
                  <div className="text-sm font-semibold text-ink-900">
                    r/{t.name}
                  </div>
                  <div className="text-[11px] text-ink-400">
                    Added {new Date(t.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={t.priority === "high" ? "brand" : "neutral"}>
                  {t.priority === "high" ? "High Priority" : "Standard"}
                </Badge>
                <button
                  onClick={() => removeTarget(t.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-400 hover:bg-red-50 hover:text-red-600"
                >
                  <IconClose className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-ink-900">
            Risk & Quality Criteria
          </h2>
          <p className="mt-0.5 text-xs text-ink-500">
            Signals the scoring engine applies before flagging a post as a lead.
          </p>
        </div>

        <div className="space-y-4">
          <ToggleRow
            icon={<IconShield className="h-4 w-4" />}
            label="Strict Profanity Filter"
            helper="Skip posts containing slurs or heavy profanity — higher safety, lower recall."
            checked={settings?.strictProfanityFilter ?? false}
            onChange={(v) =>
              setSettings((s) => (s ? { ...s, strictProfanityFilter: v } : s))
            }
          />
          <ToggleRow
            icon={<IconSparkles className="h-4 w-4" />}
            label="Require Direct Competitor Mention"
            helper="Only surface posts that explicitly mention a competitor or category term."
            checked={settings?.requireCompetitorMention ?? false}
            onChange={(v) =>
              setSettings((s) => (s ? { ...s, requireCompetitorMention: v } : s))
            }
          />

          <div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-2">
            <Field label="Min Author Karma">
              <Input
                type="number"
                min={0}
                value={settings?.minAuthorKarma ?? 0}
                onChange={(e) =>
                  setSettings((s) =>
                    s
                      ? {
                          ...s,
                          minAuthorKarma: Number(e.currentTarget.value) || 0,
                        }
                      : s,
                  )
                }
              />
            </Field>
            <Field label="Max Post Age (hours)">
              <Input
                type="number"
                min={1}
                value={settings?.maxPostAgeHours ?? 24}
                onChange={(e) =>
                  setSettings((s) =>
                    s
                      ? {
                          ...s,
                          maxPostAgeHours: Number(e.currentTarget.value) || 24,
                        }
                      : s,
                  )
                }
              />
            </Field>
          </div>
        </div>

        <FormFooter
          dirty={dirty}
          saving={saving}
          saved={saved}
          error={error}
          onSave={save}
          onReset={reset}
        />
      </Card>
    </div>
  );
}

interface UserSettingsView {
  productId: string;
  notifyNewPosts: boolean;
  notifyLeadReminders: boolean;
  updatedAt: string;
}

function NotificationsTab({ product }: { product: Product }) {
  const [settings, setSettings] = useState<UserSettingsView | null>(null);
  const [original, setOriginal] = useState<UserSettingsView | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/user-settings?productId=${product.id}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.settings) {
          setSettings(j.settings);
          setOriginal(j.settings);
        }
      })
      .catch(() => setError("Couldn't load settings"));
  }, [product.id]);

  const dirty =
    settings !== null &&
    original !== null &&
    (settings.notifyNewPosts !== original.notifyNewPosts ||
      settings.notifyLeadReminders !== original.notifyLeadReminders);

  async function save() {
    if (!settings) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/user-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          patch: {
            notifyNewPosts: settings.notifyNewPosts,
            notifyLeadReminders: settings.notifyLeadReminders,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "failed");
      setSettings(json.settings);
      setOriginal(json.settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "error");
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    if (original) setSettings(original);
  }

  return (
    <Card className="p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-ink-900">Notifications</h2>
        <p className="mt-0.5 text-xs text-ink-500">
          Choose when you want us to reach out.
        </p>
      </div>

      <div className="space-y-4">
        <ToggleRow
          icon={<IconBell className="h-4 w-4" />}
          label="New post alerts"
          helper="Get notified when a new high-intent post is found."
          checked={settings?.notifyNewPosts ?? false}
          onChange={(v) =>
            setSettings((s) => (s ? { ...s, notifyNewPosts: v } : s))
          }
        />
        <ToggleRow
          icon={<IconAlert className="h-4 w-4" />}
          label="Lead follow-up reminders"
          helper="Send a daily reminder for leads you haven't followed up on."
          checked={settings?.notifyLeadReminders ?? false}
          onChange={(v) =>
            setSettings((s) => (s ? { ...s, notifyLeadReminders: v } : s))
          }
        />
      </div>

      <FormFooter
        dirty={dirty}
        saving={saving}
        saved={saved}
        error={error}
        onSave={save}
        onReset={reset}
      />
    </Card>
  );
}

function AccountTab({ product }: { product: Product }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDelete = confirmText.trim().toUpperCase() === "DELETE";

  async function handleDelete() {
    if (!canDelete) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/products?id=${product.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "failed");
      router.push("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-ink-900">Account info</h2>
          <p className="mt-0.5 text-xs text-ink-500">
            The product linked to your workspace.
          </p>
        </div>
        <div className="rounded-xl border border-ink-100 p-4">
          <div className="text-xs text-ink-500">Product</div>
          <div className="mt-1 text-sm font-semibold text-ink-900">
            {product.name ?? product.websiteUrl}
          </div>
          <div className="mt-1 text-xs text-ink-500">{product.websiteUrl}</div>
        </div>
      </Card>

      <Card className="border-red-200 bg-red-50/40 p-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600">
            <IconAlert className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-red-700">
              Danger zone
            </h2>
            <p className="mt-0.5 text-xs text-red-600/80">
              This can&apos;t be undone. Your product, tracked subreddits,
              scored posts, leads, and all related data will be permanently
              deleted.
            </p>
          </div>
        </div>

        {!confirmOpen ? (
          <Button
            variant="ghost"
            className="border border-red-300 bg-white text-red-700 hover:bg-red-50"
            onClick={() => setConfirmOpen(true)}
          >
            Delete account
          </Button>
        ) : (
          <div className="space-y-3 rounded-xl border border-red-200 bg-white p-4">
            <p className="text-sm text-ink-700">
              Type{" "}
              <span className="font-semibold text-red-700">DELETE</span> below
              to confirm.
            </p>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.currentTarget.value)}
              placeholder="DELETE"
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setConfirmOpen(false);
                  setConfirmText("");
                  setError(null);
                }}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={!canDelete || deleting}
                loading={deleting}
              >
                Delete permanently
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function ToggleRow({
  icon,
  label,
  helper,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  helper: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-ink-100 p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          {icon}
        </span>
        <div>
          <div className="text-sm font-semibold text-ink-900">{label}</div>
          <div className="mt-0.5 max-w-md text-xs text-ink-500">{helper}</div>
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} aria-label={label} />
    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`block ${full ? "md:col-span-2" : ""}`}>
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function FormFooter({
  dirty,
  saving,
  saved,
  error,
  onSave,
  onReset,
}: {
  dirty: boolean;
  saving: boolean;
  saved: boolean;
  error: string | null;
  onSave: () => void;
  onReset: () => void;
}) {
  return (
    <div className="mt-6 flex items-center justify-end gap-2 border-t border-ink-100 pt-5">
      {error && (
        <span className="mr-auto text-xs text-red-600">{error}</span>
      )}
      {saved && (
        <span className="mr-auto flex items-center gap-1 text-xs font-medium text-brand-600">
          <IconCheck className="h-3.5 w-3.5" />
          Saved
        </span>
      )}
      <Button variant="ghost" onClick={onReset} disabled={!dirty || saving}>
        Discard
      </Button>
      <Button onClick={onSave} loading={saving} disabled={!dirty || saving}>
        Save Changes
      </Button>
    </div>
  );
}

function EmptyShell() {
  return (
    <>
      <Header title="Settings" />
      <main className="flex-1 px-8 py-12">
        <Card className="mx-auto max-w-2xl p-10 text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <IconAlert className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-ink-900">
            No product to configure
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
            Settings are scoped per product. Onboard a product first, then come
            back here to tune targeting.
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
