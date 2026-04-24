import { NextResponse } from "next/server";
import {
  getUserSettings,
  updateUserSettings,
} from "@/repositories/userSettings.repo";

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
    const settings = await getUserSettings(productId);
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
      patch?: {
        notifyNewPosts?: boolean;
        notifyLeadReminders?: boolean;
      };
    };
    if (!body.productId) throw new Error("`productId` required");
    const p = body.patch ?? {};
    const settings = await updateUserSettings(body.productId, {
      notifyNewPosts:
        p.notifyNewPosts === undefined ? undefined : Boolean(p.notifyNewPosts),
      notifyLeadReminders:
        p.notifyLeadReminders === undefined
          ? undefined
          : Boolean(p.notifyLeadReminders),
    });
    return NextResponse.json({ ok: true, settings });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
