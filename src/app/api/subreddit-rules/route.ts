import { fetchSubredditRules } from "@/services/redditIngestion.service";
import { handleJson } from "../_utils";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleJson(request, async (body) => {
    const b = body as { subreddit?: unknown };
    if (typeof b.subreddit !== "string" || b.subreddit.trim() === "") {
      throw new Error("`subreddit` is required");
    }
    const rules = await fetchSubredditRules(b.subreddit.trim());
    return { rules };
  });
}
