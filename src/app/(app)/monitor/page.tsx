import Header from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { IconDatabase, IconSparkles } from "@/components/ui/Icons";

export const dynamic = "force-dynamic";

export default function MonitorPage() {
  return (
    <>
      <Header title="Reddit Monitor" />
      <main className="flex-1 px-6 py-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <Card className="p-8">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <IconDatabase className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-ink-900">
                    Reddit Monitor
                  </h1>
                  <Badge tone="neutral">Coming soon</Badge>
                </div>
                <p className="mt-2 text-sm text-ink-500">
                  Get notified the moment someone on your tracked subreddits
                  posts about something relevant to you. Every post is reviewed
                  by AI, so only the ones that actually matter land in your
                  Power Feed — no time wasted scrolling.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <IconSparkles className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold text-ink-900">
              Live monitoring is coming soon
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
              We&apos;re building real-time tracking so you can catch potential
              customers on Reddit the moment they show interest. It&apos;ll turn
              on automatically when ready — nothing for you to set up.
            </p>
          </Card>
        </div>
      </main>
    </>
  );
}
