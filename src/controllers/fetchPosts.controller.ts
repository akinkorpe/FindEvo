import { fetchSubredditPosts } from "@/services/redditIngestion.service";
import { scoreAndPersist } from "@/services/scoring.service";
import { getProduct } from "@/repositories/products.repo";
import { checkRateLimit, RateLimitError } from "@/repositories/aiCredits.repo";
import type { RedditPost } from "@/types";

export interface FetchPostsInput {
  productId: string;
  subreddit: string;
  keywords?: string[];
  score?: boolean;
  limit?: number;
}

export interface FetchPostsOutput {
  posts: RedditPost[];
  scored?: Array<{ postId: string; scoredPostId: string; intentScore: number }>;
}

export function validateInput(raw: unknown): FetchPostsInput {
  const input = raw as Partial<FetchPostsInput> | null;
  if (!input || typeof input.productId !== "string" || !input.productId) {
    throw new Error("`productId` is required");
  }
  if (typeof input.subreddit !== "string" || input.subreddit.trim() === "") {
    throw new Error("`subreddit` is required");
  }
  const keywords = Array.isArray(input.keywords)
    ? input.keywords.filter((k): k is string => typeof k === "string")
    : undefined;
  return {
    productId: input.productId,
    subreddit: input.subreddit.trim(),
    keywords,
    score: input.score !== false,
    limit: typeof input.limit === "number" ? input.limit : 25,
  };
}

export async function handle(raw: unknown): Promise<FetchPostsOutput> {
  const { productId, subreddit, keywords, score, limit } = validateInput(raw);

  const product = await getProduct(productId);
  if (!product) throw new Error(`Product ${productId} not found`);

  const effectiveKeywords = keywords ?? product.keywords;
  const posts = await fetchSubredditPosts(subreddit, effectiveKeywords, limit);

  if (!score || posts.length === 0) return { posts };

  const limitStatus = await checkRateLimit(productId, "score_post", 1);
  if (!limitStatus.allowed) throw new RateLimitError(limitStatus);

  const budget = Math.min(posts.length, limitStatus.remaining);
  const scored: FetchPostsOutput["scored"] = [];

  // Score posts in parallel with a concurrency of 5, capped by remaining budget.
  const concurrency = 5;
  const toScore = posts.slice(0, budget);
  for (let i = 0; i < toScore.length; i += concurrency) {
    const chunk = toScore.slice(i, i + concurrency);
    await Promise.all(
      chunk.map(async (p) => {
        try {
          const { id, intentScore } = await scoreAndPersist(product, p);
          scored.push({ postId: p.id, scoredPostId: id, intentScore });
        } catch {
          /* skip single-post failure */
        }
      }),
    );
  }
  return { posts, scored };
}
