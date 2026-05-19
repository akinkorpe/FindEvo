"use client";

// Landing page for the password-reset recovery link. By the time we get
// here the auth/callback route has already exchanged the code for a
// session, so the user is signed in *just enough* to call updateUser
// with a new password.
//
// Edge cases we cover:
//   - User opens this URL directly without a recovery session → tell them
//     the link expired and send them back to /forgot-password.
//   - Successful update → redirect to /dashboard with a one-time success
//     toast (reuses the existing ?upgraded=1 toast component would be
//     overkill; a short success screen + auto-redirect is enough).

import { useEffect, useState, type FormEvent, type SVGProps } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  mapAuthError,
  updatePassword,
  validatePassword,
} from "@/lib/auth";
import { getSupabaseBrowser } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [authState, setAuthState] = useState<"checking" | "ready" | "expired">(
    "checking",
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [matchError, setMatchError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // On mount: confirm we landed here with a valid auth session (the
  // callback route should have set one). Without it, no point showing the
  // form — updateUser would just throw "Auth session missing".
  useEffect(() => {
    const sb = getSupabaseBrowser();
    sb.auth
      .getSession()
      .then(({ data }) => {
        setAuthState(data.session ? "ready" : "expired");
      })
      .catch(() => setAuthState("expired"));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const pwErr = validatePassword(password, "signup");
    setPasswordError(pwErr);
    const mErr = password !== confirm ? "Passwords don't match." : undefined;
    setMatchError(mErr);
    if (pwErr || mErr) return;

    setSubmitting(true);
    try {
      const { error } = await updatePassword(password);
      if (error) {
        setFormError(mapAuthError(error.message));
        return;
      }
      setDone(true);
      // Give the user a beat to read the confirmation, then send them in.
      setTimeout(() => router.replace("/"), 1500);
    } catch (err) {
      setFormError(mapAuthError(err instanceof Error ? err.message : undefined));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-surface">
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10 sm:px-10 sm:py-12">
        {authState === "checking" && (
          <p className="text-center text-[14px] text-ink-500">
            Verifying reset link…
          </p>
        )}

        {authState === "expired" && (
          <div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-50 text-danger-500">
              <AlertIcon className="h-6 w-6" />
            </div>
            <h1 className="mt-5 text-[28px] font-semibold tracking-tight text-ink-900 sm:text-[34px]">
              Link expired
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-600">
              This reset link is no longer valid. They&apos;re single-use and
              expire after one hour. Request a new one to continue.
            </p>
            <Link
              href="/forgot-password"
              className="mt-7 inline-flex w-full items-center justify-center rounded-2xl bg-brand-500 px-4 py-3.5 text-[15px] font-semibold text-white shadow-card transition hover:bg-brand-600"
            >
              Request a new link
            </Link>
          </div>
        )}

        {authState === "ready" && !done && (
          <div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500">
              <KeyIcon className="h-6 w-6" />
            </div>
            <h1 className="mt-5 text-[28px] font-semibold tracking-tight text-ink-900 sm:text-[34px]">
              Choose a new password
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-600">
              Pick something only you know. You&apos;ll stay signed in after
              saving.
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
                  New password
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(undefined);
                  }}
                  placeholder="••••••••"
                  aria-invalid={Boolean(passwordError)}
                  disabled={submitting}
                  className={inputCls(Boolean(passwordError))}
                />
                {passwordError ? (
                  <p className="mt-1.5 text-[12.5px] font-medium text-danger-500">
                    {passwordError}
                  </p>
                ) : (
                  <p className="mt-1.5 text-[12.5px] text-ink-500">
                    At least 8 characters, with uppercase, lowercase, and a
                    number.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-[14px] font-medium text-ink-800">
                  Confirm password
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    if (matchError) setMatchError(undefined);
                  }}
                  placeholder="••••••••"
                  aria-invalid={Boolean(matchError)}
                  disabled={submitting}
                  className={inputCls(Boolean(matchError))}
                />
                {matchError && (
                  <p className="mt-1.5 text-[12.5px] font-medium text-danger-500">
                    {matchError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-brand-500 px-4 py-3.5 text-[15px] font-semibold text-white shadow-card transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Saving…" : "Save new password"}
              </button>
            </form>
          </div>
        )}

        {done && (
          <div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500">
              <CheckIcon className="h-6 w-6" />
            </div>
            <h1 className="mt-5 text-[28px] font-semibold tracking-tight text-ink-900 sm:text-[34px]">
              Password updated
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-600">
              Sending you back to FindEvo…
            </p>
          </div>
        )}
      </main>
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
