"use client";

import { Suspense, useEffect, useState, type FormEvent, type ReactNode, type SVGProps } from "react";
import { useSearchParams } from "next/navigation";
import {
  hasErrors,
  mapAuthError,
  signInWithGoogle,
  signInWithPassword,
  signUpWithPassword,
  validate,
  type AuthMode,
  type FieldErrors,
} from "@/lib/auth";

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInInner />
    </Suspense>
  );
}

function SignInInner() {
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [tab, setTab] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    const queryError = params.get("error");
    if (queryError) setFormError(mapAuthError(queryError));
  }, [params]);

  function clearMessages() {
    setFormError(null);
    setInfo(null);
  }

  function switchTab(next: AuthMode) {
    setTab(next);
    setErrors({});
    clearMessages();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    clearMessages();

    const fieldErrors = validate(email, password, tab);
    setErrors(fieldErrors);
    if (hasErrors(fieldErrors)) return;

    setSubmitting(true);
    try {
      if (tab === "signin") {
        const { error } = await signInWithPassword(email, password);
        if (error) {
          setFormError(mapAuthError(error.message));
          return;
        }
        window.location.assign(next);
      } else {
        const { data, error } = await signUpWithPassword(email, password);
        if (error) {
          setFormError(mapAuthError(error.message));
          return;
        }
        if (data.session) {
          window.location.assign(next);
        } else {
          setInfo(
            "Account created. Click the verification link we sent to your email.",
          );
        }
      }
    } catch (err) {
      setFormError(mapAuthError(err instanceof Error ? err.message : undefined));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    clearMessages();
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle(next);
      if (error) {
        setFormError(mapAuthError(error.message));
        setGoogleLoading(false);
      }
      // Başarılıysa Google'a yönleniyor; loading'i bırakıyoruz.
    } catch (err) {
      setFormError(mapAuthError(err instanceof Error ? err.message : undefined));
      setGoogleLoading(false);
    }
  }

  const disabled = submitting || googleLoading;

  return (
    <div className="min-h-screen w-full bg-surface lg:grid lg:grid-cols-2">
      {/* SOL — koyu panel */}
      <aside className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0B1F18] via-[#0A1813] to-[#050C09] px-6 py-8 text-white sm:px-10 sm:py-10 lg:min-h-screen lg:px-14 lg:py-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,0.18),transparent_55%)]"
        />
        <div className="relative">
          <Logo />
          <h1 className="mt-8 max-w-xl text-3xl font-semibold leading-[1.1] tracking-tight sm:mt-12 sm:text-[44px] sm:leading-[1.08] lg:text-[52px]">
            Find customers on Reddit — without getting banned.
          </h1>
          <p className="mt-4 max-w-md text-[14px] leading-relaxed text-white/70 sm:mt-6 sm:text-[15px]">
            Join founders using Reddit the right way.
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>
            High-intent signals, organic engagement.
          </p>

          <ul className="mt-6 space-y-3 text-[14px] sm:mt-10 sm:space-y-4 sm:text-[15px]">
            <Bullet>No spam</Bullet>
            <Bullet>No automation abuse</Bullet>
            <Bullet>Built around Reddit rules</Bullet>
          </ul>
        </div>

        <div className="relative mt-8 hidden sm:mt-10 sm:block">
          <RedditPostCard />
        </div>
      </aside>

      {/* RIGHT — light panel */}
      <main className="flex items-center justify-center px-6 py-10 sm:min-h-screen sm:px-10 sm:py-12">
        <div className="w-full max-w-md">
          <h2 className="text-[28px] font-semibold tracking-tight text-ink-900 sm:text-[34px]">
            {tab === "signin" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="mt-2 text-[15px] text-ink-500">
            {tab === "signin"
              ? "Enter your details to continue."
              : "Takes a few seconds — no credit card required."}
          </p>

          {/* Tabs */}
          <div className="mt-8 grid grid-cols-2 rounded-2xl border border-ink-200 bg-ink-100/60 p-1">
            <button
              type="button"
              onClick={() => switchTab("signin")}
              className={
                "rounded-xl px-4 py-2.5 text-sm font-medium transition " +
                (tab === "signin"
                  ? "bg-surface text-ink-900 shadow-card"
                  : "text-ink-500 hover:text-ink-700")
              }
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => switchTab("signup")}
              className={
                "rounded-xl px-4 py-2.5 text-sm font-medium transition " +
                (tab === "signup"
                  ? "bg-surface text-ink-900 shadow-card"
                  : "text-ink-500 hover:text-ink-700")
              }
            >
              Sign up
            </button>
          </div>

          {formError && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-2.5 rounded-2xl border border-danger-500/30 bg-danger-50 px-4 py-3 text-[13.5px] text-danger-500"
            >
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {info && (
            <div
              role="status"
              className="mt-6 flex items-start gap-2.5 rounded-2xl border border-brand-500/30 bg-brand-50 px-4 py-3 text-[13.5px] text-brand-700"
            >
              <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{info}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-5">
            <Field label="Email" error={errors.email}>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                placeholder="you@company.com"
                aria-invalid={Boolean(errors.email)}
                disabled={disabled}
                className={inputCls(Boolean(errors.email))}
              />
            </Field>

            <Field
              label="Password"
              error={errors.password}
              hint={
                tab === "signup" && !errors.password
                  ? "At least 8 characters, with uppercase, lowercase, and a number."
                  : undefined
              }
              right={
                tab === "signin" ? (
                  <a
                    href="#"
                    className="text-[13px] font-medium text-brand-600 hover:text-brand-700"
                  >
                    Forgot password?
                  </a>
                ) : undefined
              }
            >
              <input
                type="password"
                autoComplete={tab === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: undefined });
                }}
                placeholder="••••••••"
                aria-invalid={Boolean(errors.password)}
                disabled={disabled}
                className={inputCls(Boolean(errors.password))}
              />
            </Field>

            <button
              type="submit"
              disabled={disabled}
              className="mt-2 inline-flex w-full items-center justify-center rounded-2xl bg-brand-500 px-4 py-3.5 text-[15px] font-semibold text-white shadow-card transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Please wait…"
                : tab === "signin"
                  ? "Sign in"
                  : "Create account"}
            </button>

            <Divider>OR</Divider>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={disabled}
              className="inline-flex w-full items-center justify-center gap-2.5 rounded-2xl border border-ink-200 bg-surface px-4 py-3.5 text-[15px] font-medium text-ink-900 shadow-card transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              <GoogleIcon className="h-5 w-5" />
              {googleLoading
                ? "Redirecting…"
                : tab === "signin"
                  ? "Sign in with Google"
                  : "Sign up with Google"}
            </button>

            <p className="pt-2 text-center text-[13px] text-ink-500">
              7-day free trial • No credit card required
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}

/* ---------- Subcomponents ---------- */

function inputCls(hasError: boolean) {
  return (
    "w-full rounded-2xl border bg-surface px-4 py-3.5 text-[15px] text-ink-900 placeholder:text-ink-400 shadow-card transition focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed " +
    (hasError
      ? "border-danger-500/60 focus:border-danger-500 focus:ring-danger-500/15"
      : "border-ink-200 focus:border-brand-500 focus:ring-brand-500/20")
  );
}

function Field({
  label,
  right,
  hint,
  error,
  children,
}: {
  label: string;
  right?: ReactNode;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-[14px] font-medium text-ink-800">{label}</label>
        {right}
      </div>
      {children}
      {error ? (
        <p className="mt-1.5 text-[12.5px] font-medium text-danger-500">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[12.5px] text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
}

function Divider({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-1 text-[12px] font-medium tracking-wider text-ink-400">
      <span className="h-px flex-1 bg-ink-200" />
      <span>{children}</span>
      <span className="h-px flex-1 bg-ink-200" />
    </div>
  );
}

function Bullet({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
        <CheckIcon className="h-3 w-3" />
      </span>
      <span className="text-white/90">{children}</span>
    </li>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-card">
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
        </svg>
      </span>
      <span className="font-heading text-[18px] font-semibold tracking-tight text-white">
        RedditLeads
      </span>
    </div>
  );
}

function RedditPostCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0E1B16]/90 p-6 shadow-pop backdrop-blur">
      <span className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-brand-400 to-transparent" />

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-white/70 ring-1 ring-white/10">
            <ChatIcon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[14px] font-medium text-white">r/SaaS</p>
            <p className="text-[12px] text-white/50">Posted 2h ago</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/15 px-3 py-1 text-[12px] font-medium text-brand-300 ring-1 ring-brand-400/30">
          <StarIcon className="h-3 w-3" /> 9/10 Relevance
        </span>
      </div>

      <h3 className="mt-5 text-[17px] font-semibold leading-snug text-white">
        Looking for a tool to track brand mentions without breaking the bank
      </h3>
      <p className="mt-2.5 text-[13.5px] leading-relaxed text-white/60">
        Hey everyone, we&apos;re a small startup and I&apos;m spending too much time
        manually searching for our brand and competitors. We can&apos;t afford
        enterprise tools right now. Any recommendations for something lean…
      </p>

      <div className="mt-6 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-brand-300">
          <ShieldIcon className="h-3.5 w-3.5" />
          Safe to Engage Rule
        </span>
        <button
          type="button"
          className="inline-flex items-center rounded-xl bg-brand-500 px-4 py-2 text-[13px] font-semibold text-white shadow-card transition hover:bg-brand-600"
        >
          Get Approach
        </button>
      </div>
    </div>
  );
}

/* ---------- Icons ---------- */

function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}

function ChatIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function StarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );
}

function ShieldIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" />
    </svg>
  );
}

function AlertIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0Z" />
    </svg>
  );
}

function GoogleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" {...props}>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4.1 5.7l6.2 5.2C41.1 35.6 44 30.2 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}
