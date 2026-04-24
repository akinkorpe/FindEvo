import { redirect } from "next/navigation";
import { getFirstProduct } from "@/repositories/products.repo";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  if (!isSupabaseConfigured()) {
    redirect("/onboarding");
  }
  try {
    const product = await getFirstProduct();
    redirect(product ? "/dashboard" : "/onboarding");
  } catch {
    redirect("/onboarding");
  }
}
