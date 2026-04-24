import { NextResponse } from "next/server";
import {
  listProducts,
  getFirstProduct,
  updateProduct,
  deleteProduct,
} from "@/repositories/products.repo";
import { isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase not configured" }, { status: 503 });
  }
  const url = new URL(request.url);
  const first = url.searchParams.get("first");
  try {
    if (first === "1") {
      const product = await getFirstProduct();
      return NextResponse.json({ ok: true, product });
    }
    const products = await listProducts();
    return NextResponse.json({ ok: true, products });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
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
    const product = await updateProduct(body.id, body.patch ?? {});
    return NextResponse.json({ ok: true, product });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) throw new Error("`id` required");
    await deleteProduct(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
