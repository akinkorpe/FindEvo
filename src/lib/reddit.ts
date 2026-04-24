import type { RedditPost, SubredditRule } from "@/types";

const TOKEN_URL = "https://www.reddit.com/api/v1/access_token";
const OAUTH_BASE = "https://oauth.reddit.com";
const PUBLIC_BASE = "https://www.reddit.com";

export function isRedditConfigured(): boolean {
  // MVP için OAuth zorunluluğunu kaldırdık, her zaman false dönüyoruz ki public fallback çalışsın
  // Uygulama public JSON endpointleri üzerinden çalışacak.
  return false;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAppToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value;
  }

  const id = process.env.REDDIT_CLIENT_ID;
  const secret = process.env.REDDIT_CLIENT_SECRET;
  if (!id || !secret) {
    // Key yoksa boş dönüyoruz, istekler public URL'den atılacak
    return "";
  }

  const basic = Buffer.from(`${id}:${secret}`).toString("base64");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": process.env.REDDIT_USER_AGENT ?? "redditleads/0.1",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`Reddit auth failed: ${res.status}`);

  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return cachedToken.value;
}

async function authedFetch(path: string, queryParams: string = ""): Promise<unknown> {
  if (isRedditConfigured()) {
    const token = await getAppToken();
    const res = await fetch(`${OAUTH_BASE}${path}${queryParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": process.env.REDDIT_USER_AGENT ?? "redditleads/0.1",
      },
    });
    if (!res.ok) throw new Error(`Reddit ${path} ${res.status}`);
    return res.json();
  }

  // Fallback: public JSON (rate-limited, anonymous). Lets dev work without creds.
  // Parametreleri .json'dan SONRA eklemeliyiz (örn: /r/webdev/new.json?limit=5)
  const res = await fetch(`${PUBLIC_BASE}${path}.json${queryParams}`, {
    headers: {
      "User-Agent": process.env.REDDIT_USER_AGENT ?? "redditleads/0.1",
    },
  });
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
  author_fullname?: string;
  created_utc: number;
}

interface RedditRulesResponse {
  rules: Array<{ short_name: string; description: string }>;
}

export async function fetchPosts(
  subreddit: string,
  keywords: string[] = [],
  limit = 25,
): Promise<RedditPost[]> {
  const clean = subreddit.replace(/^r\//i, "");
  let path = `/r/${encodeURIComponent(clean)}/new`;
  let queryParams = `?limit=${limit}`;

  // If keywords exist, use the search endpoint for much better recall
  if (keywords.length > 0) {
    path = `/r/${encodeURIComponent(clean)}/search`;
    const q = keywords.map(k => `"${k}"`).join(" OR ");
    queryParams = `?q=${encodeURIComponent(q)}&restrict_sr=on&sort=new&limit=${limit}`;
  }

  const data = (await authedFetch(path, queryParams)) as RedditListing;

  const rows = data?.data?.children ?? [];
  const posts: RedditPost[] = rows.map((c) => ({
    id: c.data.name,
    subreddit: c.data.subreddit,
    title: c.data.title,
    body: c.data.selftext ?? "",
    author: c.data.author,
    url: `https://www.reddit.com${c.data.permalink}`,
    createdAt: new Date(c.data.created_utc * 1000).toISOString(),
    score: c.data.score,
  }));

  if (keywords.length === 0) return posts;
  
  // We still do a lightweight local filter to ensure relevance, 
  // but now we're searching over Reddit's actual search results
  const needles = keywords.map((k) => k.toLowerCase());
  return posts.filter((p) => {
    const hay = `${p.title} ${p.body}`.toLowerCase();
    return needles.some((n) => hay.includes(n));
  });
}

export async function fetchRules(subreddit: string): Promise<SubredditRule[]> {
  const clean = subreddit.replace(/^r\//i, "");
  const data = (await authedFetch(
    `/r/${encodeURIComponent(clean)}/about/rules`,
  )) as RedditRulesResponse;

  return (data.rules ?? []).map((r) => ({
    subreddit: clean,
    title: r.short_name,
    description: r.description ?? "",
  }));
}
