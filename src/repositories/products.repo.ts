import { getSupabaseServer } from "@/lib/supabase";
import { mapProduct } from "./mappers";
import type { Product, ProductAnalysis, SurveyAnswers } from "@/types";

export async function listProducts(ownerId?: string): Promise<Product[]> {
  let q = getSupabaseServer()
    .from("products")
    .select("*")
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false });
  if (ownerId) q = q.eq("owner_id", ownerId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

export async function getProduct(
  id: string,
  ownerId?: string,
): Promise<Product | null> {
  let q = getSupabaseServer().from("products").select("*").eq("id", id);
  if (ownerId) q = q.eq("owner_id", ownerId);
  const { data, error } = await q.maybeSingle();
  if (error) throw error;
  return data ? mapProduct(data) : null;
}

export async function getFirstProduct(ownerId?: string): Promise<Product | null> {
  let q = getSupabaseServer()
    .from("products")
    .select("*")
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1);
  if (ownerId) q = q.eq("owner_id", ownerId);
  const { data, error } = await q.maybeSingle();
  if (error) throw error;
  return data ? mapProduct(data) : null;
}

export async function upsertProductFromAnalysis(
  analysis: ProductAnalysis,
  ownerId: string,
): Promise<Product> {
  const sb = getSupabaseServer();
  // Match on (owner, url) so two users analyzing the same site each get
  // their own product row.
  const { data: existing } = await sb
    .from("products")
    .select("id")
    .eq("owner_id", ownerId)
    .eq("website_url", analysis.websiteUrl)
    .maybeSingle();

  const payload = {
    website_url: analysis.websiteUrl,
    name: analysis.name,
    niche: analysis.niche,
    summary: analysis.summary,
    buyer_persona: analysis.buyerPersona,
    keywords: analysis.keywords,
    subreddits: analysis.subreddits,
    owner_id: ownerId,
  };

  const { data, error } = existing
    ? await sb
        .from("products")
        .update(payload)
        .eq("id", existing.id)
        .select("*")
        .single()
    : await sb.from("products").insert(payload).select("*").single();

  if (error) throw error;
  return mapProduct(data);
}

export async function updateProduct(
  id: string,
  patch: Partial<Pick<Product, "name" | "niche" | "summary" | "keywords" | "subreddits">>,
): Promise<Product> {
  const { data, error } = await getSupabaseServer()
    .from("products")
    .update({
      name: patch.name,
      niche: patch.niche,
      summary: patch.summary,
      keywords: patch.keywords,
      subreddits: patch.subreddits,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapProduct(data);
}

export async function saveSurveyAnswers(
  id: string,
  answers: SurveyAnswers,
): Promise<Product> {
  const { data, error } = await getSupabaseServer()
    .from("products")
    .update({ survey_answers: answers })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapProduct(data);
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await getSupabaseServer()
    .from("products")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
