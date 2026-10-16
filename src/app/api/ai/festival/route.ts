import "server-only";
import OpenAI from "openai";
import { createAiHandler } from "@/lib/ai-handler";
import { createOpenAiGenerator } from "@/lib/ai-provider";

export const maxDuration = 60;
export const POST = createAiHandler({
  configured: () => process.env.AI_CREATE_ENABLED === "true" && !!process.env.OPENAI_API_KEY,
  allowedOrigin: process.env.APP_ORIGIN,
  generate: (brief, signal) => createOpenAiGenerator(new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 45000, maxRetries: 0 }), process.env.OPENAI_MODEL || "gpt-4.1-mini")(brief, signal),
});
