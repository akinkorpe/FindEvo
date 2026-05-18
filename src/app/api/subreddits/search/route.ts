import { NextResponse } from "next/server";
import { searchSubreddits, type SubredditSuggestion } from "@/lib/reddit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Seed list used when Reddit's autocomplete endpoint can't be reached (e.g.
// Vercel datacenter IPs getting 403). Substring-matched client-side via the
// same response shape, so the UI doesn't need a separate code path.
const POPULAR_SUBREDDITS: SubredditSuggestion[] = [
  { name: "SaaS", subscribers: 130000, description: "Software as a Service" },
  { name: "Entrepreneur", subscribers: 4000000, description: "Entrepreneurship and startups" },
  { name: "smallbusiness", subscribers: 1900000, description: "Small business owners" },
  { name: "startups", subscribers: 1500000, description: "Startup discussion" },
  { name: "indiehackers", subscribers: 80000, description: "Indie makers and bootstrappers" },
  { name: "marketing", subscribers: 1700000, description: "Marketing professionals" },
  { name: "digital_marketing", subscribers: 230000, description: "Digital marketing tactics" },
  { name: "SEO", subscribers: 300000, description: "Search engine optimization" },
  { name: "copywriting", subscribers: 130000, description: "Copywriting craft" },
  { name: "content_marketing", subscribers: 30000, description: "Content strategy" },
  { name: "webdev", subscribers: 2000000, description: "Web development" },
  { name: "Frontend", subscribers: 100000, description: "Frontend engineering" },
  { name: "reactjs", subscribers: 400000, description: "React.js" },
  { name: "nextjs", subscribers: 90000, description: "Next.js framework" },
  { name: "node", subscribers: 240000, description: "Node.js runtime" },
  { name: "programming", subscribers: 6000000, description: "Programming in general" },
  { name: "learnprogramming", subscribers: 4000000, description: "Programming beginners" },
  { name: "freelance", subscribers: 220000, description: "Freelance work" },
  { name: "agency", subscribers: 8000, description: "Marketing/dev agencies" },
  { name: "Productivity", subscribers: 1500000, description: "Productivity tools and habits" },
  { name: "Notion", subscribers: 320000, description: "Notion power users" },
  { name: "ObsidianMD", subscribers: 180000, description: "Obsidian note-taking" },
  { name: "selfhosted", subscribers: 350000, description: "Self-hosted software" },
  { name: "homelab", subscribers: 800000, description: "Home server setups" },
  { name: "sysadmin", subscribers: 900000, description: "System administrators" },
  { name: "devops", subscribers: 250000, description: "DevOps engineering" },
  { name: "ecommerce", subscribers: 320000, description: "Ecommerce operators" },
  { name: "shopify", subscribers: 200000, description: "Shopify merchants" },
  { name: "Wordpress", subscribers: 200000, description: "WordPress users" },
  { name: "personalfinance", subscribers: 19000000, description: "Personal finance" },
  { name: "Fitness", subscribers: 12000000, description: "Fitness and training" },
  { name: "loseit", subscribers: 4000000, description: "Weight loss support" },
  { name: "ArtificialIntelligence", subscribers: 1000000, description: "AI discussion" },
  { name: "ChatGPT", subscribers: 9000000, description: "ChatGPT users" },
  { name: "OpenAI", subscribers: 2400000, description: "OpenAI ecosystem" },
  { name: "LocalLLaMA", subscribers: 380000, description: "Self-hosted LLMs" },
];

function seedMatches(q: string, limit: number): SubredditSuggestion[] {
  const needle = q.toLowerCase();
  return POPULAR_SUBREDDITS.filter((s) =>
    s.name.toLowerCase().includes(needle),
  ).slice(0, limit);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ ok: true, suggestions: [] });
  }
  const limit = Math.min(
    20,
    Math.max(1, Number(url.searchParams.get("limit") ?? "8")),
  );

  const remote = await searchSubreddits(q, limit);
  if (remote.length > 0) {
    return NextResponse.json({ ok: true, suggestions: remote });
  }
  // Reddit unreachable or no remote matches — fall back to local seed so the
  // user still sees something instead of a dead dropdown.
  return NextResponse.json({
    ok: true,
    suggestions: seedMatches(q, limit),
  });
}
