import { getSupabaseServer } from "@/lib/supabase";
import type { ApproachGuide } from "@/types";

export async function upsertGuide(
  scoredPostId: string,
  guide: Omit<ApproachGuide, "scoredPostId">,
): Promise<ApproachGuide> {
  const { data, error } = await getSupabaseServer()
    .from("approach_guides")
    .upsert(
      {
        scored_post_id: scoredPostId,
        why_lead: guide.whyLead,
        author_context: guide.authorContext,
        suggested_steps: guide.suggestedSteps,
      },
      { onConflict: "scored_post_id" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return {
    scoredPostId: data.scored_post_id,
    whyLead: data.why_lead,
    authorContext: data.author_context,
    suggestedSteps: data.suggested_steps ?? [],
  };
}

export async function getGuide(
  scoredPostId: string,
): Promise<ApproachGuide | null> {
  const { data, error } = await getSupabaseServer()
    .from("approach_guides")
    .select("*")
    .eq("scored_post_id", scoredPostId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    scoredPostId: data.scored_post_id,
    whyLead: data.why_lead,
    authorContext: data.author_context,
    suggestedSteps: data.suggested_steps ?? [],
  };
}
