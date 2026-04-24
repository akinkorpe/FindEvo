import { NextResponse } from "next/server";
import { listForProduct } from "@/repositories/scoredPosts.repo";
import { listTargets } from "@/repositories/subreddits.repo";
import { listSent } from "@/repositories/sentPosts.repo";
import { isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { ok: false, error: "supabase not configured" },
      { status: 503 },
    );
  }
  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");
  if (!productId) {
    return NextResponse.json(
      { ok: false, error: "`productId` required" },
      { status: 400 },
    );
  }
  const subreddit = url.searchParams.get("subreddit") ?? undefined;
  const view = url.searchParams.get("view") ?? "all";
  const minScore = view === "high-intent" ? 70 : 40;

  try {
    const [items, targets, sent] = await Promise.all([
      listForProduct(productId, { subreddit, minScore, limit: 100 }),
      listTargets(productId),
      listSent(productId),
    ]);

    const badgeBySub = new Map<
      string,
      { badge: string | null; summary: string | null }
    >();
    for (const t of targets) {
      badgeBySub.set(t.name.toLowerCase(), {
        badge: t.ruleBadge,
        summary: t.rulesSummary,
      });
    }
    const sentPostIds = new Set(sent.map((s) => s.postId));

    const itemsWithMeta = items.map((it) => {
      const b = badgeBySub.get(it.post.subreddit.toLowerCase());
      return {
        ...it,
        ruleBadge: b?.badge ?? null,
        rulesSummary: b?.summary ?? null,
        sent: sentPostIds.has(it.post.id),
      };
    });

    return NextResponse.json({ ok: true, items: itemsWithMeta });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
