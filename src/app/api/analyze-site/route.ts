import { handle } from "@/controllers/analyzeSite.controller";
import { handleJson } from "../_utils";
import { requireUser } from "../_auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  return handleJson(request, async (body) => {
    const user = await requireUser();
    return handle(body, user.id);
  });
}
