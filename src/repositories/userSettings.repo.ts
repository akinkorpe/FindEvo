import { getSupabaseServer } from "@/lib/supabase";

export interface UserSettings {
  productId: string;
  notifyNewPosts: boolean;
  notifyLeadReminders: boolean;
  updatedAt: string;
}

const DEFAULTS = {
  notify_new_posts: true,
  notify_lead_reminders: true,
};

function map(row: Record<string, unknown>): UserSettings {
  return {
    productId: row.product_id as string,
    notifyNewPosts: Boolean(row.notify_new_posts),
    notifyLeadReminders: Boolean(row.notify_lead_reminders),
    updatedAt: row.updated_at as string,
  };
}

export async function getUserSettings(productId: string): Promise<UserSettings> {
  const sb = getSupabaseServer();
  const { data, error } = await sb
    .from("user_settings")
    .select("*")
    .eq("product_id", productId)
    .maybeSingle();
  if (error) throw error;
  if (data) return map(data as Record<string, unknown>);

  const { data: created, error: insertErr } = await sb
    .from("user_settings")
    .insert({ product_id: productId, ...DEFAULTS })
    .select("*")
    .single();
  if (insertErr) throw insertErr;
  return map(created as Record<string, unknown>);
}

export async function updateUserSettings(
  productId: string,
  patch: Partial<Pick<UserSettings, "notifyNewPosts" | "notifyLeadReminders">>,
): Promise<UserSettings> {
  const payload: Record<string, unknown> = {};
  if (patch.notifyNewPosts !== undefined)
    payload.notify_new_posts = patch.notifyNewPosts;
  if (patch.notifyLeadReminders !== undefined)
    payload.notify_lead_reminders = patch.notifyLeadReminders;

  await getUserSettings(productId); // ensure row
  const { data, error } = await getSupabaseServer()
    .from("user_settings")
    .update(payload)
    .eq("product_id", productId)
    .select("*")
    .single();
  if (error) throw error;
  return map(data as Record<string, unknown>);
}
