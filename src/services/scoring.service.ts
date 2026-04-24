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
    system:
      "You score a Reddit post for buying intent toward a given product. " +
      "Return JSON only. Schema: " +
      '{"intentScore": integer 0-100, "reason": string (<= 280 chars, cite concrete phrases), ' +
      '"riskLevel": "safe" | "review" | "high_risk"}. ' +
      'riskLevel: "high_risk" if the post is self-promo, NSFW, hostile, or brigade-worthy; ' +
      '"review" if ambiguous; otherwise "safe".',
    user: JSON.stringify({
      product: {
        name: product.name,
        niche: product.niche,
        summary: product.summary,
        keywords: product.keywords,
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
