import { getSupabaseServer } from "@/lib/supabase";
import { mapProduct } from "./mappers";
import type { Product, ProductAnalysis, SurveyAnswers } from "@/types";

export async function listProducts(): Promise<Product[]> {
  const { data, error } = await getSupabaseServer()
    .from("products")
    .select("*")
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

export async function getProduct(id: string): Promise<Product | null> {
  const { data, error } = await getSupabaseServer()
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProduct(data) : null;
}

export async function getFirstProduct(): Promise<Product | null> {
  const { data, error } = await getSupabaseServer()
    .from("products")
    .select("*")
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProduct(data) : null;
}

export async function upsertProductFromAnalysis(
  analysis: ProductAnalysis,
): Promise<Product> {
  const sb = getSupabaseServer();
  const { data: existing } = await sb
    .from("products")
    .select("id")
    .eq("website_url", analysis.websiteUrl)
    .maybeSingle();

  const payload = {
    website_url: analysis.websiteUrl,
    name: analysis.name,
    niche: analysis.niche,
    summary: analysis.summary,
    keywords: analysis.keywords,
    subreddits: analysis.subreddits,
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
