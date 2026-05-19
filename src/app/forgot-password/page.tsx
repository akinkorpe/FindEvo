"use client";

// "Forgot password?" entry point. User types their email, we ask Supabase
// to send the recovery email, and we swap to a confirmation panel that
// quotes the address back and offers resend + start-over — same UX shape
// as the signup verification panel so the two flows feel symmetric.
//
// Note: Supabase intentionally returns success even when no account exists
// for the email. We mirror that — never tell the caller whether the address
// is registered, just say "if it exists, the link is on its way."

import { useEffect, useState, type FormEvent, type SVGProps } from "react";
import Link from "next/link";
import {
  mapAuthError,
  sendPasswordReset,
  validateEmail,
} from "@/lib/auth";

const RESEND_COOLDOWN_S = 30;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const err = validateEmail(email);
    setEmailError(err);
    if (err) return;
    setSubmitting(true);
    try {
      const { error } = await sendPasswordReset(email);
      if (error) {
        setFormError(mapAuthError(error.message));
        return;
      }
      setSentTo(email.trim());
    } catch (err) {
      setFormError(mapAuthError(err instanceof Error ? err.message : undefined));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-surface">
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10 sm:px-10 sm:py-12">
        {sentTo ? (
          <SentPanel email={sentTo} onStartOver={() => setSentTo(null)} />
        ) : (
          <>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500">
              <KeyIcon className="h-6 w-6" />
            </div>
            <h1 className="mt-5 text-[28px] font-semibold tracking-tight text-ink-900 sm:text-[34px]">
              Reset your password
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-600">
              Enter the email you signed up with. We&apos;ll send you a link to
              choose a new password.
            </p>

            {formError && (
              <div
                role="alert"
                className="mt-6 flex items-start gap-2.5 rounded-2xl border border-danger-500/30 bg-danger-50 px-4 py-3 text-[13.5px] text-danger-500"
              >
                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-5">
              <div>
                <label className="mb-2 block text-[14px] font-medium text-ink-800">
                  Email
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(undefined);
                  }}
                  placeholder="you@company.com"
                  aria-invalid={Boolean(emailError)}
                  disabled={submitting}
                  className={inputCls(Boolean(emailError))}
                />
                {emailError && (
                  <p className="mt-1.5 text-[12.5px] font-medium text-danger-500">
                    {emailError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-brand-500 px-4 py-3.5 text-[15px] font-semibold text-white shadow-card transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Sending…" : "Send reset link"}
              </button>

              <p className="pt-2 text-center text-[13px] text-ink-500">
                Remembered it?{" "}
                <Link
                  href="/signin"
                  className="font-medium text-brand-600 hover:text-brand-700"
                >
                  Back to sign in
                </Link>
              </p>
            </form>
          </>
        )}
      </main>
    </div>
  );
}

function SentPanel({
  email,
  onStartOver,
}: {
  email: string;
  onStartOver: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_S);
  const [sending, setSending] = useState(false);
  const [resentAt, setResentAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  async function handleResend() {
    if (secondsLeft > 0 || sending) return;
    setSending(true);
    setError(null);
    try {
      const { error } = await sendPasswordReset(email);
      if (error) {
        setError(mapAuthError(error.message));
        return;
      }
      setResentAt(Date.now());
      setSecondsLeft(RESEND_COOLDOWN_S);
    } catch (err) {
      setError(mapAuthError(err instanceof Error ? err.message : undefined));
    } finally {
      setSending(false);
    }
  }

  const cooldown = secondsLeft > 0;

  return (
    <div>
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500">
        <MailIcon className="h-6 w-6" />
      </div>
      <h1 className="mt-5 text-[28px] font-semibold tracking-tight text-ink-900 sm:text-[34px]">
        Check your inbox
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-600">
        If <span className="font-medium text-ink-900">{email}</span> matches
        an account, we sent a password reset link there. The link expires in
        1 hour.
      </p>
      <p className="mt-3 text-[13.5px] text-ink-500">
        Can&apos;t find the email? Check your spam or promotions folder.
      </p>

      {resentAt && !error && (
        <div
          role="status"
          className="mt-6 flex items-start gap-2.5 rounded-2xl border border-brand-500/30 bg-brand-50 px-4 py-3 text-[13.5px] text-brand-700"
        >
          <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Reset email sent again.</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-2.5 rounded-2xl border border-danger-500/30 bg-danger-50 px-4 py-3 text-[13.5px] text-danger-500"
        >
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-7 space-y-3">
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown || sending}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-brand-500 px-4 py-3.5 text-[15px] font-semibold text-white shadow-card transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending
            ? "Sending…"
            : cooldown
              ? `Resend in ${secondsLeft}s`
              : "Resend reset email"}
        </button>
        <button
          type="button"
          onClick={onStartOver}
          className="inline-flex w-full items-center justify-center rounded-2xl border border-ink-200 bg-surface px-4 py-3.5 text-[14px] font-medium text-ink-700 transition hover:bg-surface-muted"
        >
          Wrong email? Start over
        </button>
      </div>

      <p className="mt-6 text-center text-[13px] text-ink-500">
        <Link
          href="/signin"
          className="font-medium text-brand-600 hover:text-brand-700"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

function inputCls(hasError: boolean) {
  return (
    "w-full rounded-2xl border bg-surface px-4 py-3.5 text-[15px] text-ink-900 placeholder:text-ink-400 shadow-card transition focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed " +
    (hasError
      ? "border-danger-500/60 focus:border-danger-500 focus:ring-danger-500/15"
      : "border-ink-200 focus:border-brand-500 focus:ring-brand-500/20")
  );
}

function MailIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
      <path d="m22 8-10 6L2 8" />
    </svg>
  );
}

function KeyIcon(props: SVGProps<SVGSVGElement>) {
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
      <circle cx="8" cy="15" r="4" />
      <path d="m21 2-9.6 9.6" />
      <path d="m15.5 7.5 3 3L22 7l-3-3" />
    </svg>
  );
}

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
