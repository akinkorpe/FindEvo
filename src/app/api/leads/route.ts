import { NextResponse } from "next/server";
import { listLeads, createLead, addInteraction } from "@/repositories/leads.repo";
import { getById as getScored, keepForever } from "@/repositories/scoredPosts.repo";
import { markSent } from "@/repositories/sentPosts.repo";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { LeadStatus } from "@/types";

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
  const status = (url.searchParams.get("status") as LeadStatus | null) ?? undefined;
  try {
    const leads = await listLeads(productId, { status });
    return NextResponse.json({ ok: true, leads });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      productId?: string;
      scoredPostId?: string;
      status?: LeadStatus;
    };
    if (!body.productId) throw new Error("`productId` required");
    if (!body.scoredPostId) throw new Error("`scoredPostId` required");

    const scored = await getScored(body.scoredPostId);
    if (!scored) throw new Error("scored post not found");

    const lead = await createLead({
      productId: body.productId,
      scoredPostId: scored.id,
      redditUsername: scored.post.author || "unknown",
      source: `r/${scored.post.subreddit}`,
      intentLabel: scored.intentScore >= 70 ? "High Intent" : "Exploring",
      status: body.status ?? "new",
      lastSeenAt: scored.post.createdAt,
    });

    await addInteraction(
      lead.id,
      "ai_suggestion",
      scored.reason || "AI flagged this post as a qualified lead.",
    );

    await keepForever(scored.id);

    await markSent({
      productId: body.productId,
      postId: scored.post.id,
      scoredPostId: scored.id,
      kind: "lead",
    }).catch(() => undefined);

    return NextResponse.json({ ok: true, lead });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
