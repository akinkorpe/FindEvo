import OpenAI from "openai";

const OPENROUTER_BASE_URL =
  process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";
export const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";

export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: OPENROUTER_BASE_URL,
    });
  }
  return client;
}

export interface GenerateJSONArgs {
  system: string;
  user: string;
  model?: string;
  temperature?: number;
}

export async function generateJSON<T = unknown>({
  system,
  user,
  model = OPENROUTER_MODEL,
  temperature = 0.2,
}: GenerateJSONArgs): Promise<T> {
  const completion = await getClient().chat.completions.create({
    model,
    temperature,
    max_tokens: 2048,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const content = completion.choices[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(content) as T;
  } catch {
    throw new Error("OpenRouter did not return valid JSON");
  }
}
