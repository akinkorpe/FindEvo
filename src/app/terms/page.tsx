import Link from "next/link";
import { TermsContent } from "@/components/legal/TermsContent";
import { Wordmark } from "@/components/brand/Wordmark";

export const metadata = {
  title: "Terms of Service — FindEvo",
  description: "The terms governing your use of FindEvo.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface text-ink-900">
      <header className="sticky top-0 z-40 border-b border-ink-100/70 bg-surface/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:h-16 sm:px-6">
          <Link href="/landing" className="flex items-center gap-2">
            <Wordmark className="text-[18px]" />
          </Link>
          <Link
            href="/landing"
            className="text-sm font-medium text-ink-600 hover:text-ink-900"
          >
            ← Home
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <TermsContent />
      </main>
    </div>
  );
}
