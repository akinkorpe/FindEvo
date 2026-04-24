import type {
  Campaign,
  Lead,
  LeadInteraction,
  Product,
  RedditPost,
  ScoredPost,
  SubredditTarget,
  WorkspaceSettings,
} from "@/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function mapProduct(row: any): Product {
  const sa = row.survey_answers;
  const hasSurvey =
    sa && typeof sa === "object" && !Array.isArray(sa) && Object.keys(sa).length > 0;
  return {
    id: row.id,
    websiteUrl: row.website_url,
    name: row.name ?? null,
    niche: row.niche ?? null,
    summary: row.summary ?? null,
    keywords: row.keywords ?? [],
    subreddits: row.subreddits ?? [],
    surveyAnswers: hasSurvey ? (sa as Product["surveyAnswers"]) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCampaign(row: any): Campaign {
  return {
    id: row.id,
    productId: row.product_id,
    name: row.name,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export function mapSubredditTarget(row: any): SubredditTarget {
  return {
    id: row.id,
    productId: row.product_id,
    name: row.name,
    priority: row.priority,
    ruleBadge: (row.rule_badge as SubredditTarget["ruleBadge"]) ?? null,
    rulesSummary: row.rules_summary ?? null,
    rulesCache: row.rules_cache ?? null,
    rulesUpdatedAt: row.rules_updated_at ?? null,
    createdAt: row.created_at,
  };
}

export function mapRedditPost(row: any): RedditPost {
  return {
    id: row.id,
    subreddit: row.subreddit,
    title: row.title,
    body: row.body ?? "",
    author: row.author ?? "",
    url: row.url ?? "",
    createdAt: row.created_utc ?? row.fetched_at,
    score: row.score ?? 0,
    authorKarma: row.author_karma ?? undefined,
  };
}

export function mapScoredPost(row: any, post: RedditPost): ScoredPost {
  return {
    id: row.id,
    productId: row.product_id,
    post,
    intentScore: row.intent_score,
    reason: row.reason ?? "",
    riskLevel: row.risk_level,
    dismissed: row.dismissed,
    createdAt: row.created_at,
  };
}

export function mapLead(row: any): Lead {
  return {
    id: row.id,
    productId: row.product_id,
    scoredPostId: row.scored_post_id,
    redditUsername: row.reddit_username,
    source: row.source,
    intentLabel: row.intent_label ?? "exploring",
    status: row.status,
    lastSeenAt: row.last_seen_at,
    notes: row.notes ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapLeadInteraction(row: any): LeadInteraction {
  return {
    id: row.id,
    leadId: row.lead_id,
    kind: row.kind,
    content: row.content,
    createdAt: row.created_at,
  };
}

export function mapWorkspaceSettings(row: any): WorkspaceSettings {
  return {
    productId: row.product_id,
    strictProfanityFilter: row.strict_profanity_filter,
    requireCompetitorMention: row.require_competitor_mention,
    minAuthorKarma: row.min_author_karma,
    maxPostAgeHours: row.max_post_age_hours,
    updatedAt: row.updated_at,
  };
}
