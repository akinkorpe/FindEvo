import { getSupabaseServer } from "@/lib/supabase";
import { mapWorkspaceSettings } from "./mappers";
import type { WorkspaceSettings } from "@/types";

const DEFAULTS = {
  strict_profanity_filter: true,
  require_competitor_mention: false,
  min_author_karma: 150,
  max_post_age_hours: 24,
};

export async function getSettings(
  productId: string,
): Promise<WorkspaceSettings> {
  const sb = getSupabaseServer();
  const { data, error } = await sb
    .from("workspace_settings")
    .select("*")
    .eq("product_id", productId)
    .maybeSingle();
  if (error) throw error;
  if (data) return mapWorkspaceSettings(data);

  const { data: created, error: insertErr } = await sb
    .from("workspace_settings")
    .insert({ product_id: productId, ...DEFAULTS })
    .select("*")
    .single();
  if (insertErr) throw insertErr;
  return mapWorkspaceSettings(created);
}

export async function updateSettings(
  productId: string,
  patch: Partial<Omit<WorkspaceSettings, "productId" | "updatedAt">>,
): Promise<WorkspaceSettings> {
  const payload: Record<string, unknown> = {};
  if (patch.strictProfanityFilter !== undefined)
    payload.strict_profanity_filter = patch.strictProfanityFilter;
  if (patch.requireCompetitorMention !== undefined)
    payload.require_competitor_mention = patch.requireCompetitorMention;
  if (patch.minAuthorKarma !== undefined)
    payload.min_author_karma = patch.minAuthorKarma;
  if (patch.maxPostAgeHours !== undefined)
    payload.max_post_age_hours = patch.maxPostAgeHours;

  const sb = getSupabaseServer();
  await getSettings(productId); // ensure row exists
  const { data, error } = await sb
    .from("workspace_settings")
    .update(payload)
    .eq("product_id", productId)
    .select("*")
    .single();
  if (error) throw error;
  return mapWorkspaceSettings(data);
}
