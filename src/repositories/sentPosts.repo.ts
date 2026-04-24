import { getSupabaseServer } from "@/lib/supabase";

export interface SentPost {
  id: string;
  productId: string;
  postId: string;
  scoredPostId: string | null;
  kind: "sent" | "lead";
  createdAt: string;
}

function mapSent(row: Record<string, unknown>): SentPost {
  return {
    id: row.id as string,
    productId: row.product_id as string,
    postId: row.post_id as string,
    scoredPostId: (row.scored_post_id as string | null) ?? null,
    kind: (row.kind as "sent" | "lead") ?? "sent",
    createdAt: row.created_at as string,
  };
}

export async function markSent(input: {
  productId: string;
  postId: string;
  scoredPostId?: string | null;
  kind?: "sent" | "lead";
}): Promise<SentPost> {
  const { data, error } = await getSupabaseServer()
    .from("sent_posts")
    .upsert(
      {
        product_id: input.productId,
        post_id: input.postId,
        scored_post_id: input.scoredPostId ?? null,
        kind: input.kind ?? "sent",
      },
      { onConflict: "product_id,post_id" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return mapSent(data);
}

export async function listSent(productId: string): Promise<SentPost[]> {
  const { data, error } = await getSupabaseServer()
    .from("sent_posts")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapSent);
}
