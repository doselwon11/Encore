import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultDesign, resolveDesign, fontFamily, titleSize, templateGallery, templateDesign } from "../src/lib/poster-design.ts";
import { createProject, duplicateProject, loadProjects, saveProjects, PROJECTS_KEY } from "../src/lib/projects.ts";

test("old and incomplete designs get safe typography defaults without mutations", () => {
  assert.deepEqual(resolveDesign(), defaultDesign());
  const partial = { typography: { title: { font: "serif", size: 1.2 } } };
  const result = resolveDesign(partial);
  assert.equal(result.typography.title.font, "serif");
  assert.equal(result.typography.title.size, 1.2);
  assert.equal(result.typography.artists.font, "sans");
  assert.deepEqual(partial, { typography: { title: { font: "serif", size: 1.2 } } });
});
test("invalid fonts, alignment and nonfinite or extreme values are normalized", () => {
  const result = resolveDesign({ typography: { title: { font: "constructor", align: "bad", size: Infinity, spacing: 50, lineHeight: -10 }, artists: null } });
  assert.equal(result.typography.title.font, "display");
  assert.equal(result.typography.title.align, "center");
  assert.equal(result.typography.title.size, 1);
  assert.equal(result.typography.title.spacing, .25);
  assert.equal(result.typography.title.lineHeight, 1);
});
test("mixed Japanese titles choose bundled glyphs and use bounded wrapping sizes", () => {
  assert.match(fontFamily("sans", "東京 AFTERGLOW 音楽祭"), /Encore JP/);
  assert.doesNotMatch(fontFamily("sans", "AFTERGLOW"), /Encore JP/);
  assert.ok(titleSize("東京音楽祭 AFTERGLOW ".repeat(10)) >= 6.4);
  assert.ok(titleSize("LONG FESTIVAL NAME") < titleSize("ENCORE"));
});
test("designs persist per project, survive reload, and duplicate independently", () => {
  const first = createProject("sample"), second = createProject("sample");
  first.festival.design = defaultDesign(); first.festival.design.typography.title.font = "japanese";
  const copy = duplicateProject(first); copy.festival.design!.typography.title.font = "serif";
  assert.equal(first.festival.design.typography.title.font, "japanese");
  const values = new Map<string, string>();
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
  const store = { version: 1 as const, activeProjectId: first.id, projects: [first, second, copy] };
  assert.ok(saveProjects(storage, store));
  assert.deepEqual(loadProjects(storage).store, store);
  assert.equal(loadProjects(storage).store.projects[1].festival.design, undefined);
  assert.ok(storage.getItem(PROJECTS_KEY));
});

test("legacy palettes keep their colors when design settings are missing", () => {
  const design = resolveDesign(undefined, "sunset");
  assert.equal(design.background.start, "#792e5e");
  assert.equal(design.background.text, "#ffe5ce");
  assert.equal(design.template, "neon-waves");
});
test("background input is constrained to safe colors and bounded controls", () => {
  const design = resolveDesign({ background: { start: "url(https://example.com)", end: "#123abc", accent: null, angle: 900, glow: NaN, grain: -5, lineOpacity: 20, pattern: "constructor" } });
  assert.equal(design.background.start, defaultDesign().background.start);
  assert.equal(design.background.end, "#123abc");
  assert.equal(design.background.angle, 360);
  assert.equal(design.background.glow, .8);
  assert.equal(design.background.grain, 0);
  assert.equal(design.background.lineOpacity, 1);
  assert.equal(design.background.pattern, "waves");
});

test("all five template presets are independent, normalized, and preserve custom settings", () => {
  assert.equal(templateGallery.length, 5);
  const presets = templateGallery.map(template => templateDesign(template.id));
  assert.equal(new Set(presets.map(preset => preset.template)).size, 5);
  for (const preset of presets) assert.deepEqual(resolveDesign(preset), preset);
  const custom = templateDesign("tokyo-nights");
  custom.background.glow = .17; custom.typography.tagline.spacing = .1;
  const snapshot = structuredClone(custom);
  assert.deepEqual(resolveDesign(custom, "sunset"), snapshot);
  assert.deepEqual(custom, snapshot);
  assert.notDeepEqual(templateDesign("tokyo-nights"), custom);
});
