import { handle } from "@/controllers/fetchPosts.controller";
import { handleJson } from "../_utils";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleJson(request, (body) => handle(body));
}
