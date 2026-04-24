import { generateStrategy } from "@/services/approachGuide.service";
import { getRuleIntelligence } from "@/services/redditIngestion.service";
import { getById as getScored } from "@/repositories/scoredPosts.repo";
import { getProduct } from "@/repositories/products.repo";
import { getGuide } from "@/repositories/approachGuides.repo";
import { checkRateLimit, RateLimitError } from "@/repositories/aiCredits.repo";
import type { ApproachGuide } from "@/types";

export interface ApproachGuideInput {
  scoredPostId: string;
  regenerate?: boolean;
}

export interface ApproachGuideOutput {
  guide: ApproachGuide;
}

export function validateInput(raw: unknown): ApproachGuideInput {
  const input = raw as Partial<ApproachGuideInput> | null;
  if (
    !input ||
    typeof input.scoredPostId !== "string" ||
    !input.scoredPostId
  ) {
    throw new Error("`scoredPostId` is required");
  }
  return { scoredPostId: input.scoredPostId, regenerate: !!input.regenerate };
}

export async function handle(raw: unknown): Promise<ApproachGuideOutput> {
  const { scoredPostId, regenerate } = validateInput(raw);

  if (!regenerate) {
    const cached = await getGuide(scoredPostId);
    if (cached) return { guide: cached };
  }

  const scored = await getScored(scoredPostId);
  if (!scored) throw new Error(`Scored post ${scoredPostId} not found`);

  const product = await getProduct(scored.productId);
  if (!product) throw new Error(`Product ${scored.productId} not found`);

  const limit = await checkRateLimit(scored.productId, "approach_guide", 1);
  if (!limit.allowed) throw new RateLimitError(limit);

  const intel = await getRuleIntelligence(
    scored.productId,
    scored.post.subreddit,
  ).catch(() => ({ rules: [], badge: "yellow" as const, summary: "", fromCache: false }));

  const guide = await generateStrategy({
    scoredPostId,
    post: scored.post,
    product,
    rules: intel.rules,
  });
  return { guide };
}
