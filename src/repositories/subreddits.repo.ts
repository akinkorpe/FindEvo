import { getSupabaseServer } from "@/lib/supabase";
import { mapSubredditTarget } from "./mappers";
import type {
  SubredditPriority,
  SubredditRuleBadge,
  SubredditTarget,
} from "@/types";

export async function listTargets(productId: string): Promise<SubredditTarget[]> {
  const { data, error } = await getSupabaseServer()
    .from("subreddits")
    .select("*")
    .eq("product_id", productId)
    .order("priority", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapSubredditTarget);
}

export async function addTarget(
  productId: string,
  name: string,
  priority: SubredditPriority = "standard",
): Promise<SubredditTarget> {
  const clean = name.replace(/^r\//i, "");
  const { data, error } = await getSupabaseServer()
    .from("subreddits")
    .upsert(
      { product_id: productId, name: clean, priority },
      { onConflict: "product_id,name" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return mapSubredditTarget(data);
}

export async function replaceTargets(
  productId: string,
  names: string[],
): Promise<void> {
  const cleanUnique = Array.from(
    new Set(
      names
        .map((n) => n.replace(/^r\//i, "").trim())
        .filter(Boolean),
    ),
  );

  const sb = getSupabaseServer();
  const { data: existing, error: listErr } = await sb
    .from("subreddits")
    .select("id,name")
    .eq("product_id", productId);
  if (listErr) throw listErr;

  const wanted = new Set(cleanUnique.map((n) => n.toLowerCase()));
  const toDeleteIds = (existing ?? [])
    .filter((row) => !wanted.has(String(row.name).toLowerCase()))
    .map((row) => String(row.id));

  if (toDeleteIds.length > 0) {
    const { error: delErr } = await sb
      .from("subreddits")
      .delete()
      .in("id", toDeleteIds);
    if (delErr) throw delErr;
  }

  for (const name of cleanUnique) {
    await addTarget(productId, name, "standard").catch(() => {
      /* ignore dup */
    });
  }
}

export async function removeTarget(id: string): Promise<void> {
  const { error } = await getSupabaseServer()
    .from("subreddits")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function listByName(name: string): Promise<SubredditTarget[]> {
  const clean = name.replace(/^r\//i, "");
  const { data, error } = await getSupabaseServer()
    .from("subreddits")
    .select("*")
    .eq("name", clean);
  if (error) throw error;
  return (data ?? []).map(mapSubredditTarget);
}

export async function updateRuleCache(
  productId: string,
  name: string,
  patch: {
    rulesCache: string;
    rulesSummary: string;
    ruleBadge: SubredditRuleBadge;
  },
): Promise<void> {
  const clean = name.replace(/^r\//i, "");
  const { error } = await getSupabaseServer()
    .from("subreddits")
    .update({
      rules_cache: patch.rulesCache,
      rules_summary: patch.rulesSummary,
      rule_badge: patch.ruleBadge,
      rules_updated_at: new Date().toISOString(),
    })
    .eq("product_id", productId)
    .eq("name", clean);
  if (error) throw error;
}

export async function propagateRuleCache(
  name: string,
  patch: {
    rulesCache: string;
    rulesSummary: string;
    ruleBadge: SubredditRuleBadge;
  },
): Promise<void> {
  const clean = name.replace(/^r\//i, "");
  const { error } = await getSupabaseServer()
    .from("subreddits")
    .update({
      rules_cache: patch.rulesCache,
      rules_summary: patch.rulesSummary,
      rule_badge: patch.ruleBadge,
      rules_updated_at: new Date().toISOString(),
    })
    .eq("name", clean);
  if (error) throw error;
}
