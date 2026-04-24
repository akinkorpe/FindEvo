"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  IconArrowRight,
  IconLink,
  IconSparkles,
  IconCheck,
} from "@/components/ui/Icons";
import type { Product, SurveyAnswers } from "@/types";

type Step = 1 | 2 | 3 | 4;

type SurveyQuestion = {
  key: keyof SurveyAnswers;
  title: string;
  options: { value: string; label: string }[];
};

const SURVEY: SurveyQuestion[] = [
  {
    key: "goal",
    title: "What's your main goal?",
    options: [
      { value: "customers", label: "Find customers" },
      { value: "competitors", label: "Track competitors" },
      { value: "content", label: "Promote content" },
      { value: "community", label: "Grow a community" },
    ],
  },
  {
    key: "audience",
    title: "Who's your audience?",
    options: [
      { value: "b2b", label: "B2B" },
      { value: "b2c", label: "B2C" },
      { value: "both", label: "Both" },
    ],
  },
  {
    key: "current",
    title: "How do you do it today?",
    options: [
      { value: "manual", label: "Manually" },
      { value: "other_tool", label: "Another tool" },
      { value: "none", label: "Not yet" },
    ],
  },
  {
    key: "reach",
    title: "How many people do you want to reach?",
    options: [
      { value: "1-10", label: "1-10" },
      { value: "10-50", label: "10-50" },
      { value: "50+", label: "50+" },
    ],
  },
  {
    key: "reaction",
    title: "What reaction are you hoping for?",
    options: [
      { value: "try", label: "Try the product" },
      { value: "follow", label: "Follow along" },
      { value: "contact", label: "Reach out" },
      { value: "buy", label: "Buy it" },
    ],
  },
  {
    key: "industry",
    title: "What's your industry?",
    options: [
      { value: "saas", label: "SaaS" },
      { value: "ecommerce", label: "E-commerce" },
      { value: "content", label: "Content" },
      { value: "consulting", label: "Consulting" },
      { value: "other", label: "Other" },
    ],
  },
];

export default function OnboardingClient() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [url, setUrl] = useState("");
  const [answers, setAnswers] = useState<Partial<SurveyAnswers>>({});
  const [surveyIdx, setSurveyIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);

  function startSurvey() {
    if (!url.trim()) return;
    setError(null);
    setStep(2);
    setSurveyIdx(0);
  }

  function pickAnswer(value: string) {
    const q = SURVEY[surveyIdx];
    const next: Partial<SurveyAnswers> = { ...answers, [q.key]: value };
    setAnswers(next);
    if (surveyIdx < SURVEY.length - 1) {
      setSurveyIdx(surveyIdx + 1);
    } else {
      void runAnalysis(next as SurveyAnswers);
    }
  }

  function back() {
    if (surveyIdx === 0) {
      setStep(1);
    } else {
      setSurveyIdx(surveyIdx - 1);
    }
  }

  async function runAnalysis(survey: SurveyAnswers) {
    setError(null);
    setLoading(true);
    setStep(3);
    try {
      const res = await fetch("/api/analyze-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, survey }),
      });
      const json = await res.json();
      if (res.status === 429) {
        throw new Error(
          "You've reached your monthly site analysis limit (5/month). You can still access your previous analysis from the dashboard.",
        );
      }
      if (!res.ok) throw new Error(json.error ?? "Analysis failed");
      const p = json.product as Product;

      // Ensure survey answers are persisted even if site analysis did not inline them.
      await fetch("/api/products/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: p.id, answers: survey }),
      }).catch(() => undefined);

      setProduct(p);
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setStep(2);
    } finally {
      setLoading(false);
    }
  }

  const totalSteps = 4;
  const progressStep = step === 2 ? 2 : step;

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center justify-between px-6 pt-5 md:px-10">
        <Logo />
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          Skip Wizard
        </Link>
      </div>

      <div className="flex items-center justify-center gap-2 pt-10">
        {Array.from({ length: totalSteps }).map((_, i) => {
          const s = (i + 1) as Step;
          return (
            <span
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                progressStep === s
                  ? "w-10 bg-brand-500"
                  : progressStep > s
                    ? "w-10 bg-brand-200"
                    : "w-8 bg-ink-200"
              }`}
            />
          );
        })}
      </div>

      <div className="mx-auto max-w-2xl px-6 pt-12 text-center">
        <div className="relative mx-auto mb-10 flex h-24 w-24 items-center justify-center">
          <span className="absolute inset-0 animate-pulse rounded-full bg-brand-100 blur-2xl" />
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-pop ring-1 ring-brand-200">
            <IconSparkles className="h-7 w-7 text-brand-500" />
          </span>
        </div>

        {step === 1 && (
          <>
            <h1 className="text-3xl font-bold tracking-tight text-ink-900 md:text-4xl">
              Where should we start?
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-ink-500">
              Provide a target URL, and our AI will map out the best subreddits
              and keywords for your campaign.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                startSurvey();
              }}
              className="mx-auto mt-8 max-w-xl"
            >
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    sizeVariant="lg"
                    leftIcon={<IconLink className="h-4 w-4" />}
                    placeholder="https://your-product.com"
                    value={url}
                    onChange={(e) => setUrl(e.currentTarget.value)}
                    autoFocus
                  />
                </div>
                <Button
                  size="lg"
                  type="submit"
                  rightIcon={<IconArrowRight className="h-4 w-4" />}
                  disabled={!url.trim()}
                >
                  Continue
                </Button>
              </div>
              {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
            </form>
          </>
        )}

        {step === 2 && (
          <SurveyStep
            idx={surveyIdx}
            total={SURVEY.length}
            question={SURVEY[surveyIdx]}
            value={answers[SURVEY[surveyIdx].key] as string | undefined}
            onPick={pickAnswer}
            onBack={back}
          />
        )}

        {step === 3 && (
          <>
            <h1 className="text-3xl font-bold tracking-tight text-ink-900 md:text-4xl">
              Analyzing your site…
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-ink-500">
              AI is mapping your niche, keywords and matching subreddits.
            </p>
            <div className="mx-auto mt-6 h-1 w-48 overflow-hidden rounded-full bg-ink-100">
              <div className="h-full w-1/2 animate-pulse bg-brand-500" />
            </div>
          </>
        )}

        {step === 4 && product && (
          <>
            <h1 className="text-3xl font-bold tracking-tight text-ink-900 md:text-4xl">
              {product.name ? `Mapped ${product.name}` : "Analysis complete"}
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-ink-500">
              {product.summary ?? "We found your niche and matching subreddits."}
            </p>

            <div className="mx-auto mt-8 max-w-xl">
              <Button
                size="lg"
                rightIcon={<IconArrowRight className="h-4 w-4" />}
                onClick={() => router.push("/dashboard")}
              >
                Go to Dashboard
              </Button>
            </div>
          </>
        )}

        {loading && step === 3 && (
          <p className="mt-6 text-xs text-ink-400">This may take 10–20 seconds.</p>
        )}
        {error && step !== 1 && (
          <p className="mt-3 text-xs text-red-600">{error}</p>
        )}

        <div className="mt-12 grid grid-cols-1 gap-4 text-left md:grid-cols-2">
          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <IconSparkles className="h-3.5 w-3.5" />
              </span>
              Brainstorming Keywords
            </div>
            {step < 4 || !product ? (
              <Skeleton rows={2} />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {product.keywords.length === 0 ? (
                  <span className="text-xs text-ink-400">No keywords yet</span>
                ) : (
                  product.keywords.slice(0, 10).map((k) => (
                    <Badge key={k} tone="brand">
                      {k}
                    </Badge>
                  ))
                )}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <IconCheck className="h-3.5 w-3.5" />
              </span>
              Subreddit Mapping
            </div>
            {step < 4 || !product ? (
              <Skeleton rows={1} chips />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {product.subreddits.length === 0 ? (
                  <span className="text-xs text-ink-400">
                    No subreddits found
                  </span>
                ) : (
                  product.subreddits.slice(0, 8).map((s) => (
                    <span
                      key={s}
                      className="rounded-lg bg-ink-100 px-2 py-1 text-xs text-ink-700"
                    >
                      r/{s}
                    </span>
                  ))
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function SurveyStep({
  idx,
  total,
  question,
  value,
  onPick,
  onBack,
}: {
  idx: number;
  total: number;
  question: SurveyQuestion;
  value: string | undefined;
  onPick: (v: string) => void;
  onBack: () => void;
}) {
  return (
    <>
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-600">
        Question {idx + 1} / {total}
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900 md:text-3xl">
        {question.title}
      </h1>

      <div className="mx-auto mt-8 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
        {question.options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onPick(opt.value)}
              className={`rounded-xl border px-4 py-4 text-left text-sm font-medium transition ${
                active
                  ? "border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-100"
                  : "border-ink-200 bg-white text-ink-800 hover:border-brand-300 hover:bg-brand-50/40"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center gap-2">
        <button
          onClick={onBack}
          className="text-sm font-medium text-ink-500 hover:text-ink-800"
        >
          ← Back
        </button>
      </div>
    </>
  );
}

function Skeleton({ rows = 2, chips = false }: { rows?: number; chips?: boolean }) {
  if (chips) {
    return (
      <div className="flex flex-wrap gap-2">
        <span className="h-6 w-20 animate-pulse rounded-full bg-ink-100" />
        <span className="h-6 w-24 animate-pulse rounded-full bg-ink-100" />
        <span className="h-6 w-16 animate-pulse rounded-full bg-ink-100" />
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-3 w-full animate-pulse rounded bg-ink-100" />
      ))}
      <div className="h-3 w-2/3 animate-pulse rounded bg-ink-100" />
    </div>
  );
}
