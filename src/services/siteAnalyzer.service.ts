import { generateJSON, isOpenAIConfigured } from "@/lib/openai";
import * as productsRepo from "@/repositories/products.repo";
import * as subredditsRepo from "@/repositories/subreddits.repo";
import * as credits from "@/repositories/aiCredits.repo";
import { RateLimitError } from "@/repositories/aiCredits.repo";
import { getSupabaseServer } from "@/lib/supabase";
import type { Product, ProductAnalysis, SurveyAnswers } from "@/types";

const MAX_HTML = 120_000;

async function fetchHtml(url: string): Promise<string> {
  const primary = await fetch(url, {
    redirect: "follow",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9,tr;q=0.8",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });

  if (primary.ok) return (await primary.text()).slice(0, MAX_HTML);

  // Some websites block server-side bots (403/401/429). Use a read-only fallback.
  if ([401, 403, 429].includes(primary.status)) {
    const readerUrl = `https://r.jina.ai/http://${url.replace(/^https?:\/\//i, "")}`;
    const fallback = await fetch(readerUrl, {
      headers: {
        "User-Agent": "redditleads-analyzer/0.1",
        Accept: "text/plain, text/html;q=0.9, */*;q=0.8",
      },
    });
    if (fallback.ok) return (await fallback.text()).slice(0, MAX_HTML);
  }

  throw new Error(`Failed to fetch site: ${primary.status}`);
}

async function fetchSiteText(url: string): Promise<string> {
  const html = await fetchHtml(url);

  const title = /<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1]?.trim() ?? "";
  const metaDesc =
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i.exec(
      html,
    )?.[1] ?? "";
  const ogDesc =
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i.exec(
      html,
    )?.[1] ?? "";

  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 6000);

  return [
    `URL: ${url}`,
    title && `TITLE: ${title}`,
    metaDesc && `DESC: ${metaDesc}`,
    ogDesc && `OG: ${ogDesc}`,
    `BODY: ${text}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function analyzeWebsite(
  url: string,
  survey?: SurveyAnswers | null,
): Promise<ProductAnalysis> {
  if (!isOpenAIConfigured()) {
    throw new Error(
      "OPENROUTER_API_KEY is not set. Add it to .env.local to enable site analysis.",
    );
  }

  const siteText = await fetchSiteText(url);

  const userPayload = survey
    ? `${siteText}\n\nUSER_CONTEXT: ${JSON.stringify(survey)}`
    : siteText;

  const analysis = await generateJSON<{
    name: string;
    niche: string;
    summary: string;
    buyerPersona: string;
    keywords: string[];
    subreddits: string[];
  }>({
    system: [
      "You analyze a product landing page and extract Reddit lead-gen targeting.",
      "Return valid JSON only.",
      "",
      "STEP 1 — Identify the BUYER, not the seller. Be INCLUSIVE — list all realistic buyer types.",
      "  • A creator-tools product → buyer is the creator (solo, agency, brand).",
      "  • A consumer search/discovery product → buyer is the end consumer (NOT creators on the platform).",
      "  • A B2B SaaS → buyer is anyone who would pay: founder, marketer, freelancer, small business owner, agency, dev.",
      "  • A marketplace → pick the SIDE the operator wants to acquire (usually demand-side).",
      "  Write `buyerPersona` as 1-2 sentences covering ALL realistic buyer types and their shared pain.",
      "  IMPORTANT: Do NOT narrow to a single role. 'Marketers, freelancers, and small business owners who struggle with X' is better than 'B2C marketers'.",
      "",
      "STEP 2 — Pick subreddits where THAT BUYER posts (not where competitors hang out).",
      "  • Prefer NICHE subreddits with high topical match over broad ones.",
      "  • AVOID generic catch-alls like r/marketing, r/socialmedia, r/entrepreneur, r/saas, r/freelance, r/digitalnomad UNLESS the buyer is literally one of those roles.",
      "  • HARD BAN — never include lifestyle/general-interest subs unless the product is *directly* about that interest:",
      "    r/Frugal, r/BuyItForLife, r/Awwducational, r/AskReddit, r/todayilearned, r/LifeProTips,",
      "    r/mildlyinteresting, r/explainlikeimfive, r/NoStupidQuestions, r/CasualConversation.",
      "    These are tempting because they're big, but their posts are off-topic noise that crowds out real leads.",
      "  • For NSFW / adult products, target consumer-discovery subs (e.g. r/OnlyFansSearch, r/FindOnlyFans) NOT creator-help subs (r/OnlyFansAdvice, r/sexworkers).",
      "  • Subreddits must actually exist and be active. No invented names.",
      "  • Self-check before emitting: for EACH subreddit, can you name a concrete post type a buyer would write there that signals intent for THIS product? If not, drop it.",
      "  • 6–10 items, ranked by buyer-fit (best first), without leading 'r/'.",
      "",
      "STEP 3 — Keywords are the words the buyer would TYPE while looking for a solution.",
      "  • Phrase like a question or pain-point ('how to find', 'tool for', 'looking for', 'best alternative').",
      "  • Avoid your own brand jargon. Avoid one-word terms that match everything.",
      "  • 8–14 items, lowercased, no hashtags.",
      "",
      "If USER_CONTEXT is provided, weight subreddit and keyword picks toward the user's goal/audience/industry.",
      "",
      'Schema: {"name": string, "niche": string, "summary": string (<= 280 chars), ' +
      '"buyerPersona": string (<= 200 chars), ' +
      '"keywords": string[] (8-14 items, lowercased, no hashtags), ' +
      '"subreddits": string[] (6-10 items, without leading r/, real and active)}',
    ].join("\n"),
    user: userPayload,
  });

  return {
    websiteUrl: url,
    name: analysis.name ?? "",
    niche: analysis.niche ?? "",
    summary: analysis.summary ?? "",
    buyerPersona: analysis.buyerPersona ?? "",
    keywords: Array.isArray(analysis.keywords) ? analysis.keywords : [],
    subreddits: Array.isArray(analysis.subreddits)
      ? analysis.subreddits.map((s) => s.replace(/^r\//i, ""))
      : [],
  };
}

export async function analyzeAndPersist(
  url: string,
  ownerId: string,
  survey?: SurveyAnswers | null,
): Promise<Product> {
  // If this user already has a product for this URL, enforce monthly analyze
  // limit against it. Different users analyzing the same URL each get their
  // own product row.
  const { data: existing } = await getSupabaseServer()
    .from("products")
    .select("id")
    .eq("owner_id", ownerId)
    .eq("website_url", url)
    .maybeSingle();

  if (existing?.id) {
    const limit = await credits.checkRateLimit(
      existing.id as string,
      "analyze_site",
      { userId: ownerId },
    );
    if (!limit.allowed) throw new RateLimitError(limit);
  }

  const analysis = await analyzeWebsite(url, survey);
  const product = await productsRepo.upsertProductFromAnalysis(analysis, ownerId);

  await subredditsRepo.replaceTargets(product.id, analysis.subreddits);
  await credits.recordUsage(product.id, "analyze_site", -1).catch(() => undefined);
  return product;
}
