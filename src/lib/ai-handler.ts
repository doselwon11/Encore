import { aiBriefSchema, conceptToFestival, type AiBrief } from "./ai-contract.ts";
import { AiServiceError } from "./ai-provider.ts";
import { AiLimitLedger, createClientIdentity } from "./ai-limits.ts";

const MAX_BODY = 16000;
async function readBrief(request: Request): Promise<unknown> {
  if (Number(request.headers.get("content-length")) > MAX_BODY) throw new AiServiceError("body_limit", 413, "The brief is too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new AiServiceError("invalid_json", 400, "Send a festival brief as JSON.");
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => { timer = setTimeout(() => { void reader.cancel(); reject(new AiServiceError("body_timeout", 408, "The request took too long to upload.")); }, 5000); });
  try {
    const chunks: Uint8Array[] = []; let length = 0;
    while (true) {
      const part = await Promise.race([reader.read(), deadline]);
      if (part.done) break;
      length += part.value.length;
      if (length > MAX_BODY) { void reader.cancel(); throw new AiServiceError("body_limit", 413, "The brief is too large."); }
      chunks.push(part.value);
    }
    const bytes = new Uint8Array(length); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    try { return JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new AiServiceError("invalid_json", 400, "The festival brief isn’t valid JSON."); }
  } finally { clearTimeout(timer); reader.releaseLock(); }
}
export function createAiHandler({ configured, generate, allowedOrigin, ledger = new AiLimitLedger(), identity = createClientIdentity(), timeoutMs = 50000 }: {
  configured: () => boolean; generate: (brief: AiBrief, signal: AbortSignal) => Promise<unknown>; allowedOrigin?: string;
  ledger?: AiLimitLedger; identity?: ReturnType<typeof createClientIdentity>; timeoutMs?: number;
}) {
  return async function POST(request: Request): Promise<Response> {
    const headers = new Headers({ "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    let release: (() => void) | null = null, timer: ReturnType<typeof setTimeout> | undefined;
    try {
      if (request.method !== "POST") throw new AiServiceError("method", 405, "Use POST.");
      if (request.headers.get("origin") !== (allowedOrigin || new URL(request.url).origin) || request.headers.get("sec-fetch-site") === "cross-site") throw new AiServiceError("origin", 403, "Open the AI creator from Encore to generate a concept.");
      if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") throw new AiServiceError("content_type", 415, "Send the brief as application/json.");
      const parsed = aiBriefSchema.safeParse(await readBrief(request));
      if (!parsed.success) throw new AiServiceError("invalid_brief", 400, "Check the brief: genres, location, valid dates, 1–7 days, and 6–24 artists are required. Keep each field within its limit.");
      if (!configured()) throw new AiServiceError("not_configured", 503, "AI creation isn’t enabled on this server yet. Your existing festivals are unaffected.");
      const client = identity(request); headers.set("Set-Cookie", client.cookie);
      release = ledger.acquire(client.id);
      if (!release) { headers.set("Retry-After", "600"); throw new AiServiceError("rate_limit", 429, "AI creation is busy or your request limit was reached. Please try again later."); }
      const controller = new AbortController();
      const signal = AbortSignal.any([request.signal, controller.signal]);
      const deadline = new Promise<never>((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new AiServiceError("timeout", 504, "Generation timed out. Try fewer artists or omit the schedule.")); }, timeoutMs); });
      if (request.signal.aborted) throw new AiServiceError("cancelled", 408, "Generation was cancelled.");
      const output = await Promise.race([generate(parsed.data, signal), deadline]);
      let festival;
      try { festival = conceptToFestival(output, parsed.data); } catch { throw new AiServiceError("invalid_output", 502, "The AI returned an invalid lineup or schedule. Please try a simpler brief."); }
      return Response.json({ festival }, { headers });
    } catch (error) {
      const details = error as { status?: number; name?: string };
      const failure = error instanceof AiServiceError ? error
        : details.name === "ZodError" || details.name === "SyntaxError" ? new AiServiceError("invalid_output", 502, "The AI returned an unreadable concept. Please try again.")
        : details.name === "APIConnectionTimeoutError" || details.name === "AbortError" ? new AiServiceError("timeout", 504, "Generation timed out. Please try again.")
        : details.status === 429 ? new AiServiceError("upstream_limit", 503, "The AI service is busy. Please try again later.")
        : new AiServiceError("unavailable", 503, "AI creation is temporarily unavailable. Please try again later.");
      return Response.json({ error: failure.message, code: failure.code }, { status: failure.status, headers });
    } finally { clearTimeout(timer); release?.(); }
  };
}
