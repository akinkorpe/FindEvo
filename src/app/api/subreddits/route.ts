import { NextResponse } from "next/server";
import { addTarget, listTargets, removeTarget } from "@/repositories/subreddits.repo";
import type { SubredditPriority } from "@/types";

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
    const targets = await listTargets(productId);
    return NextResponse.json({ ok: true, targets });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      productId?: string;
      name?: string;
      priority?: SubredditPriority;
    };
    if (!body.productId) throw new Error("`productId` required");
    if (!body.name) throw new Error("`name` required");
    const target = await addTarget(body.productId, body.name, body.priority);
    return NextResponse.json({ ok: true, target });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, error: "`id` required" }, { status: 400 });
  }
  try {
    await removeTarget(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
