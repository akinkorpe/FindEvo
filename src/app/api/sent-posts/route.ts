import { NextResponse } from "next/server";
import { markSent, listSent } from "@/repositories/sentPosts.repo";
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
  try {
    const items = await listSent(productId);
    return NextResponse.json({ ok: true, items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      productId?: string;
      postId?: string;
      scoredPostId?: string | null;
      kind?: "sent" | "lead";
    };
    if (!body.productId) throw new Error("`productId` required");
    if (!body.postId) throw new Error("`postId` required");
    const item = await markSent({
      productId: body.productId,
      postId: body.postId,
      scoredPostId: body.scoredPostId ?? null,
      kind: body.kind ?? "sent",
    });
    return NextResponse.json({ ok: true, item });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
