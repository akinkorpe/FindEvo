import { generateJSON, isOpenAIConfigured } from "@/lib/openai";
import * as guidesRepo from "@/repositories/approachGuides.repo";
import * as credits from "@/repositories/aiCredits.repo";
import type {
  ApproachGuide,
  Product,
  RedditPost,
  SubredditRule,
} from "@/types";

export interface GuideInput {
  scoredPostId: string;
  post: RedditPost;
  product: Product;
  rules?: SubredditRule[];
}

export async function generateStrategy(
  input: GuideInput,
): Promise<ApproachGuide> {
  if (!isOpenAIConfigured()) {
    throw new Error("OPENROUTER_API_KEY is not set. Cannot generate approach guide.");
  }

  const output = await generateJSON<{
    whyLead: string;
    authorContext: string;
    suggestedSteps: string[];
  }>({
    system:
      "You produce approach GUIDANCE for a product owner engaging with a Reddit lead. " +
      "Never write copy-paste reply text. Output GUIDANCE (what to do, what angle, what to avoid). " +
      "Return JSON only. Schema: " +
      '{"whyLead": string (<= 400 chars, cite pain points from the post), ' +
      '"authorContext": string (<= 240 chars, infer from post/history)," +' +
      '"suggestedSteps": string[] (exactly 3 items, actionable, do NOT include quoted reply text)}',
    user: JSON.stringify({
      product: {
        name: input.product.name,
        niche: input.product.niche,
        summary: input.product.summary,
        keywords: input.product.keywords,
      },
      userContext: input.product.surveyAnswers ?? undefined,
      post: {
        subreddit: input.post.subreddit,
        title: input.post.title,
        body: input.post.body.slice(0, 1500),
        author: input.post.author,
      },
      subredditRules: (input.rules ?? []).map((r) => ({
        title: r.title,
        description: r.description.slice(0, 300),
      })),
    }),
  });

  const guide = await guidesRepo.upsertGuide(input.scoredPostId, {
    whyLead: output.whyLead ?? "",
    authorContext: output.authorContext ?? "",
    suggestedSteps: Array.isArray(output.suggestedSteps)
      ? output.suggestedSteps.slice(0, 5)
      : [],
  });
  await credits
    .recordUsage(input.product.id, "approach_guide", -1)
    .catch(() => undefined);
  return guide;
}
