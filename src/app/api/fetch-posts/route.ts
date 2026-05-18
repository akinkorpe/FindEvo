import { handle } from "@/controllers/fetchPosts.controller";
import { handleJson } from "../_utils";
import { requireUser } from "../_auth";

export const runtime = "nodejs";
export const maxDuration = 120; // seconds — scoring 50 posts in parallel needs time

export async function POST(request: Request) {
  return handleJson(request, async (body) => {
    const user = await requireUser();
    try {
      return await handle(body, user.id);
    } catch (err) {
      console.error("[/api/fetch-posts] failed", err);
      throw err;
    }
  });
}
