import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/repositories/settings.repo";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");
  if (!productId) {
    return NextResponse.json(
      { ok: false, error: "`productId` required" },
      { status: 400 },
    );
  }
  try {
    const settings = await getSettings(productId);
    return NextResponse.json({ ok: true, settings });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      productId?: string;
      patch?: Record<string, unknown>;
    };
    if (!body.productId) throw new Error("`productId` required");

    const typed = body.patch ?? {};
    const settings = await updateSettings(body.productId, {
      strictProfanityFilter:
        typed.strictProfanityFilter === undefined
          ? undefined
          : Boolean(typed.strictProfanityFilter),
      requireCompetitorMention:
        typed.requireCompetitorMention === undefined
          ? undefined
          : Boolean(typed.requireCompetitorMention),
      minAuthorKarma:
        typeof typed.minAuthorKarma === "number"
          ? typed.minAuthorKarma
          : undefined,
      maxPostAgeHours:
        typeof typed.maxPostAgeHours === "number"
          ? typed.maxPostAgeHours
          : undefined,
    });
    return NextResponse.json({ ok: true, settings });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
