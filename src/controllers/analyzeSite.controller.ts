import { analyzeAndPersist } from "@/services/siteAnalyzer.service";
import type { Product, SurveyAnswers } from "@/types";

export interface AnalyzeSiteInput {
  url: string;
  survey?: SurveyAnswers;
}

export interface AnalyzeSiteOutput {
  product: Product;
}

export function validateInput(raw: unknown): AnalyzeSiteInput {
  const input = raw as Partial<AnalyzeSiteInput> | null;
  if (!input || typeof input.url !== "string" || input.url.trim() === "") {
    throw new Error("`url` is required");
  }
  let url = input.url.trim();
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  try {
    new URL(url);
  } catch {
    throw new Error("`url` is not a valid URL");
  }
  return { url, survey: input.survey };
}

export async function handle(raw: unknown): Promise<AnalyzeSiteOutput> {
  const { url, survey } = validateInput(raw);
  const product = await analyzeAndPersist(url, survey);
  return { product };
}
