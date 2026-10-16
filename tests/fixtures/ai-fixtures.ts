import type { AiBrief, AiConcept } from "../../src/lib/ai-contract.ts";
import { addDays } from "../../src/lib/schedule.ts";
export const brief: AiBrief = { genres: "Japanese city pop, 인디, nhạc điện tử", artists: "宇多田ヒカル, 잔나비, Ngọt", location: "Tokyo, Japan", startDate: "2027-08-22", length: 2, artistCount: 6, visualStyle: "Japanese City Pop", language: "日本語 / 한국어 / Tiếng Việt", prompt: "A fictional summer gathering", includeSchedule: true };
export function exampleConcept(input: AiBrief = brief): AiConcept {
  const names = Array.from({ length: input.artistCount }, (_, i) => `${["宇多田ヒカル", "잔나비", "Ngọt", "Dream Signal", "Neon Harbor", "Moon Garden"][i % 6]}${i >= 6 ? ` ${i + 1}` : ""}`);
  return { fictional: true, name: "東京 SOUNDS / 서울の夏", tagline: "音楽でつながる · Âm nhạc kết nối", tiers: [
    { name: "Headliners", artists: names.slice(0, 2) }, { name: "Main support", artists: names.slice(2, Math.ceil(names.length / 2) + 1) }, { name: "Discoveries", artists: names.slice(Math.ceil(names.length / 2) + 1) },
  ], posterTheme: { template: "japanese-city-pop", start: "#f7c9bb", end: "#f9ead4", accent: "#dc496c", text: "#253d61" }, schedule: input.includeSchedule ? {
    timeZone: "Asia/Tokyo", stages: ["Main stage", "Garden stage", "Night stage"],
    performances: names.map((artist, i) => { const day = addDays(input.startDate, i % input.length), hour = 12 + Math.floor(i / input.length / 3); return { artist, stage: ["Main stage", "Garden stage", "Night stage"][Math.floor(i / input.length) % 3], start: `${day}T${hour}:00`, end: `${day}T${hour + 1}:00` }; }),
  } : null };
}
export function sdkResponse(output: unknown = exampleConcept(), status = "completed") {
  return { id: "resp_test", object: "response", created_at: 0, model: "gpt-4.1-mini", status, output: [{ id: "msg_test", type: "message", role: "assistant", status: "completed", content: [{ type: "output_text", text: JSON.stringify(output), annotations: [] }] }], usage: { input_tokens: 100, output_tokens: 200, total_tokens: 300 } };
}
