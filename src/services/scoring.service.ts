import { generateJSON, isOpenAIConfigured } from "@/lib/openai";
import * as scoredRepo from "@/repositories/scoredPosts.repo";
import * as credits from "@/repositories/aiCredits.repo";
import type { Product, RedditPost, RiskLevel } from "@/types";

interface ScoreResult {
  intentScore: number;
  reason: string;
  riskLevel: RiskLevel;
}

const SELF_PROMO = /\b(just launched|i built|check out my|my new tool|use my)\b/i;

function heuristicRisk(post: RedditPost): RiskLevel {
  if (SELF_PROMO.test(`${post.title} ${post.body}`)) return "high_risk";
  if (post.body.length < 40) return "review";
  return "safe";
}

export async function scorePost(
  post: RedditPost,
  product: Product,
): Promise<ScoreResult> {
  if (!isOpenAIConfigured()) {
    throw new Error("OPENROUTER_API_KEY is not set. Cannot score posts.");
  }

  const output = await generateJSON<{
    intentScore: number;
    reason: string;
    riskLevel?: RiskLevel;
  }>({
    system: [
      "You score a Reddit post for BUYING INTENT toward a given product.",
      "Return JSON only.",
      "",
      "CRITICAL — Read `product.buyerPersona` first. It describes the RANGE of people we want as leads.",
      "  • buyerPersona often covers multiple roles (freelancer, agency, small business owner, marketer). Match ANY of them.",
      "  • Be GENEROUS with persona matching: if the author has the same PROBLEM the product solves, they are a lead — even if their job title differs from the persona description.",
      "  • Only cap at 25 if the author is clearly on the OPPOSITE side of the marketplace (e.g. a platform creator when the buyer is a consumer).",
      "",
      "Scoring rubric (spread scores across the full range — do NOT cluster at 30):",
      "  • 85-100: strong persona match + explicitly asking for a tool/recommendation/alternative. Clear shopping signal.",
      "  • 70-84: persona match + clear pain or workflow problem this product directly solves, with implicit shopping intent.",
      "  • 50-69: persona match + concrete monetization intent OR tool-seeking behavior (evaluating options, asking for stack recommendations, comparing solutions). NOT just frustration.",
      "  • 30-49: partial persona match, tangential topic, generic questions about equipment / workflow / motivation, or weak pain signal without any tool-seeking language.",
      "  • 0-29: off-topic, generic discussion, wrong side of marketplace, or self-promo.",
      "",
      "Rules:",
      "  • A post should only score 50+ if it contains a clear signal of monetization intent or tool-seeking behavior. Generic questions about equipment, workflow, or motivation should score 30-40 regardless of subreddit — being in a relevant subreddit is not enough on its own.",
      "  • Reward concrete buying language: 'looking for', 'recommend', 'alternative to', 'tool that', 'how do I', 'struggling with'.",
      "  • Penalize self-promo posts (someone advertising their own thing).",
      "  • `reason` must quote 1-2 concrete phrases from the post (≤ 280 chars) AND explain why the author does or does not match the buyerPersona.",
      "",
      'Schema: {"intentScore": integer 0-100, "reason": string, "riskLevel": "safe" | "review" | "high_risk"}. ',
      'riskLevel: "high_risk" if self-promo, brigade-worthy, hostile, or violates subreddit norms; ',
      '"review" if ambiguous; otherwise "safe".',
    ].join("\n"),
    user: JSON.stringify({
      product: {
        name: product.name,
        niche: product.niche,
        summary: product.summary,
        buyerPersona: product.buyerPersona,
        keywords: product.keywords,
        buyerContext: product.surveyAnswers ?? null,
      },
      post: {
        subreddit: post.subreddit,
        title: post.title,
        body: post.body.slice(0, 1500),
        author: post.author,
      },
    }),
  });

  const score = Math.max(0, Math.min(100, Math.round(output.intentScore ?? 0)));
  const risk = output.riskLevel ?? heuristicRisk(post);

  return {
    intentScore: score,
    reason: output.reason ?? "",
    riskLevel: risk,
  };
}

export async function scoreAndPersist(
  product: Product,
  post: RedditPost,
): Promise<{ id: string; intentScore: number; riskLevel: RiskLevel }> {
  const result = await scorePost(post, product);
  const { id } = await scoredRepo.upsertScored({
    productId: product.id,
    postId: post.id,
    intentScore: result.intentScore,
    reason: result.reason,
    riskLevel: result.riskLevel,
  });
  await credits
    .recordUsage(product.id, "score_post", -1)
    .catch(() => undefined);
  return { id, intentScore: result.intentScore, riskLevel: result.riskLevel };
}
