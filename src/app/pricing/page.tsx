import Link from "next/link";
import type { ReactNode, SVGProps } from "react";
import { Wordmark } from "@/components/brand/Wordmark";
import { PLANS, type Plan, type PlanKey } from "@/lib/plans";
import { PlanCheckoutButton } from "./PlanCheckoutButton";

// A plan is "sellable" when its monthly variant ID is configured in env.
// Plans without a variant render a "Coming soon" button instead of trying
// to create a checkout that would fail server-side anyway.
const SELLABLE_PLANS: Record<PlanKey, boolean> = {
  starter: !!process.env.LEMONSQUEEZY_VARIANT_STARTER_MONTHLY,
  growth: !!process.env.LEMONSQUEEZY_VARIANT_GROWTH_MONTHLY,
  pro: !!process.env.LEMONSQUEEZY_VARIANT_PRO_MONTHLY,
};

export const metadata = {
  title: "Pricing — FindEvo",
  description:
    "Simple pricing for Reddit lead generation. Starter, Growth, and Pro plans — pick the tier that matches the niche you're working.",
};

// Render order. Growth gets the "Most popular" treatment because it's the
// price-point with the best margin on hosted AI calls; Starter and Pro
// bracket it.
const PLAN_ORDER: PlanKey[] = ["starter", "growth", "pro"];

interface FeatureRow {
  label: string;
  /** Returned string is what shows in each plan column. `true` renders a check, `false` an em-dash. */
  value: (p: Plan) => string | boolean;
}

// Single source of truth for the comparison table. Order matters — most
// load-bearing limit first, secondary features below.
const FEATURE_ROWS: FeatureRow[] = [
  { label: "Tracked subreddits", value: (p) => p.limits.subreddits >= 999 ? "Unlimited" : `${p.limits.subreddits}` },
  { label: "Post intent scores / day", value: (p) => `${p.limits.post_score_daily}` },
  { label: "Approach guides / day", value: (p) => `${p.limits.approach_guide_daily}` },
  { label: "Site analyses / month", value: (p) => `${p.limits.site_analysis_monthly}` },
  { label: "Email support", value: () => true },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-surface text-ink-900">
      <Nav />
      <Hero />
      <PlanGrid />
      <ComparisonTable />
      <Faq />
      <Footer />
    </div>
  );
}

/* ---------- Nav ---------- */

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-100/70 bg-surface/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6">
        <Link href="/landing" className="flex items-center gap-2">
          <Wordmark className="text-[18px]" />
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-ink-600 md:flex">
          <Link href="/landing#how" className="hover:text-ink-900">How it works</Link>
          <Link href="/landing#features" className="hover:text-ink-900">Features</Link>
          <Link href="/pricing" className="font-medium text-ink-900">Pricing</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/signin"
            className="hidden text-sm font-medium text-ink-700 hover:text-ink-900 sm:inline-flex"
          >
            Sign in
          </Link>
          <Link href="/signin" className={btnPrimary}>
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ---------- Hero ---------- */

function Hero() {
  return (
    <section className="mx-auto max-w-3xl px-4 pt-14 text-center sm:px-6 sm:pt-20">
      <Eyebrow>
        <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-brand-500" />
        Pricing
      </Eyebrow>
      <h1 className="mt-5 text-3xl font-semibold leading-[1.1] tracking-tight text-ink-900 sm:mt-6 sm:text-5xl sm:leading-[1.05]">
        Pick the tier that matches your niche.
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-600 sm:mt-6 sm:text-lg">
        No seat fees, no per-post pricing, no surprise overage charges. Every
        plan includes intent scoring, approach guides, and subreddit rule
        intelligence — limits just scale with the volume you actually need.
      </p>
    </section>
  );
}

/* ---------- Plan cards ---------- */

function PlanGrid() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
        {PLAN_ORDER.map((key) => (
          <PlanCard
            key={key}
            plan={PLANS[key]}
            highlighted={key === "growth"}
            sellable={SELLABLE_PLANS[key]}
          />
        ))}
      </div>
      <p className="mt-6 text-center text-xs text-ink-500">
        Prices in USD. Annual billing coming soon — switch any time.
      </p>
    </section>
  );
}

function PlanCard({
  plan,
  highlighted,
  sellable,
}: {
  plan: Plan;
  highlighted: boolean;
  sellable: boolean;
}) {
  const bullets: string[] = [
    plan.limits.subreddits >= 999
      ? "Unlimited tracked subreddits"
      : `${plan.limits.subreddits} tracked subreddits`,
    `${plan.limits.post_score_daily} post intent scores / day`,
    `${plan.limits.approach_guide_daily} approach guides / day`,
    `${plan.limits.site_analysis_monthly} site analyses / month`,
  ];

  return (
    <div
      className={
        "relative flex flex-col rounded-2xl border bg-surface p-6 sm:p-7 " +
        (highlighted
          ? "border-brand-300 shadow-card ring-1 ring-brand-200"
          : "border-ink-100")
      }
    >
      {highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white shadow-pop">
          Most popular
        </span>
      )}

      <div>
        <h2 className="text-base font-semibold text-ink-900">{plan.name}</h2>
        <p className="mt-1 min-h-[2.5rem] text-sm text-ink-500">{plan.tagline}</p>
      </div>

      <div className="mt-5 flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tight text-ink-900">
          ${plan.priceUsd}
        </span>
        <span className="text-sm text-ink-500">/ month</span>
      </div>

      <PlanCheckoutButton
        plan={plan.key}
        sellable={sellable}
        variant={highlighted ? "primary" : "ghost"}
      />

      <ul className="mt-6 space-y-2.5 text-sm text-ink-700">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Comparison table ---------- */

function ComparisonTable() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 sm:pb-20">
      <h2 className="mb-5 text-center text-xl font-semibold text-ink-900 sm:text-2xl">
        Compare plans
      </h2>
      <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-surface">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-surface-muted/60 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              <th className="px-5 py-3">Feature</th>
              {PLAN_ORDER.map((key) => (
                <th key={key} className="px-5 py-3">
                  {PLANS[key].name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FEATURE_ROWS.map((row, i) => (
              <tr
                key={row.label}
                className={i < FEATURE_ROWS.length - 1 ? "border-b border-ink-100" : ""}
              >
                <td className="px-5 py-3 text-ink-700">{row.label}</td>
                {PLAN_ORDER.map((key) => {
                  const v = row.value(PLANS[key]);
                  return (
                    <td key={key} className="px-5 py-3 text-ink-800">
                      {typeof v === "boolean" ? (
                        v ? (
                          <CheckIcon className="h-4 w-4 text-brand-600" />
                        ) : (
                          <span className="text-ink-300">—</span>
                        )
                      ) : (
                        v
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ---------- FAQ ---------- */

function Faq() {
  const items: Array<{ q: string; a: string }> = [
    {
      q: "What happens if I hit my daily limit?",
      a: "The product keeps working — scoring just pauses for that kind until the next day. We show an in-app banner with the option to upgrade to the next tier, which raises the cap immediately.",
    },
    {
      q: "When does paid billing go live?",
      a: "We're in beta. Every account is on the Starter tier today, no card required. Paid plans launch with our public release — when they do, upgrades will take effect immediately and downgrades at the end of the current billing period.",
    },
    {
      q: "Is there a free plan?",
      a: "Starter is the free-tier baseline for the beta. After the beta we'll likely require a card, but anyone already on Starter today keeps their access at the same limits.",
    },
  ];
  return (
    <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 sm:pb-24">
      <h2 className="mb-5 text-center text-xl font-semibold text-ink-900 sm:text-2xl">
        Frequently asked
      </h2>
      <div className="space-y-3">
        {items.map(({ q, a }) => (
          <details
            key={q}
            className="group rounded-xl border border-ink-100 bg-surface p-4 open:shadow-card sm:p-5"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-medium text-ink-900 [&::-webkit-details-marker]:hidden">
              {q}
              <ChevronIcon className="h-4 w-4 shrink-0 text-ink-400 transition group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-ink-600">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/* ---------- Footer ---------- */

function Footer() {
  return (
    <footer className="border-t border-ink-100 bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 sm:py-10">
        <div className="flex items-center gap-2">
          <Wordmark className="text-[15px]" />
        </div>
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-500">
          <Link href="/landing#features" className="hover:text-ink-900">Product</Link>
          <Link href="/pricing" className="hover:text-ink-900">Pricing</Link>
          <Link href="/privacy" className="hover:text-ink-900">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-ink-900">Terms of Service</Link>
          <a href="mailto:contact@findevo.com" className="hover:text-ink-900">Contact</a>
        </nav>
        <p className="text-xs text-ink-400">© {new Date().getFullYear()} FindEvo</p>
      </div>
    </footer>
  );
}

/* ---------- Shared atoms ---------- */

const btnPrimary =
  "inline-flex items-center gap-1.5 rounded-xl bg-ink-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-ink-800 active:bg-ink-900";

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-ink-100 bg-surface px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-ink-600">
      {children}
    </span>
  );
}

function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}

function ChevronIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
