import { z } from "zod";
import { templateDesign, type TemplateId } from "./poster-design.ts";
import { addDays, artistKey, isSchedule, scheduleConflicts, stageColors, validDate, type FestivalSchedule } from "./schedule.ts";
import type { Festival } from "./festival.ts";

export const FICTIONAL_NOTICE = "Fictional concept — artist suggestions, not actual bookings.";
export const aiBriefSchema = z.object({
  genres: z.string().trim().min(1).max(500), artists: z.string().trim().max(800),
  location: z.string().trim().min(1).max(160), startDate: z.string().refine(validDate, "Choose a valid start date."),
  length: z.number().int().min(1).max(7), artistCount: z.number().int().min(6).max(24),
  visualStyle: z.string().trim().max(600), language: z.string().trim().max(60),
  prompt: z.string().trim().max(1200), includeSchedule: z.boolean(),
}).strict().refine(brief => { try { addDays(brief.startDate, brief.length); return true; } catch { return false; } }, "The festival dates are outside the supported calendar.");
export type AiBrief = z.infer<typeof aiBriefSchema>;
const templateIds = ["neon-waves", "tokyo-nights", "golden-hour", "minimalist", "retro-festival", "japanese-city-pop", "brutalist", "psychedelic", "editorial", "cyber-rave", "botanical"] as const;
const text = (max: number) => z.string().min(1).max(max);
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const aiConceptSchema = z.object({
  fictional: z.literal(true), name: text(160), tagline: text(90),
  tiers: z.array(z.object({ name: text(50), artists: z.array(text(100)).min(1).max(12) }).strict()).min(2).max(4),
  posterTheme: z.object({ template: z.enum(templateIds), start: color, end: color, accent: color, text: color }).strict(),
  schedule: z.object({
    timeZone: z.string().max(80), stages: z.array(text(60)).min(1).max(3),
    performances: z.array(z.object({ artist: text(100), stage: text(60), start: text(16), end: text(16) }).strict()).min(1).max(24),
  }).strict().nullable(),
}).strict();
export type AiConcept = z.infer<typeof aiConceptSchema>;
export function conceptToFestival(value: unknown, brief: AiBrief): Festival {
  const concept = aiConceptSchema.parse(value);
  const artists = concept.tiers.flatMap(tier => tier.artists);
  if (artists.length !== brief.artistCount || new Set(artists.map(artistKey)).size !== artists.length || artists.some(artist => !artist.trim())) throw new Error("The generated lineup has missing or duplicate artists.");
  const days = Array.from({ length: brief.length }, (_, i) => addDays(brief.startDate, i));
  let schedule: FestivalSchedule | undefined;
  if (brief.includeSchedule && concept.schedule) {
    const raw = concept.schedule;
    if (new Set(raw.stages.map(artistKey)).size !== raw.stages.length) throw new Error("Duplicate stages.");
    const stages = raw.stages.map((name, i) => ({ id: crypto.randomUUID(), name, color: stageColors[i] }));
    schedule = { version: 1, timeZone: raw.timeZone, days, stages, performances: raw.performances.map(p => ({ id: crypto.randomUUID(), artist: p.artist, stageId: stages.find(stage => stage.name === p.stage)?.id || "", start: p.start, end: p.end })) };
    if (!isSchedule(schedule) || schedule.performances.length !== artists.length || new Set(schedule.performances.map(p => artistKey(p.artist))).size !== artists.length || schedule.performances.some(p => !artists.some(artist => artistKey(artist) === artistKey(p.artist))) || scheduleConflicts(schedule).length) throw new Error("The generated schedule has invalid dates, references or conflicts.");
  } else if (brief.includeSchedule) throw new Error("The requested schedule is missing.");
  const design = templateDesign(concept.posterTheme.template as TemplateId);
  design.background = { ...design.background, ...Object.fromEntries(Object.entries(concept.posterTheme).filter(([key]) => key !== "template")) };
  return {
    name: concept.name, tagline: concept.tagline, location: brief.location,
    date: days.length === 1 ? days[0] : `${days[0]} – ${days.at(-1)}`, palette: "ultraviolet",
    tiers: concept.tiers.map(tier => ({ ...tier, id: crypto.randomUUID() })), design,
    ...(schedule ? { schedule } : {}), concept: { source: "ai", fictional: true },
  };
}
