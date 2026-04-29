"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase";
import { mapAuthError } from "@/lib/auth";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackShell />}>
      <AuthCallbackInner />
    </Suspense>
  );
}

function AuthCallbackInner() {
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sb = getSupabaseBrowser();

    const errParam = params.get("error_description") ?? params.get("error");
    if (errParam) {
      setError(mapAuthError(errParam));
      return;
    }

    let done = false;
    function go(target: "/" | "/signin") {
      if (done) return;
      done = true;
      // Root '/' product'a göre /dashboard ya da /onboarding'e yönlendiriyor.
      window.location.replace(target);
    }

    // Auth state listener: Supabase URL hash'ini parse edince tetiklenir.
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      if (session) go("/");
    });

    // Sayfada zaten session varsa hemen geç.
    sb.auth.getSession().then(({ data, error: sessErr }) => {
      if (sessErr) {
        setError(mapAuthError(sessErr.message));
        return;
      }
      if (data.session) go("/");
    });

    // 5 sn'de session kurulmadıysa hata göster.
    const timeout = setTimeout(() => {
      if (done) return;
      const hash = window.location.hash;
      const hasToken = hash.includes("access_token");
      setError(
        hasToken
          ? "Token received but the session could not be created. Please refresh."
          : "No token returned from the provider. Please try again.",
      );
    }, 5000);

    return () => {
      clearTimeout(timeout);
      sub.subscription.unsubscribe();
    };
  }, [params]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-6">
      <div className="w-full max-w-sm rounded-2xl border border-ink-100 bg-surface p-8 text-center shadow-card">
        {error ? (
          <>
            <h1 className="text-lg font-semibold text-ink-900">Sign-in failed</h1>
            <p className="mt-2 text-[14px] text-ink-600">{error}</p>
            <a
              href="/signin"
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-ink-800"
            >
              Back to sign in
            </a>
          </>
        ) : (
          <>
            <Spinner />
            <p className="mt-4 text-[14px] text-ink-600">Signing you in…</p>
          </>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span
      role="status"
      aria-label="Loading"
      className="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand-500"
    />
  );
}

function CallbackShell() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-6">
      <div className="w-full max-w-sm rounded-2xl border border-ink-100 bg-surface p-8 text-center shadow-card">
        <Spinner />
        <p className="mt-4 text-[14px] text-ink-600">Signing you in…</p>
      </div>
    </div>
  );
}
