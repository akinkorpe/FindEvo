import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getSupabaseRSC } from "@/lib/supabase.server";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  if (!isSupabaseConfigured()) {
    redirect("/landing");
  }

  const sb = await getSupabaseRSC();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    redirect("/landing");
  }

  // Scope to the signed-in user. RLS also enforces this — we filter explicitly
  // so the query stays correct even before RLS lands or if the request runs
  // with elevated credentials.
  const { data: product } = await sb
    .from("products")
    .select("id")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  redirect(product ? "/dashboard" : "/onboarding");
}
