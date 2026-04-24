import { fetchPosts as fetchFromReddit, fetchRules } from "@/lib/reddit";
import * as postsRepo from "@/repositories/posts.repo";
import * as subredditsRepo from "@/repositories/subreddits.repo";
import { generateJSON, isOpenAIConfigured } from "@/lib/openai";
import type {
  RedditPost,
  SubredditRule,
  SubredditRuleBadge,
  SubredditTarget,
} from "@/types";

const RULE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function fetchSubredditPosts(
  subreddit: string,
  keywords: string[] = [],
  limit = 25,
): Promise<RedditPost[]> {
  const posts = await fetchFromReddit(subreddit, keywords, limit);
  await postsRepo.upsertPosts(posts);
  return posts;
}

export async function fetchSubredditRules(
  subreddit: string,
): Promise<SubredditRule[]> {
  return fetchRules(subreddit);
}

export interface RuleIntelligence {
  rules: SubredditRule[];
  badge: SubredditRuleBadge;
  summary: string;
  fromCache: boolean;
}

function cacheIsFresh(target: SubredditTarget | undefined): boolean {
  if (!target?.rulesUpdatedAt || !target.rulesCache || !target.ruleBadge) {
    return false;
  }
  const age = Date.now() - new Date(target.rulesUpdatedAt).getTime();
  return age < RULE_CACHE_TTL_MS;
}

function parseCachedRules(raw: string | null): SubredditRule[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((r) => r && typeof r === "object")
      .map((r) => ({
        subreddit: String((r as { subreddit?: unknown }).subreddit ?? ""),
        title: String((r as { title?: unknown }).title ?? ""),
        description: String((r as { description?: unknown }).description ?? ""),
      }));
  } catch {
    return [];
  }
}

async function classifyBadge(
  subreddit: string,
  rules: SubredditRule[],
): Promise<{ badge: SubredditRuleBadge; summary: string }> {
  if (!isOpenAIConfigured() || rules.length === 0) {
    return {
      badge: "yellow",
      summary: rules.length === 0 ? "No rules published." : "Rules not classified.",
    };
  }
  try {
    const out = await generateJSON<{ badge?: string; summary?: string }>({
      system:
        "You classify a subreddit's self-promotion/marketing tolerance based on its rules. " +
        "Return JSON only. Schema: " +
        '{"badge": "green" | "yellow" | "red", "summary": string (<= 160 chars)}. ' +
        'badge="green" if promotion/self-marketing is explicitly allowed; ' +
        '"red" if promotion is explicitly banned or the sub is strict no-ads; ' +
        '"yellow" if restricted (allowed with limits, ratios, weekly threads, or unclear).',
      user: JSON.stringify({
        subreddit,
        rules: rules.map((r) => ({
          title: r.title,
          description: r.description.slice(0, 400),
        })),
      }),
    });
    const badge: SubredditRuleBadge =
      out.badge === "green" || out.badge === "red" ? out.badge : "yellow";
    const summary =
      typeof out.summary === "string" && out.summary.trim()
        ? out.summary.trim()
        : "Promotion posture unclear — review rules.";
    return { badge, summary };
  } catch {
    return { badge: "yellow", summary: "Classifier unavailable — review rules." };
  }
}

export async function getRuleIntelligence(
  productId: string,
  subreddit: string,
): Promise<RuleIntelligence> {
  const clean = subreddit.replace(/^r\//i, "");
  const targets = await subredditsRepo.listByName(clean).catch(() => []);
  const ownTarget = targets.find((t) => t.productId === productId);

  if (cacheIsFresh(ownTarget)) {
    return {
      rules: parseCachedRules(ownTarget!.rulesCache ?? null),
      badge: ownTarget!.ruleBadge ?? "yellow",
      summary: ownTarget!.rulesSummary ?? "",
      fromCache: true,
    };
  }

  // Cross-product cache: another product already classified this sub within TTL.
  const freshAny = targets.find(cacheIsFresh);
  if (freshAny) {
    const rules = parseCachedRules(freshAny.rulesCache ?? null);
    const badge = freshAny.ruleBadge ?? "yellow";
    const summary = freshAny.rulesSummary ?? "";
    if (ownTarget) {
      await subredditsRepo
        .updateRuleCache(productId, clean, {
          rulesCache: freshAny.rulesCache ?? "[]",
          rulesSummary: summary,
          ruleBadge: badge,
        })
        .catch(() => undefined);
    }
    return { rules, badge, summary, fromCache: true };
  }

  const rules = await fetchRules(clean).catch(() => [] as SubredditRule[]);
  const { badge, summary } = await classifyBadge(clean, rules);
  const rulesCache = JSON.stringify(rules);

  if (targets.length > 0) {
    await subredditsRepo
      .propagateRuleCache(clean, { rulesCache, rulesSummary: summary, ruleBadge: badge })
      .catch(() => undefined);
  }

  return { rules, badge, summary, fromCache: false };
}
