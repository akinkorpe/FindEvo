import { NextResponse } from "next/server";
import { saveSurveyAnswers } from "@/repositories/products.repo";
import type { SurveyAnswers } from "@/types";

export const runtime = "nodejs";

const GOALS = ["customers", "competitors", "content", "community"] as const;
const AUDIENCES = ["b2b", "b2c", "both"] as const;
const CURRENTS = ["manual", "other_tool", "none"] as const;
const REACHES = ["1-10", "10-50", "50+"] as const;
const REACTIONS = ["try", "follow", "contact", "buy"] as const;
const INDUSTRIES = ["saas", "ecommerce", "content", "consulting", "other"] as const;

function isOneOf<T extends readonly string[]>(
  arr: T,
  v: unknown,
): v is T[number] {
  return typeof v === "string" && (arr as readonly string[]).includes(v);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      productId?: string;
      answers?: Partial<SurveyAnswers>;
    };
    if (!body.productId) throw new Error("`productId` required");
    const a = body.answers ?? {};
    if (
      !isOneOf(GOALS, a.goal) ||
      !isOneOf(AUDIENCES, a.audience) ||
      !isOneOf(CURRENTS, a.current) ||
      !isOneOf(REACHES, a.reach) ||
      !isOneOf(REACTIONS, a.reaction) ||
      !isOneOf(INDUSTRIES, a.industry)
    ) {
      throw new Error("invalid survey answers");
    }
    const answers: SurveyAnswers = {
      goal: a.goal,
      audience: a.audience,
      current: a.current,
      reach: a.reach,
      reaction: a.reaction,
      industry: a.industry,
    };
    const product = await saveSurveyAnswers(body.productId, answers);
    return NextResponse.json({ ok: true, product });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
