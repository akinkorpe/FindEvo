import Link from "next/link";
import type { ReactNode, SVGProps } from "react";
import { PrivacyPolicyTrigger } from "@/components/legal/PrivacyPolicyTrigger";
import { Wordmark } from "@/components/brand/Wordmark";

export const metadata = {
  title: "FindEvo — Find customers on Reddit without getting banned",
  description:
    "Discover high-intent posts, understand subreddit rules, and respond like a human. Not an AI spam tool.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface text-ink-900">
      <Nav />
      <Hero />
      <HowItWorks />
      <Features />
      <ProductPreview />
      <FinalCta />
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
          <a href="#how" className="hover:text-ink-900">How it works</a>
          <a href="#features" className="hover:text-ink-900">Features</a>
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
    <section className="relative overflow-hidden">
      <BgGlow />
      <div className="mx-auto max-w-6xl px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-24 lg:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-brand-500" />
            New: Semantic intent scoring
          </Eyebrow>
          <h1 className="mt-5 text-3xl font-semibold leading-[1.1] tracking-tight text-ink-900 sm:mt-6 sm:text-5xl sm:leading-[1.05] lg:text-6xl">
            Find the right people on Reddit.
            <br />
            <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
              Grow with authentic conversations.
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-600 sm:mt-6 sm:text-lg">
            Not another AI spam tool. FindEvo surfaces buying-intent threads,
            reads each subreddit&apos;s rules, and helps you respond like a human —
            so you grow without burning karma.
          </p>
          <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:mt-9 sm:flex-row sm:items-center">
            <Link href="/signin" className={btnPrimary + " justify-center px-6 py-3 text-base"}>
              Start free — no card
              <ArrowIcon className="ml-1.5 h-4 w-4" />
            </Link>
            <a href="#features" className={btnGhost + " justify-center px-6 py-3 text-base"}>
              See the product
            </a>
          </div>
        </div>

        <div className="relative mx-auto mt-10 max-w-5xl sm:mt-16">
          <div className="absolute -inset-x-8 -top-8 -z-10 h-72 rounded-[2rem] bg-gradient-to-b from-brand-100/60 to-transparent blur-2xl" />
          <FeedMock />
        </div>
      </div>
    </section>
  );
}

/* ---------- How it works ---------- */

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Track keywords",
      body: "Add the phrases your customers actually type. We monitor every subreddit, 24/7.",
    },
    {
      n: "02",
      title: "Score intent",
      body: "Our model reads between the lines — separating buyers from browsers in milliseconds.",
    },
    {
      n: "03",
      title: "Reply like a human",
      body: "We surface the rules, mod history, and tone. You write the comment. No AI ghostwriting.",
    },
  ];
  return (
    <section id="how" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <SectionHeader
        eyebrow="How it works"
        title="Three steps. No spam. No bans."
        sub="From keyword to conversation in under a minute."
      />
      <ol className="mt-14 grid gap-6 md:grid-cols-3">
        {steps.map((s, i) => (
          <li
            key={s.n}
            className="relative rounded-2xl border border-ink-100 bg-surface p-7 shadow-card"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold tracking-wider text-brand-600">
                {s.n}
              </span>
              <span className="h-px flex-1 bg-gradient-to-r from-brand-200 to-transparent" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-ink-900">{s.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-600">{s.body}</p>
            {i < steps.length - 1 && (
              <ArrowIcon className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-ink-300 md:block" />
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ---------- Features ---------- */

function Features() {
  return (
    <section id="features" className="bg-surface-muted/50 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow="Features"
          title="Built around how Reddit actually works"
          sub="Every subreddit has its own laws. We learn them so you don't get banned learning them yourself."
        />
        <div className="mt-14 grid gap-6 lg:grid-cols-12">
          <FeatureCard
            className="lg:col-span-7"
            icon={<TargetIcon className="h-5 w-5" />}
            title="Semantic intent scoring"
            body="Stop wading through 'what's your favorite tool?' threads. We rank posts by genuine buying intent — not keyword density."
            visual={<IntentVisual />}
          />
          <FeatureCard
            className="lg:col-span-5"
            icon={<ShieldIcon className="h-5 w-5" />}
            title="Subreddit rule detection"
            body="We read the sidebar, parse pinned mod posts, and flag self-promo policy before you comment."
            visual={<RulesVisual />}
          />
          <FeatureCard
            className="lg:col-span-12"
            icon={<PenIcon className="h-5 w-5" />}
            title="Approach drafts, not auto-comments"
            body="We give you angles, talking points, and tone — never a finished comment. You stay in your voice."
            visual={<ApproachVisual />}
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  body,
  visual,
  className = "",
}: {
  icon: ReactNode;
  title: string;
  body: string;
  visual: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        "group relative overflow-hidden rounded-2xl border border-ink-100 bg-surface p-7 shadow-card transition hover:shadow-pop " +
        className
      }
    >
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          {icon}
        </span>
        <span className="text-xs font-medium uppercase tracking-wider text-ink-500">
          {title.split(" ").slice(0, 2).join(" ")}
        </span>
      </div>
      <h3 className="mt-4 text-xl font-semibold tracking-tight text-ink-900">
        {title}
      </h3>
      <p className="mt-2 max-w-md text-[15px] leading-relaxed text-ink-600">{body}</p>
      <div className="mt-7">{visual}</div>
    </div>
  );
}

/* ---------- Product preview ---------- */

function ProductPreview() {
  return (
    <section className="bg-gradient-to-b from-surface-muted/40 to-surface py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow="The product"
          title="A workspace for organic growth"
          sub="Triage threads. Track conversations. Keep your accounts clean."
        />
        <div className="mt-14 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <KanbanMock />
          </div>
          <div className="grid gap-6 lg:col-span-5">
            <RuleCardMock />
            <ApproachCardMock />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Final CTA ---------- */

function FinalCta() {
  return (
    <section className="px-4 pb-16 pt-4 sm:px-6 sm:pb-24 sm:pt-8">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-ink-900 px-6 py-12 text-center shadow-pop sm:px-8 sm:py-16 lg:px-16">
        <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.25),_transparent_60%)]" />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Stop spamming. Start showing up.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-ink-300 sm:mt-5 sm:text-lg">
            Your next 100 customers are already on Reddit, asking for what you sell.
            Find them — without burning your account.
          </p>
          <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:mt-9 sm:flex-row sm:items-center">
            <Link
              href="/signin"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white px-6 py-3 text-base font-medium text-ink-900 transition hover:bg-ink-100"
            >
              Start free
              <ArrowIcon className="h-4 w-4" />
            </Link>
            <a
              href="#how"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3 text-base font-medium text-white transition hover:bg-white/10"
            >
              How it works
            </a>
          </div>
        </div>
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
          <a href="#features" className="hover:text-ink-900">Product</a>
          <PrivacyPolicyTrigger className="hover:text-ink-900" variant="privacy" />
          <PrivacyPolicyTrigger className="hover:text-ink-900" variant="terms" />
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

const btnGhost =
  "inline-flex items-center gap-1.5 rounded-xl border border-ink-200 bg-surface px-4 py-2 text-sm font-medium text-ink-900 transition hover:border-ink-300 hover:bg-surface-muted";

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-ink-100 bg-surface px-3 py-1 text-xs font-medium text-ink-700 shadow-card">
      {children}
    </span>
  );
}

function SectionHeader({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-[17px] leading-relaxed text-ink-600">{sub}</p>
    </div>
  );
}

function BgGlow() {
  return (
    <>
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[520px] w-[1100px] -translate-x-1/2 rounded-full bg-gradient-to-b from-brand-100/70 via-brand-50/40 to-transparent blur-3xl" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_50%_-10%,rgba(16,185,129,0.10),transparent_60%)]"
      />
    </>
  );
}

/* ---------- Mocks: Hero feed ---------- */

function FeedMock() {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-100 bg-surface shadow-pop">
      <div className="flex items-center gap-2 border-b border-ink-100 bg-surface-muted/60 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-ink-200" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink-200" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink-200" />
        <div className="ml-3 text-xs font-medium text-ink-500">FindEvo · Feed</div>
      </div>
      <div className="grid grid-cols-12 divide-x divide-ink-100">
        <aside className="col-span-12 p-4 sm:col-span-4 lg:col-span-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
            Keywords
          </p>
          <ul className="mt-3 space-y-1">
            <SidebarItem label="SaaS pricing" active count={12} />
            <SidebarItem label="Lead gen tools" count={5} />
            <SidebarItem label="Cold outreach" count={3} />
            <SidebarItem label="Reddit marketing" count={8} />
          </ul>
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
            Filters
          </p>
          <ul className="mt-3 space-y-1.5 text-[13px] text-ink-600">
            <li className="flex items-center justify-between">
              <span>Intent ≥ 8</span>
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
                ON
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span>Self-promo allowed</span>
              <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-500">
                ANY
              </span>
            </li>
          </ul>
        </aside>
        <div className="col-span-12 p-4 sm:col-span-8 lg:col-span-9">
          <FeedItem
            sub="r/SaaS"
            time="2h"
            intent={9.5}
            title="Looking for a tool to find leads organically — without ads"
            body="Tired of pouring money into Google Ads. Anyone have a workflow for finding relevant conversations where I can genuinely add value?"
            allowed
          />
          <FeedItem
            sub="r/Entrepreneur"
            time="4h"
            intent={8.7}
            title="What's everyone using to monitor brand mentions on Reddit?"
            body="Need something that doesn't just keyword-match. Context matters."
            allowed
          />
          <FeedItem
            sub="r/marketing"
            time="6h"
            intent={5.2}
            title="Reddit marketing tips for B2B?"
            body="Looking for a general overview, not specific tools."
          />
        </div>
      </div>
    </div>
  );
}

function SidebarItem({ label, count, active }: { label: string; count: number; active?: boolean }) {
  return (
    <li
      className={
        "flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[13px] " +
        (active ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-surface-muted")
      }
    >
      <span className="flex items-center gap-2">
        <SearchIcon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className="text-[11px] text-ink-400">{count}</span>
    </li>
  );
}

function FeedItem({
  sub,
  time,
  intent,
  title,
  body,
  allowed = false,
}: {
  sub: string;
  time: string;
  intent: number;
  title: string;
  body: string;
  allowed?: boolean;
}) {
  const high = intent >= 7;
  return (
    <article className="border-b border-ink-100 py-4 last:border-b-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-ink-500">
          <span className="font-medium text-ink-700">{sub}</span>
          <span>·</span>
          <span>{time}</span>
        </div>
        <span
          className={
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium " +
            (high ? "bg-brand-50 text-brand-700" : "bg-ink-100 text-ink-500")
          }
        >
          <SparkIcon className="h-3 w-3" />
          Intent {intent.toFixed(1)}
        </span>
      </div>
      <h4 className="mt-2 text-[15px] font-semibold text-ink-900">{title}</h4>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-600">{body}</p>
      <div className="mt-3 flex items-center justify-between">
        {allowed ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-700">
            <CheckIcon className="h-3 w-3" /> Self-promo allowed in comments
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-400">
            <ShieldIcon className="h-3 w-3" /> Strict no-promo
          </span>
        )}
        <button className="rounded-lg bg-ink-900 px-3 py-1.5 text-[12px] font-medium text-white transition hover:bg-ink-800">
          Get approach
        </button>
      </div>
    </article>
  );
}

/* ---------- Mocks: Feature visuals ---------- */

function IntentVisual() {
  const items = [
    { label: "High intent match", value: 9.5 },
    { label: "Buying signal", value: 8.2 },
    { label: "Research phase", value: 5.2 },
    { label: "Off-topic", value: 2.1 },
  ];
  return (
    <div className="rounded-xl border border-ink-100 bg-surface-muted/50 p-4">
      <ul className="space-y-2.5">
        {items.map((it) => (
          <li key={it.label} className="flex items-center gap-3">
            <span
              className={
                "h-1.5 w-1.5 rounded-full " +
                (it.value >= 7 ? "bg-brand-500" : it.value >= 4 ? "bg-warning-500" : "bg-ink-300")
              }
            />
            <span className="flex-1 text-sm text-ink-700">{it.label}</span>
            <span className="w-32 overflow-hidden rounded-full bg-ink-100">
              <span
                className={
                  "block h-1.5 rounded-full " +
                  (it.value >= 7
                    ? "bg-gradient-to-r from-brand-500 to-brand-400"
                    : "bg-ink-300")
                }
                style={{ width: `${it.value * 10}%` }}
              />
            </span>
            <span className="w-10 text-right text-xs font-medium tabular-nums text-ink-600">
              {it.value.toFixed(1)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RulesVisual() {
  return (
    <div className="space-y-2">
      <RuleRow ok label="Self-promo allowed in dedicated threads" />
      <RuleRow label="No links in top-level comments" warning />
      <RuleRow label="Account age ≥ 90 days" warning />
      <RuleRow ok label="Karma ≥ 100" />
    </div>
  );
}

function RuleRow({ label, ok, warning }: { label: string; ok?: boolean; warning?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-ink-100 bg-surface px-3 py-2">
      {ok ? (
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <CheckIcon className="h-3 w-3" />
        </span>
      ) : warning ? (
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-warning-50 text-warning-500">
          <AlertIcon className="h-3 w-3" />
        </span>
      ) : (
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-ink-100 text-ink-400">
          <XIcon className="h-3 w-3" />
        </span>
      )}
      <span className="text-[13px] text-ink-700">{label}</span>
    </div>
  );
}

function ApproachVisual() {
  return (
    <div className="rounded-xl border border-ink-100 bg-surface p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
        Suggested angles
      </p>
      <ul className="mt-3 space-y-2 text-[13px] text-ink-700">
        <li className="flex gap-2">
          <span className="text-brand-600">·</span>
          <span>Lead with the problem they described — don&apos;t mention your product first.</span>
        </li>
        <li className="flex gap-2">
          <span className="text-brand-600">·</span>
          <span>Reference a specific paragraph from their post.</span>
        </li>
        <li className="flex gap-2">
          <span className="text-brand-600">·</span>
          <span>Mention FindEvo only if asked — this sub bans top-level promo.</span>
        </li>
      </ul>
      <div className="mt-4 rounded-lg border border-dashed border-ink-200 bg-surface-muted/50 p-3 text-[12px] italic text-ink-500">
        Your draft starts here. We don&apos;t auto-write comments.
      </div>
    </div>
  );
}

/* ---------- Mocks: Product preview ---------- */

function KanbanMock() {
  const cols = [
    {
      title: "New",
      tag: "bg-ink-100 text-ink-600",
      items: [
        { sub: "r/SaaS", body: "Looking for organic lead gen tool", intent: 9.5 },
        { sub: "r/Entrepreneur", body: "Brand monitoring on Reddit?", intent: 8.7 },
      ],
    },
    {
      title: "Drafting",
      tag: "bg-warning-50 text-warning-500",
      items: [
        { sub: "r/marketing", body: "Best B2B Reddit playbooks", intent: 7.4 },
      ],
    },
    {
      title: "Posted",
      tag: "bg-brand-50 text-brand-700",
      items: [
        { sub: "r/startups", body: "Cold outreach alternatives", intent: 8.1 },
        { sub: "r/SaaS", body: "Pricing page critique", intent: 7.8 },
      ],
    },
  ];
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-100 bg-surface shadow-card">
      <div className="flex items-center justify-between border-b border-ink-100 bg-surface-muted/60 px-5 py-3">
        <span className="text-sm font-semibold text-ink-800">Pipeline</span>
        <span className="text-xs text-ink-500">5 conversations this week</span>
      </div>
      <div className="grid grid-cols-3 gap-4 p-4">
        {cols.map((c) => (
          <div key={c.title}>
            <div className="mb-3 flex items-center justify-between">
              <span className={"rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider " + c.tag}>
                {c.title}
              </span>
              <span className="text-[11px] text-ink-400">{c.items.length}</span>
            </div>
            <div className="space-y-2.5">
              {c.items.map((it, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-ink-100 bg-surface p-3 shadow-card"
                >
                  <div className="flex items-center justify-between text-[11px] text-ink-500">
                    <span className="font-medium text-ink-700">{it.sub}</span>
                    <span className="rounded-full bg-brand-50 px-1.5 py-0.5 font-medium text-brand-700">
                      {it.intent.toFixed(1)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-snug text-ink-800">{it.body}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RuleCardMock() {
  return (
    <div className="rounded-2xl border border-ink-100 bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <ShieldIcon className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold text-ink-900">r/SaaS rules</span>
        </div>
        <span className="text-[11px] text-ink-500">Updated 2d ago</span>
      </div>
      <ul className="mt-4 space-y-1.5">
        <RuleRow ok label="Self-promo on Saturdays only" />
        <RuleRow warning label="No links in top-level comments" />
        <RuleRow ok label="Disclose affiliation" />
      </ul>
    </div>
  );
}

function ApproachCardMock() {
  return (
    <div className="rounded-2xl border border-ink-100 bg-surface p-5 shadow-card">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <PenIcon className="h-4 w-4" />
        </span>
        <span className="text-sm font-semibold text-ink-900">Approach</span>
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-ink-600">
        Acknowledge their ad fatigue. Share one tactic that worked for you, not a product pitch.
        Mention the tool only if they ask in a reply.
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Tag>Empathetic</Tag>
        <Tag>Specific</Tag>
        <Tag>No links</Tag>
      </div>
    </div>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-ink-100 bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-ink-600">
      {children}
    </span>
  );
}

/* ---------- Icons ---------- */

function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      className={
        "inline-flex items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-card " +
        className
      }
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-3/5 w-3/5" aria-hidden>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="3" fill="currentColor" />
      </svg>
    </span>
  );
}

function ArrowIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}
function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}
function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 6l12 12M6 18L18 6" />
    </svg>
  );
}
function TargetIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}
function ShieldIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" />
    </svg>
  );
}
function PenIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}
function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}
function SparkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
    </svg>
  );
}
function AlertIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0Z" />
    </svg>
  );
}
