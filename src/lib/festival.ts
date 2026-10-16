import type { FestivalSchedule } from "./schedule.ts";
import type { PosterDesign } from "./poster-design.ts";

export type Palette = "ultraviolet" | "sunset" | "afterhours";
export type Tier = { id: string; name: string; artists: string[] };
export type Festival = { name: string; date: string; location: string; tagline: string; palette: Palette; tiers: Tier[]; design?: PosterDesign; schedule?: FestivalSchedule; concept?: { source: "ai"; fictional: true } };
export const initialFestival: Festival = {
  name: "AFTERGLOW", date: "AUGUST 22–24, 2026", location: "JOSHUA TREE, CALIFORNIA",
  tagline: "Three nights. Infinite possibilities.", palette: "ultraviolet",
  tiers: [
    { id: "headliners", name: "Headliners", artists: ["RÜFÜS DU SOL", "TAME IMPALA", "ODESZA"] },
    { id: "support", name: "Main support", artists: ["JUNGLE", "FRED AGAIN..", "KAYTRANADA", "DISCLOSURE", "PEGGY GOU", "BONOBO"] },
    { id: "discovery", name: "Discovery", artists: ["BARRY CAN’T SWIM", "BICEP", "MARIBOU STATE", "SALUTE", "TSHA", "BEN BÖHMER", "DJ SEINFELD", "NEIL FRANCES"] },
  ],
};
export function isFestival(value: unknown): value is Festival {
  if (!value || typeof value !== "object") return false;
  const f = value as Festival;
  if (![f.name, f.date, f.location, f.tagline].every(v => typeof v === "string") || !["ultraviolet", "sunset", "afterhours"].includes(f.palette) || !Array.isArray(f.tiers) || f.tiers.length > 8) return false;
  const ids = new Set<string>();
  return f.tiers.every(t => {
    if (!t || typeof t !== "object" || typeof t.id !== "string" || !t.id || ids.has(t.id) || typeof t.name !== "string" || !Array.isArray(t.artists) || !t.artists.every(a => typeof a === "string")) return false;
    ids.add(t.id); return true;
  });
}
