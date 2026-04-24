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
    keywords: string[];
    subreddits: string[];
  }>({
    system:
      "You analyze a SaaS/product landing page and extract structured lead-gen context. " +
      "Return valid JSON only. Pick subreddits that real buyers of this product browse. " +
      "If USER_CONTEXT is provided, let the user's goal/audience/industry bias the subreddit and keyword picks. " +
      'Schema: {"name": string, "niche": string, "summary": string (<= 280 chars), ' +
      '"keywords": string[] (8-14 items, lowercased, no hashtags), ' +
      '"subreddits": string[] (6-12 items, without leading r/, realistic)}',
    user: userPayload,
  });

  return {
    websiteUrl: url,
    name: analysis.name ?? "",
    niche: analysis.niche ?? "",
    summary: analysis.summary ?? "",
    keywords: Array.isArray(analysis.keywords) ? analysis.keywords : [],
    subreddits: Array.isArray(analysis.subreddits)
      ? analysis.subreddits.map((s) => s.replace(/^r\//i, ""))
      : [],
  };
}

export async function analyzeAndPersist(
  url: string,
  survey?: SurveyAnswers | null,
): Promise<Product> {
  // If a product already exists for this URL, enforce monthly analyze limit against it.
  const { data: existing } = await getSupabaseServer()
    .from("products")
    .select("id")
    .eq("website_url", url)
    .maybeSingle();

  if (existing?.id) {
    const limit = await credits.checkRateLimit(
      existing.id as string,
      "analyze_site",
      1,
    );
    if (!limit.allowed) throw new RateLimitError(limit);
  }

  const analysis = await analyzeWebsite(url, survey);
  const product = await productsRepo.upsertProductFromAnalysis(analysis);

  await subredditsRepo.replaceTargets(product.id, analysis.subreddits);
  await credits.recordUsage(product.id, "analyze_site", -1).catch(() => undefined);
  return product;
}
