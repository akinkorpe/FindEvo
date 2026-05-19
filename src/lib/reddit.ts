import { ApifyClient } from "apify-client";
import type { RedditPost, SubredditRule } from "@/types";

const PUBLIC_BASE = "https://www.reddit.com";
const APIFY_ACTOR_DEFAULT = "trudax/reddit-scraper-lite";
const APIFY_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour per subreddit

function userAgent(): string {
  return (
    process.env.REDDIT_USER_AGENT ?? "web:findevo:1.0.0 (by /u/findevo_app)"
  );
}

export function isApifyConfigured(): boolean {
  return !!process.env.APIFY_TOKEN;
}

export class RedditNotFoundError extends Error {
  constructor(path: string) {
    super(`Reddit ${path} 404`);
    this.name = "RedditNotFoundError";
  }
}

// ────────────────────────────────────────────────────────────────────────
// Apify path — used in production where Vercel datacenter IPs are blocked
// by Reddit's anonymous endpoints.
// ────────────────────────────────────────────────────────────────────────

let apifyClient: ApifyClient | null = null;
function getApifyClient(): ApifyClient {
  if (!apifyClient) {
    apifyClient = new ApifyClient({ token: process.env.APIFY_TOKEN });
  }
  return apifyClient;
}

interface ApifyPostItem {
  dataType?: string;
  username?: string;
  title?: string;
  body?: string;
  upVotes?: number;
  numberOfComments?: number;
  communityName?: string;
  url?: string;
}

// In-memory cache; one process per Vercel lambda so this is per-instance.
// Good enough to absorb the burst of "feed open → scan 8 subs" repeat calls.
const apifyCache = new Map<
  string,
  { fetchedAt: number; posts: RedditPost[] }
>();

function buildSubredditUrl(name: string, keywords: string[]): string {
  const clean = name.replace(/^r\//i, "");
  if (keywords.length === 0) {
    return `${PUBLIC_BASE}/r/${encodeURIComponent(clean)}/new/`;
  }
  const words = Array.from(
    new Set(
      keywords
        .flatMap((k) => k.toLowerCase().split(/\s+/))
        .filter((w) => w.length >= 4),
    ),
  ).slice(0, 10);
  const q = words.length > 0 ? words.join(" OR ") : keywords[0];
  return `${PUBLIC_BASE}/r/${encodeURIComponent(clean)}/search/?q=${encodeURIComponent(
    q,
  )}&restrict_sr=on&sort=new`;
}

function parsePostIdFromUrl(url: string): string | null {
  // /r/<sub>/comments/<base36-id>/<slug>/
  const m = url.match(/\/comments\/([a-z0-9]+)\//i);
  return m ? `t3_${m[1]}` : null;
}

function mapApifyPost(item: ApifyPostItem): RedditPost | null {
  if (!item.url || !item.title) return null;
  const id = parsePostIdFromUrl(item.url);
  if (!id) return null;
  // Apify returns communityName like "r/indiehackers"; strip the prefix
  // including its trailing slash so we end up with just "indiehackers".
  const subreddit = (item.communityName ?? "")
    .replace(/^\/?r\//i, "")
    .trim();
  return {
    id,
    subreddit,
    title: item.title,
    body: item.body ?? "",
    author: item.username ?? "[deleted]",
    url: item.url,
    // Apify Reddit Scraper Lite doesn't return post timestamps. We're hitting
    // /new/ so posts are fresh — approximate with "now". Time-range filters
    // in the feed UI become coarse but won't hide real leads.
    createdAt: new Date().toISOString(),
    score: item.upVotes ?? 0,
  };
}

async function fetchPostsViaApify(
  subreddit: string,
  keywords: string[],
  limit: number,
): Promise<RedditPost[]> {
  const clean = subreddit.replace(/^r\//i, "");
  const cacheKey = `${clean.toLowerCase()}|${keywords.join(",").toLowerCase()}|${limit}`;
  const cached = apifyCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < APIFY_CACHE_TTL_MS) {
    return cached.posts;
  }

  const actorId = process.env.APIFY_ACTOR_ID ?? APIFY_ACTOR_DEFAULT;
  const startUrl = buildSubredditUrl(clean, keywords);
  const input = {
    startUrls: [{ url: startUrl }],
    maxItems: limit,
    skipComments: true,
    skipUserPosts: true,
    skipCommunity: true,
    proxy: { useApifyProxy: true },
  };

  const run = await getApifyClient().actor(actorId).call(input, {
    // Don't let a hung actor block the user past Next's maxDuration.
    timeout: 90,
    memory: 1024,
  });
  const { items } = await getApifyClient()
    .dataset(run.defaultDatasetId)
    .listItems();

  const posts = (items as unknown as ApifyPostItem[])
    .filter((it) => it.dataType === "post")
    .map(mapApifyPost)
    .filter((p): p is RedditPost => p !== null);

  apifyCache.set(cacheKey, { fetchedAt: Date.now(), posts });
  return posts;
}

async function subredditExistsViaApify(name: string): Promise<boolean> {
  // Apify doesn't expose a cheap /about probe. Treat it as "exists" and let
  // fetchPostsViaApify return empty for invalid subs — the controller already
  // handles empty results gracefully.
  return name.length > 0;
}

async function fetchRulesViaApify(_subreddit: string): Promise<SubredditRule[]> {
  // Rules aren't surfaced by the Lite actor. Returning [] keeps the rule
  // intelligence layer in "unclassified" state (yellow badge), which is the
  // intended fallback when rules can't be fetched.
  return [];
}

// ────────────────────────────────────────────────────────────────────────
// Public anonymous JSON path — kept as a local-dev fallback when APIFY_TOKEN
// isn't set. Vercel will always use the Apify path in production.
// ────────────────────────────────────────────────────────────────────────

async function publicFetch(
  path: string,
  queryParams: string = "",
): Promise<unknown> {
  const res = await fetch(`${PUBLIC_BASE}${path}.json${queryParams}`, {
    headers: { "User-Agent": userAgent() },
  });
  if (res.status === 404) throw new RedditNotFoundError(path);
  if (!res.ok) throw new Error(`Reddit ${path} ${res.status}`);
  return res.json();
}

interface RedditListing {
  data: { children: Array<{ data: RedditPostRaw }> };
}
interface RedditPostRaw {
  id: string;
  name: string;
  subreddit: string;
  title: string;
  selftext: string;
  author: string;
  permalink: string;
  score: number;
  created_utc: number;
}
interface RedditRulesResponse {
  rules: Array<{ short_name: string; description: string }>;
}

async function fetchPostsViaPublic(
  subreddit: string,
  keywords: string[],
  limit: number,
): Promise<RedditPost[]> {
  const clean = subreddit.replace(/^r\//i, "");
  let path = `/r/${encodeURIComponent(clean)}/new`;
  let queryParams = `?limit=${limit}`;

  if (keywords.length > 0) {
    path = `/r/${encodeURIComponent(clean)}/search`;
    const words = Array.from(
      new Set(
        keywords
          .flatMap((k) => k.toLowerCase().split(/\s+/))
          .filter((w) => w.length >= 4),
      ),
    ).slice(0, 10);
    const q = words.length > 0 ? words.join(" OR ") : keywords[0];
    queryParams = `?q=${encodeURIComponent(q)}&restrict_sr=on&sort=new&limit=${limit}`;
  }

  const data = (await publicFetch(path, queryParams)) as RedditListing;
  const rows = data?.data?.children ?? [];
  return rows.map((c) => ({
    id: c.data.name,
    subreddit: c.data.subreddit,
    title: c.data.title,
    body: c.data.selftext ?? "",
    author: c.data.author,
    url: `https://www.reddit.com${c.data.permalink}`,
    createdAt: new Date(c.data.created_utc * 1000).toISOString(),
    score: c.data.score,
  }));
}

// ────────────────────────────────────────────────────────────────────────
// Public API — same signatures as before; routes to Apify when configured.
// ────────────────────────────────────────────────────────────────────────

export async function fetchPosts(
  subreddit: string,
  keywords: string[] = [],
  limit = 25,
): Promise<RedditPost[]> {
  const posts = isApifyConfigured()
    ? await fetchPostsViaApify(subreddit, keywords, limit)
    : await fetchPostsViaPublic(subreddit, keywords, limit);

  if (keywords.length === 0) return posts;
  const needles = Array.from(
    new Set(
      keywords
        .flatMap((k) => k.toLowerCase().split(/\s+/))
        .filter((w) => w.length >= 4),
    ),
  );
  return posts.filter((p) => {
    const hay = `${p.title} ${p.body}`.toLowerCase();
    return needles.some((n) => hay.includes(n));
  });
}

export async function subredditExists(name: string): Promise<boolean> {
  if (isApifyConfigured()) return subredditExistsViaApify(name);
  const clean = name.replace(/^r\//i, "");
  try {
    const data = (await publicFetch(`/r/${encodeURIComponent(clean)}/about`)) as {
      kind?: string;
    };
    return data?.kind === "t5";
  } catch {
    return false;
  }
}

export interface SubredditSuggestion {
  name: string;
  subscribers: number | null;
  description: string | null;
}

// Reddit's autocomplete endpoint. Public, no auth needed. May 403 from Vercel
// datacenter IPs — caller should treat empty/error as "no suggestions" and
// fall back to a local seed list rather than failing the request.
export async function searchSubreddits(
  query: string,
  limit = 8,
): Promise<SubredditSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    const res = await fetch(
      `${PUBLIC_BASE}/api/subreddit_autocomplete_v2.json?query=${encodeURIComponent(
        q,
      )}&limit=${limit}&include_over_18=false&include_profiles=false`,
      { headers: { "User-Agent": userAgent() }, next: { revalidate: 300 } },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as {
      data?: {
        children?: Array<{
          data?: {
            display_name?: string;
            subscribers?: number;
            public_description?: string;
          };
        }>;
      };
    };
    const rows = data?.data?.children ?? [];
    return rows
      .map((c) => c.data)
      .filter((d): d is NonNullable<typeof d> => !!d?.display_name)
      .map((d) => ({
        name: d.display_name!,
        subscribers: d.subscribers ?? null,
        description: d.public_description?.trim() || null,
      }));
  } catch {
    return [];
  }
}

/**
 * Fetch a subreddit's posted rules.
 *
 * The Apify scraper-lite actor we use for posts doesn't return rules, so
 * `fetchRulesViaApify` would just give us `[]` — and that's what shipped to
 * production for weeks, making the "Safe to Engage" badge meaningless and
 * leaving the approach-guide AI rules-blind.
 *
 * Reddit's `/about/rules.json` endpoint is much less aggressively rate-
 * limited than the listings endpoints, so we try it first from every
 * environment, datacenter IP included. If it returns 403 / 429 / 5xx the
 * try/catch in `getRuleIntelligence` swallows it into `[]` and we end up in
 * the same state as before (yellow "Classifier unavailable" badge) — so the
 * worst case is no regression, and the common case is real rules.
 */
export async function fetchRules(subreddit: string): Promise<SubredditRule[]> {
  const clean = subreddit.replace(/^r\//i, "");
  try {
    const data = (await publicFetch(
      `/r/${encodeURIComponent(clean)}/about/rules`,
    )) as RedditRulesResponse;
    return (data.rules ?? []).map((r) => ({
      subreddit: clean,
      title: r.short_name,
      description: r.description ?? "",
    }));
  } catch {
    // Datacenter IP block, transient 5xx, malformed body — collapse to
    // the historical Apify-path behaviour rather than leaking the error.
    return fetchRulesViaApify(clean);
  }
}
