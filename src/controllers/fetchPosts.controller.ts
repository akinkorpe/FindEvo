import { fetchSubredditPosts } from "@/services/redditIngestion.service";
import { scoreAndPersist } from "@/services/scoring.service";
import { getProduct } from "@/repositories/products.repo";
import { checkRateLimit, RateLimitError } from "@/repositories/aiCredits.repo";
import { RedditNotFoundError } from "@/lib/reddit";
import { getSupabaseServer } from "@/lib/supabase";
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
  let posts: RedditPost[] = [];
  try {
    posts = await fetchSubredditPosts(subreddit, effectiveKeywords, limit);
  } catch (err) {
    if (err instanceof RedditNotFoundError) {
      await getSupabaseServer()
        .from("subreddits")
        .delete()
        .eq("product_id", productId)
        .eq("name", subreddit.replace(/^r\//i, ""))
        .then(() => undefined, () => undefined);
      return { posts: [], scored: [] };
    }
    throw err;
  }

  if (!score || posts.length === 0) return { posts };

  const limitStatus = await checkRateLimit(productId, "score_post", 1);
  if (!limitStatus.allowed) throw new RateLimitError(limitStatus);

  // Heuristic pre-filter: Reddit's search endpoint already matched on keywords,
  // but its tokenizer is fuzzy and brings back posts where none of our terms
  // actually appear in the title/body. Skipping LLM calls on those cuts
  // latency dramatically without losing real leads.
  // Break multi-word keywords into individual words (≥4 chars) for broader matching.
  const needles = effectiveKeywords.length === 0
    ? []
    : Array.from(
        new Set(
          effectiveKeywords
            .flatMap((k) => k.toLowerCase().split(/\s+/))
            .filter((w) => w.length >= 4),
        ),
      );
  const relevant = needles.length === 0
    ? posts
    : posts.filter((p) => {
        const hay = `${p.title} ${p.body}`.toLowerCase();
        return needles.some((n) => hay.includes(n));
      });

  const budget = Math.min(relevant.length, limitStatus.remaining);
  const scored: FetchPostsOutput["scored"] = [];

  // Score posts in parallel with a concurrency of 15. OpenRouter handles this
  // fine for short prompts and the LLM call is the only meaningful latency in
  // the pipeline — going from 5 → 15 is a ~3× speedup with no rate limit hits
  // on tested models.
  const concurrency = 15;
  const toScore = relevant.slice(0, budget);
  for (let i = 0; i < toScore.length; i += concurrency) {
    const chunk = toScore.slice(i, i + concurrency);
    await Promise.all(
      chunk.map(async (p) => {
        try {
          const { id, intentScore } = await scoreAndPersist(product, p);
          scored.push({ postId: p.id, scoredPostId: id, intentScore });
        } catch (err) {
          console.error("[score] failed", {
            postId: p.id,
            subreddit: p.subreddit,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }),
    );
  }
  return { posts, scored };
}
