import { handle } from "@/controllers/scorePosts.controller";
import { handleJson } from "../_utils";
import { requireUser } from "../_auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleJson(request, async (body) => {
    const user = await requireUser();
    return handle(body, user.id);
  });
}
