import { getSupabaseServer } from "@/lib/supabase";
import { mapLead, mapLeadInteraction } from "./mappers";
import type { Lead, LeadInteraction, LeadStatus } from "@/types";

export async function listLeads(
  productId: string,
  opts: { status?: LeadStatus; limit?: number } = {},
): Promise<Lead[]> {
  let q = getSupabaseServer()
    .from("leads")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 100);
  if (opts.status) q = q.eq("status", opts.status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(mapLead);
}

export async function countByStatus(
  productId: string,
  status: LeadStatus,
): Promise<number> {
  const { count, error } = await getSupabaseServer()
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("product_id", productId)
    .eq("status", status);
  if (error) throw error;
  return count ?? 0;
}

export async function countAll(productId: string): Promise<number> {
  const { count, error } = await getSupabaseServer()
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("product_id", productId);
  if (error) throw error;
  return count ?? 0;
}

export interface CreateLeadInput {
  productId: string;
  scoredPostId?: string | null;
  redditUsername: string;
  source: string;
  intentLabel?: string;
  status?: LeadStatus;
  lastSeenAt?: string | null;
  notes?: string;
}

export async function createLead(input: CreateLeadInput): Promise<Lead> {
  const { data, error } = await getSupabaseServer()
    .from("leads")
    .insert({
      product_id: input.productId,
      scored_post_id: input.scoredPostId ?? null,
      reddit_username: input.redditUsername,
      source: input.source,
      intent_label: input.intentLabel ?? "exploring",
      status: input.status ?? "new",
      last_seen_at: input.lastSeenAt ?? null,
      notes: input.notes ?? "",
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapLead(data);
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatus,
): Promise<Lead> {
  const { data, error } = await getSupabaseServer()
    .from("leads")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapLead(data);
}

export async function getLead(id: string): Promise<Lead | null> {
  const { data, error } = await getSupabaseServer()
    .from("leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapLead(data) : null;
}

export async function listInteractions(
  leadId: string,
): Promise<LeadInteraction[]> {
  const { data, error } = await getSupabaseServer()
    .from("lead_interactions")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapLeadInteraction);
}

export async function addInteraction(
  leadId: string,
  kind: "ai_suggestion" | "comment" | "note" | "status_change",
  content: string,
): Promise<LeadInteraction> {
  const { data, error } = await getSupabaseServer()
    .from("lead_interactions")
    .insert({ lead_id: leadId, kind, content })
    .select("*")
    .single();
  if (error) throw error;
  return mapLeadInteraction(data);
}

export async function leadVelocity(
  productId: string,
  days: number,
): Promise<{ date: string; count: number }[]> {
  const sb = getSupabaseServer();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await sb
    .from("leads")
    .select("created_at")
    .eq("product_id", productId)
    .gte("created_at", since);
  if (error) throw error;

  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, 0);
  }
  for (const row of data ?? []) {
    const key = new Date(row.created_at).toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
}
