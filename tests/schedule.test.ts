import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { addDays, artistKey, daySegments, emptySchedule, isSchedule, localMinute, movePerformance, performanceErrors, readSchedule, removeDay, removeStage, scheduleConflicts, scheduleDays, segmentColumns, upsertPerformance, validDate, validTimeZone, type FestivalSchedule, type Performance } from "../src/lib/schedule.ts";
import { createProject, duplicateProject, loadProjects, saveProjects, updateProject } from "../src/lib/projects.ts";
import { defaultDesign } from "../src/lib/poster-design.ts";
import { isFestival } from "../src/lib/festival.ts";

const date = "2026-08-22", nextDate = "2026-08-23";
function base(): FestivalSchedule { return { ...emptySchedule(), timeZone: "Asia/Tokyo", days: [date, nextDate], stages: [{ id: "main", name: "Main stage", color: "#a78bfa" }, { id: "desert", name: "Desert stage", color: "#f472b6" }] }; }
function set(id: string, artist: string, start: string, end: string, stageId = "main"): Performance { return { id, artist, stageId, start: `${date}T${start}`, end: `${date}T${end}` }; }

test("stage overlap is detected and touching boundaries are allowed", () => {
  const schedule = base();
  schedule.performances = [set("a", "Jungle", "18:00", "19:00"), set("b", "Bonobo", "18:30", "19:30")];
  assert.equal(scheduleConflicts(schedule).filter(c => c.kind === "stage-overlap").length, 1);
  schedule.performances[1] = set("b", "Bonobo", "19:00", "20:00");
  assert.deepEqual(scheduleConflicts(schedule), []);
});
test("artist conflicts span stages and normalize case, whitespace, and fullwidth text", () => {
  const schedule = base();
  schedule.performances = [set("a", "Jungle", "18:00", "19:00"), set("b", " ＪＵＮＧＬＥ ", "18:30", "19:30", "desert")];
  assert.equal(artistKey(" ＪＵＮＧＬＥ "), "jungle");
  assert.deepEqual(scheduleConflicts(schedule).map(c => c.kind), ["artist-overlap"]);
  schedule.performances[1] = set("b", "JUNGLE", "20:00", "21:00", "desert");
  assert.equal(scheduleConflicts(schedule)[0].kind, "repeat-artist");
  assert.equal(scheduleConflicts(schedule)[0].severity, "warning");
});
test("simultaneous distinct artists on different stages are valid", () => {
  const schedule = base();
  schedule.performances = [set("a", "Jungle", "18:00", "19:00"), set("b", "Bonobo", "18:00", "19:00", "desert")];
  assert.equal(scheduleConflicts(schedule).length, 0);
  schedule.performances[1] = { ...schedule.performances[1], stageId: "main", start: `${nextDate}T18:00`, end: `${nextDate}T19:00` };
  assert.equal(scheduleConflicts(schedule).length, 0);
});
test("overnight sets conflict with next-day performances and split correctly in day views", () => {
  const schedule = base();
  const overnight = { ...set("a", "Jungle", "23:00", "01:00"), end: `${nextDate}T01:00` };
  schedule.performances = [overnight, { ...set("b", "JUNGLE", "00:30", "02:00"), start: `${nextDate}T00:30`, end: `${nextDate}T02:00` }];
  assert.deepEqual(scheduleConflicts(schedule).map(c => c.kind), ["stage-overlap", "artist-overlap"]);
  const first = daySegments(schedule, date)[0], second = daySegments(schedule, nextDate)[0];
  assert.equal(first.start, 1380); assert.equal(first.end, 1440); assert.equal(first.continuesAfter, true);
  assert.equal(second.start, 0); assert.equal(second.end, 60); assert.equal(second.continuesBefore, true);
  schedule.days = [date]; schedule.performances = [overnight];
  assert.deepEqual(scheduleDays(schedule), [date, nextDate]);
  schedule.performances = [{ ...overnight, end: `${nextDate}T00:00` }];
  assert.deepEqual(scheduleDays(schedule), [date]);
});
test("midnight moves preserve duration, including calendar month and year boundaries", () => {
  const original = set("a", "Jungle", "18:00", "19:30");
  const moved = movePerformance(original, "desert", "2026-12-31T23:30");
  assert.equal(moved.end, "2027-01-01T01:00"); assert.equal(moved.stageId, "desert");
  assert.equal(localMinute(moved.end) - localMinute(moved.start), 90);
  assert.equal(original.start, `${date}T18:00`);
  assert.equal(addDays("2028-02-28", 1), "2028-02-29");
});
test("invalid dates, times, duration, stage references, and start days are rejected", () => {
  assert.equal(validDate("2026-02-29"), false); assert.equal(validDate("2028-02-29"), true);
  const schedule = base();
  assert.ok(performanceErrors(set("a", "Jungle", "23:00", "01:00"), schedule).some(e => e.includes("next day")));
  assert.ok(performanceErrors(set("a", "Jungle", "18:00", "18:00"), schedule).length);
  assert.ok(performanceErrors({ ...set("a", "Jungle", "18:00", "19:00"), end: "2026-08-24T19:00" }, schedule).length);
  assert.throws(() => upsertPerformance(schedule, { ...set("a", "Jungle", "18:00", "19:00"), stageId: "missing" }));
  assert.throws(() => upsertPerformance(schedule, { ...set("a", "Jungle", "18:00", "19:00"), start: "2026-08-25T18:00" }));
  assert.throws(() => localMinute("2026-08-22T24:00"));
  assert.equal(validTimeZone("Asia/Tokyo"), true); assert.equal(validTimeZone("not-a-zone"), false);
});
test("overlapping sets get independent timeline columns; adjacent clusters reset", () => {
  const schedule = base();
  schedule.performances = [set("a", "Jungle", "18:00", "19:00"), set("b", "Bonobo", "18:30", "20:00"), set("c", "TSHA", "20:00", "21:00")];
  const layout = segmentColumns(daySegments(schedule, date));
  assert.equal(layout[0].columns, 2); assert.equal(layout[1].columns, 2);
  assert.notEqual(layout[0].column, layout[1].column); assert.equal(layout[2].columns, 1);
});
test("stage and day deletion cascade predictably and keep previous-night continuations", () => {
  const schedule = base();
  schedule.performances = [{ ...set("a", "Jungle", "23:00", "01:00"), end: `${nextDate}T01:00` }, { ...set("b", "TSHA", "18:00", "19:00", "desert"), start: `${nextDate}T18:00`, end: `${nextDate}T19:00` }];
  assert.deepEqual(removeStage(schedule, "main").performances.map(p => p.id), ["b"]);
  assert.deepEqual(removeDay(schedule, nextDate).performances.map(p => p.id), ["a"]);
  assert.equal(schedule.performances.length, 2);
});
test("schedules persist per festival, duplicate independently, and preserve poster settings", () => {
  const first = createProject("sample"), second = createProject("blank"), schedule = base();
  schedule.performances = [set("a", "Jungle", "18:00", "19:00")];
  first.festival.design = defaultDesign();
  const before = structuredClone(first.festival);
  const store = updateProject({ version: 1, projects: [first, second], activeProjectId: first.id }, first.id, { ...first.festival, schedule });
  const values = new Map<string, string>();
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
  assert.ok(saveProjects(storage, store));
  const restored = loadProjects(storage).store;
  assert.deepEqual(restored, store);
  assert.deepEqual(restored.projects[0].festival.design, before.design);
  assert.deepEqual(restored.projects[0].festival.tiers, before.tiers);
  assert.equal(restored.projects[1].festival.schedule, undefined);
  const copy = duplicateProject(restored.projects[0]);
  copy.festival.schedule!.stages[0].name = "Copy stage";
  assert.equal(restored.projects[0].festival.schedule!.stages[0].name, "Main stage");
});
test("older festivals get empty schedules; invalid data remains untouched and cannot crash the app", () => {
  assert.deepEqual(readSchedule(undefined), { schedule: emptySchedule(), invalid: false });
  const malformed = { version: 1, days: [null], stages: [null], performances: [null] };
  const before = structuredClone(malformed);
  assert.equal(readSchedule(malformed).invalid, true); assert.deepEqual(malformed, before);
  const schedule = base(); schedule.performances = [{ ...set("a", "Jungle", "18:00", "19:00"), stageId: "missing" }];
  assert.equal(isSchedule(schedule), false);
  schedule.performances = [set("a", "Jungle", "18:00", "19:00"), set("a", "Bonobo", "20:00", "21:00")];
  assert.equal(isSchedule(schedule), false);
  assert.equal(isFestival({ ...createProject("sample").festival, schedule: malformed }), true);
});
test("local calendar arithmetic is independent of browser/host timezone, including DST dates", () => {
  const moduleUrl = new URL("../src/lib/schedule.ts", import.meta.url).href;
  const source = `import { localMinute, movePerformance } from ${JSON.stringify(moduleUrl)}; const p={id:'a',artist:'A',stageId:'s',start:'2026-03-07T23:30',end:'2026-03-08T01:30'}; console.log(JSON.stringify([localMinute(p.start),movePerformance(p,'s','2026-03-08T23:30').end]));`;
  const results = ["UTC", "America/Los_Angeles", "Asia/Tokyo"].map(TZ => execFileSync(process.execPath, ["--experimental-strip-types", "--input-type=module", "-e", source], { env: { ...process.env, TZ }, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim());
  assert.equal(new Set(results).size, 1);
  assert.ok(results[0].includes("2026-03-09T01:30"));
});
