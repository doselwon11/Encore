export type Stage = { id: string; name: string; color: string };
export type Performance = { id: string; artist: string; stageId: string; start: string; end: string };
export type FestivalSchedule = { version: 1; timeZone: string; days: string[]; stages: Stage[]; performances: Performance[] };
export type ScheduleConflict = { kind: "stage-overlap" | "artist-overlap" | "repeat-artist"; severity: "error" | "warning"; ids: [string, string]; message: string };
export type DaySegment = { performance: Performance; start: number; end: number; continuesBefore: boolean; continuesAfter: boolean };
export const emptySchedule = (): FestivalSchedule => ({ version: 1, timeZone: "", days: [], stages: [], performances: [] });
export const stageColors = ["#a78bfa", "#f472b6", "#67e8f9", "#fbbf24", "#86efac", "#fb923c"];

export function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value < "1900-01-01" || value > "9999-12-31") return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function validTimeZone(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (!value) return true;
  try { new Intl.DateTimeFormat("en", { timeZone: value }).format(0); return true; } catch { return false; }
}
export function validLocalTime(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/.test(value) && validDate(value.slice(0, 10));
}
// UTC is used only as a Gregorian calendar calculator. These serial minutes are
// festival wall-clock values, NOT UTC instants or browser-local Date objects.
export function localMinute(value: string): number {
  if (!validLocalTime(value)) throw new Error("Choose a valid local date and time.");
  return Date.parse(`${value}:00Z`) / 60000;
}
export function localTimeAt(value: number): string {
  const result = new Date(value * 60000).toISOString().slice(0, 16);
  if (!validLocalTime(result)) throw new Error("The resulting date is outside the supported calendar.");
  return result;
}
export function addDays(date: string, days: number): string { return localTimeAt(localMinute(`${date}T00:00`) + days * 1440).slice(0, 10); }
export function artistKey(artist: string): string { return artist.normalize("NFKC").trim().replace(/\s+/gu, " ").toLocaleLowerCase("en"); }
export function artistNames(names: string[]): string[] {
  const found = new Set<string>();
  return names.filter(name => { const key = artistKey(name); if (!key || found.has(key)) return false; found.add(key); return true; });
}
export function performanceErrors(performance: Performance, schedule: FestivalSchedule): string[] {
  const errors: string[] = [];
  if (!performance.artist.trim()) errors.push("Choose an artist or enter a guest artist name.");
  if (!schedule.stages.some(stage => stage.id === performance.stageId)) errors.push("Choose an existing stage.");
  if (!validLocalTime(performance.start) || !validLocalTime(performance.end)) return [...errors, "Enter valid festival-local dates and times."];
  if (!schedule.days.includes(performance.start.slice(0, 10))) errors.push("The start date must be an added festival day.");
  const duration = localMinute(performance.end) - localMinute(performance.start);
  if (duration <= 0) errors.push("End must be after start. For an overnight set, select Ends next day.");
  if (duration > 1440) errors.push("A performance can last up to 24 hours.");
  return errors;
}
export function isSchedule(value: unknown): value is FestivalSchedule {
  if (!value || typeof value !== "object") return false;
  const s = value as FestivalSchedule;
  if (s.version !== 1 || !validTimeZone(s.timeZone) || !Array.isArray(s.days) || !s.days.every(validDate) || new Set(s.days).size !== s.days.length || !Array.isArray(s.stages) || !Array.isArray(s.performances)) return false;
  const stageIds = new Set<string>(), performanceIds = new Set<string>();
  if (!s.stages.every(stage => {
    if (!stage || typeof stage.id !== "string" || !stage.id || stageIds.has(stage.id) || typeof stage.name !== "string" || !stage.name.trim() || !/^#[0-9a-f]{6}$/i.test(stage.color)) return false;
    stageIds.add(stage.id); return true;
  })) return false;
  return s.performances.every(p => {
    if (!p || typeof p.id !== "string" || !p.id || performanceIds.has(p.id) || typeof p.artist !== "string" || typeof p.stageId !== "string") return false;
    if (performanceErrors(p, s).length) return false;
    performanceIds.add(p.id); return true;
  });
}
export function readSchedule(value: unknown): { schedule: FestivalSchedule; invalid: boolean } {
  if (value === undefined) return { schedule: emptySchedule(), invalid: false };
  return isSchedule(value) ? { schedule: value, invalid: false } : { schedule: emptySchedule(), invalid: true };
}
export function scheduleConflicts(schedule: FestivalSchedule): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];
  const sets = schedule.performances;
  for (let i = 0; i < sets.length; i++) for (let j = i + 1; j < sets.length; j++) {
    const a = sets[i], b = sets[j], ids: [string, string] = [a.id, b.id];
    const overlap = localMinute(a.start) < localMinute(b.end) && localMinute(b.start) < localMinute(a.end);
    if (overlap && a.stageId === b.stageId) conflicts.push({ kind: "stage-overlap", severity: "error", ids, message: `${a.artist} and ${b.artist} overlap on ${schedule.stages.find(stage => stage.id === a.stageId)?.name}.` });
    if (artistKey(a.artist) === artistKey(b.artist)) conflicts.push(overlap
      ? { kind: "artist-overlap", severity: "error", ids, message: `Duplicate booking: ${a.artist} is performing in two overlapping slots.` }
      : { kind: "repeat-artist", severity: "warning", ids, message: `${a.artist} is booked more than once. These sets don’t overlap; confirm the repeat booking is intentional.` });
  }
  return conflicts;
}
export function movePerformance(performance: Performance, stageId: string, start: string): Performance {
  const duration = localMinute(performance.end) - localMinute(performance.start);
  return { ...performance, stageId, start, end: localTimeAt(localMinute(start) + duration) };
}
export function upsertPerformance(schedule: FestivalSchedule, performance: Performance): FestivalSchedule {
  const errors = performanceErrors(performance, schedule);
  if (errors.length) throw new Error(errors.join(" "));
  return { ...schedule, performances: [...schedule.performances.filter(p => p.id !== performance.id), { ...performance, artist: performance.artist.trim() }] };
}
export function removeStage(schedule: FestivalSchedule, id: string): FestivalSchedule {
  return { ...schedule, stages: schedule.stages.filter(stage => stage.id !== id), performances: schedule.performances.filter(p => p.stageId !== id) };
}
export function removeDay(schedule: FestivalSchedule, day: string): FestivalSchedule {
  return { ...schedule, days: schedule.days.filter(date => date !== day), performances: schedule.performances.filter(p => p.start.slice(0, 10) !== day) };
}
export function scheduleDays(schedule: FestivalSchedule): string[] {
  return [...new Set([...schedule.days, ...schedule.performances.map(p => localTimeAt(localMinute(p.end) - 1).slice(0, 10))])].sort();
}
export function daySegments(schedule: FestivalSchedule, date: string): DaySegment[] {
  const dayStart = localMinute(`${date}T00:00`), dayEnd = dayStart + 1440;
  return schedule.performances.flatMap(performance => {
    const start = localMinute(performance.start), end = localMinute(performance.end);
    return start < dayEnd && end > dayStart ? [{ performance, start: Math.max(start, dayStart) - dayStart, end: Math.min(end, dayEnd) - dayStart, continuesBefore: start < dayStart, continuesAfter: end > dayEnd }] : [];
  });
}
export function timelineBounds(segments: DaySegment[], fullDay = false): [number, number] {
  if (fullDay) return [0, 1440];
  if (!segments.length) return [720, 1440];
  return [Math.max(0, Math.floor(Math.min(...segments.map(p => p.start)) / 60) * 60 - 60), Math.min(1440, Math.ceil(Math.max(...segments.map(p => p.end)) / 60) * 60 + 60)];
}
export function segmentColumns(segments: DaySegment[]): { segment: DaySegment; column: number; columns: number }[] {
  const sorted = [...segments].sort((a, b) => a.start - b.start || a.end - b.end);
  const result: { segment: DaySegment; column: number; columns: number }[] = [];
  let cluster: typeof result = [], laneEnds: number[] = [], clusterEnd = -1;
  function finish() { const columns = laneEnds.length; cluster.forEach(item => { item.columns = columns; }); result.push(...cluster); cluster = []; laneEnds = []; }
  for (const segment of sorted) {
    if (segment.start >= clusterEnd) { finish(); clusterEnd = -1; }
    let column = laneEnds.findIndex(end => end <= segment.start);
    if (column === -1) column = laneEnds.length;
    laneEnds[column] = segment.end; clusterEnd = Math.max(clusterEnd, segment.end);
    cluster.push({ segment, column, columns: 1 });
  }
  finish(); return result;
}
export function clock(minutes: number): string {
  return `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}${minutes === 1440 ? " +1d" : ""}`;
}
export function dayLabel(date: string): string {
  return new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
}
export function setLabel(performance: Performance): string {
  return `${performance.start.slice(11)}–${performance.end.slice(11)}${performance.start.slice(0, 10) !== performance.end.slice(0, 10) ? " (+1 day)" : ""}`;
}
