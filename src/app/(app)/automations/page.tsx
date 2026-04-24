import Header from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  IconBolt,
  IconChat,
  IconFlame,
  IconMegaphone,
} from "@/components/ui/Icons";

export const dynamic = "force-dynamic";

const RECIPES = [
  {
    icon: <IconFlame className="h-4 w-4" />,
    title: "Auto-add high-intent posts to CRM",
    body: "When intent score ≥ 70 and risk level is safe, create a lead with status = engaged.",
  },
  {
    icon: <IconChat className="h-4 w-4" />,
    title: "Slack ping for urgent leads",
    body: "Post a message to #growth whenever a new lead is marked active pipeline.",
  },
  {
    icon: <IconMegaphone className="h-4 w-4" />,
    title: "Weekly intent digest",
    body: "Email a digest of the top 10 leads of the week every Monday at 9am.",
  },
];

export default function AutomationsPage() {
  return (
    <>
      <Header title="Automations" />
      <main className="flex-1 px-6 py-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <Card className="p-8">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <IconBolt className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-ink-900">
                    Automations
                  </h1>
                  <Badge tone="neutral">Coming soon</Badge>
                </div>
                <p className="mt-2 text-sm text-ink-500">
                  Chain intent signals to outreach. Automations ship after the
                  scoring engine stabilizes.
                </p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {RECIPES.map((r) => (
              <Card key={r.title} className="p-5">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  {r.icon}
                </div>
                <div className="text-sm font-semibold text-ink-900">
                  {r.title}
                </div>
                <p className="mt-1 text-xs text-ink-500">{r.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
