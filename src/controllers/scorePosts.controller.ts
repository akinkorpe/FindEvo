import { scoreAndPersist } from "@/services/scoring.service";
import { getProduct } from "@/repositories/products.repo";
import { getPostsByIds } from "@/repositories/posts.repo";
import { checkRateLimit, RateLimitError } from "@/repositories/aiCredits.repo";

export interface ScorePostsInput {
  productId: string;
  postIds: string[];
}

export interface ScorePostsOutput {
  scored: Array<{ postId: string; scoredPostId: string; intentScore: number }>;
}

export function validateInput(raw: unknown): ScorePostsInput {
  const input = raw as Partial<ScorePostsInput> | null;
  if (!input || typeof input.productId !== "string" || !input.productId) {
    throw new Error("`productId` is required");
  }
  if (!Array.isArray(input.postIds) || input.postIds.length === 0) {
    throw new Error("`postIds[]` is required");
  }
  return {
    productId: input.productId,
    postIds: input.postIds.filter((id): id is string => typeof id === "string"),
  };
}

export async function handle(raw: unknown): Promise<ScorePostsOutput> {
  const { productId, postIds } = validateInput(raw);
  const product = await getProduct(productId);
  if (!product) throw new Error(`Product ${productId} not found`);

  const limit = await checkRateLimit(productId, "score_post", 1);
  if (!limit.allowed) throw new RateLimitError(limit);

  const posts = await getPostsByIds(postIds);
  const budget = Math.min(posts.length, limit.remaining);
  const scored: ScorePostsOutput["scored"] = [];
  for (const p of posts.slice(0, budget)) {
    try {
      const { id, intentScore } = await scoreAndPersist(product, p);
      scored.push({ postId: p.id, scoredPostId: id, intentScore });
    } catch {
      /* skip */
    }
  }
  return { scored };
}
