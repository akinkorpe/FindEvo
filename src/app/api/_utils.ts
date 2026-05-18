import { NextResponse } from "next/server";
import { RateLimitError } from "@/repositories/aiCredits.repo";
import { PlanLimitError } from "@/lib/planGate";
import { UnauthorizedError } from "./_auth";

export async function handleJson<T>(
  request: Request,
  run: (body: unknown) => Promise<T>,
): Promise<Response> {
  try {
    const body = await request.json().catch(() => ({}));
    const result = await run(body);
    return NextResponse.json({ ok: true, ...(result as object) });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 401 });
    }
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        {
          ok: false,
          error: err.message,
          rateLimit: err.status,
          // Mirrored as `planLimit` so the frontend can treat both error
          // shapes the same way — both carry plan + upgradeTo.
          planLimit: err.status,
        },
        { status: 429 },
      );
    }
    if (err instanceof PlanLimitError) {
      return NextResponse.json(
        {
          ok: false,
          error: err.message,
          planLimit: err.status,
        },
        { status: 429 },
      );
    }
    const message = err instanceof Error ? err.message : "bad request";
    const status = /not found/i.test(message)
      ? 404
      : /required|missing|not set|invalid/i.test(message)
        ? 400
        : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
