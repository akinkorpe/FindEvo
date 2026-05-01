import { NextResponse } from "next/server";
import {
  listProducts,
  getFirstProduct,
  getProduct,
  updateProduct,
  deleteProduct,
} from "@/repositories/products.repo";
import { isSupabaseConfigured } from "@/lib/supabase";
import { requireUser, UnauthorizedError } from "../_auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(err: unknown, fallbackStatus = 500) {
  if (err instanceof UnauthorizedError) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 401 });
  }
  const message = err instanceof Error ? err.message : "error";
  return NextResponse.json({ ok: false, error: message }, { status: fallbackStatus });
}

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase not configured" }, { status: 503 });
  }
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const first = url.searchParams.get("first");
    if (first === "1") {
      const product = await getFirstProduct(user.id);
      return NextResponse.json({ ok: true, product });
    }
    const products = await listProducts(user.id);
    return NextResponse.json({ ok: true, products });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = (await request.json()) as {
      id?: string;
      patch?: {
        name?: string;
        niche?: string;
        summary?: string;
        keywords?: string[];
        subreddits?: string[];
      };
    };
    if (!body.id) throw new Error("`id` required");
    const owned = await getProduct(body.id, user.id);
    if (!owned) throw new Error("product not found");
    const product = await updateProduct(body.id, body.patch ?? {});
    return NextResponse.json({ ok: true, product });
  } catch (err) {
    return errorResponse(err, 400);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) throw new Error("`id` required");
    const owned = await getProduct(id, user.id);
    if (!owned) throw new Error("product not found");
    await deleteProduct(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err, 400);
  }
}
