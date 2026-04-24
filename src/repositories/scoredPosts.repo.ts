import { getSupabaseServer } from "@/lib/supabase";
import { mapRedditPost, mapScoredPost } from "./mappers";
import type { ScoredPost } from "@/types";

export interface UpsertScoredInput {
  productId: string;
  postId: string;
  intentScore: number;
  reason: string;
  riskLevel: "safe" | "review" | "high_risk";
}

export async function upsertScored(
  input: UpsertScoredInput,
): Promise<{ id: string }> {
  const { data, error } = await getSupabaseServer()
    .from("scored_posts")
    .upsert(
      {
        product_id: input.productId,
        post_id: input.postId,
        intent_score: input.intentScore,
        reason: input.reason,
        risk_level: input.riskLevel,
      },
      { onConflict: "product_id,post_id" },
    )
    .select("id")
    .single();
  if (error) throw error;
  return { id: data.id };
}

export async function listForProduct(
  productId: string,
  opts: { subreddit?: string; minScore?: number; limit?: number } = {},
): Promise<ScoredPost[]> {
  let query = getSupabaseServer()
    .from("scored_posts")
    .select("*, reddit_posts!inner(*)")
    .eq("product_id", productId)
    .eq("dismissed", false)
    .or("expires_at.is.null,expires_at.gt.now()")
    .order("intent_score", { ascending: false })
    .limit(opts.limit ?? 50);

  if (opts.minScore !== undefined) {
    query = query.gte("intent_score", opts.minScore);
  }
  if (opts.subreddit) {
    query = query.eq("reddit_posts.subreddit", opts.subreddit.replace(/^r\//i, ""));
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row: { reddit_posts: unknown } & Record<string, unknown>) =>
    mapScoredPost(row, mapRedditPost(row.reddit_posts)),
  );
}

export async function dismiss(id: string): Promise<void> {
  const { error } = await getSupabaseServer()
    .from("scored_posts")
    .update({ dismissed: true })
    .eq("id", id);
  if (error) throw error;
}

export async function getById(id: string): Promise<ScoredPost | null> {
  const { data, error } = await getSupabaseServer()
    .from("scored_posts")
    .select("*, reddit_posts!inner(*)")
    .eq("id", id)
    .or("expires_at.is.null,expires_at.gt.now()")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as { reddit_posts: unknown } & Record<string, unknown>;
  return mapScoredPost(row, mapRedditPost(row.reddit_posts));
}

export async function keepForever(id: string): Promise<void> {
  const { error } = await getSupabaseServer()
    .from("scored_posts")
    .update({ expires_at: null })
    .eq("id", id);
  if (error) throw error;
}
