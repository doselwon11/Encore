import { test } from "node:test";
import assert from "node:assert/strict";
import { createProject, deleteProject, duplicateProject, emptyStore, LEGACY_KEY, loadProjects, PROJECTS_KEY, RECOVERY_KEY, saveProjects, updateProject, type StorageAccess } from "../src/lib/projects.ts";
import { initialFestival, isFestival } from "../src/lib/festival.ts";

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return { values, getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
}

test("blank and sample festivals have unique IDs and independent data", () => {
  const blank = createProject("blank"), sample = createProject("sample");
  assert.notEqual(blank.id, sample.id);
  assert.equal(blank.festival.tiers.flatMap(t => t.artists).length, 0);
  assert.deepEqual(sample.festival, initialFestival);
  sample.festival.tiers[0].artists.push("NEW ARTIST");
  assert.equal(initialFestival.tiers[0].artists.includes("NEW ARTIST"), false);
});
test("legacy migration is lossless, persisted, and performed only once", () => {
  const draft = { ...initialFestival, name: "My old festival", tagline: "Keep me" };
  const storage = memoryStorage({ [LEGACY_KEY]: JSON.stringify(draft) });
  const first = loadProjects(storage);
  assert.deepEqual(first.store.projects[0].festival, draft);
  assert.equal(first.store.activeProjectId, first.store.projects[0].id);
  assert.ok(storage.getItem(LEGACY_KEY));
  assert.deepEqual(loadProjects(storage).store, first.store);
});
test("duplicate, rename, and edit do not change the source project", () => {
  const original = createProject("sample"), copy = duplicateProject(original);
  assert.notEqual(copy.id, original.id);
  copy.festival.tiers[0].artists.pop();
  assert.equal(original.festival.tiers[0].artists.length, 3);
  const store = { ...emptyStore(), projects: [original, copy] };
  const edited = updateProject(store, copy.id, { ...copy.festival, name: "Renamed" });
  assert.equal(edited.projects[1].festival.name, "Renamed");
  assert.equal(edited.projects[0].festival.name, "AFTERGLOW");
});
test("active project, edits, dashboard navigation, and deletions survive reload", () => {
  const storage = memoryStorage(), project = createProject("sample");
  const store = { ...emptyStore(), projects: [project], activeProjectId: project.id };
  assert.ok(saveProjects(storage, store));
  assert.equal(loadProjects(storage).store.activeProjectId, project.id);
  const edited = updateProject(store, project.id, { ...project.festival, name: "Saved edit" });
  saveProjects(storage, { ...edited, activeProjectId: null });
  assert.equal(loadProjects(storage).store.activeProjectId, null);
  assert.equal(loadProjects(storage).store.projects[0].festival.name, "Saved edit");
  saveProjects(storage, deleteProject(store, project.id));
  assert.deepEqual(loadProjects(storage).store, emptyStore());
  assert.equal(loadProjects(storage).store.projects.length, 0);
});
test("null tiers and duplicate tier IDs are rejected safely", () => {
  assert.equal(isFestival({ ...initialFestival, tiers: [null] }), false);
  assert.equal(isFestival({ ...initialFestival, tiers: [initialFestival.tiers[0], initialFestival.tiers[0]] }), false);
});
test("malformed storage is backed up before replacements; valid projects are recovered", () => {
  const project = createProject("sample");
  const raw = JSON.stringify({ version: 1, projects: [null, project, project], activeProjectId: "missing" });
  const storage = memoryStorage({ [PROJECTS_KEY]: raw });
  const result = loadProjects(storage);
  assert.equal(result.store.projects.length, 1);
  assert.equal(result.store.activeProjectId, null);
  assert.ok(result.warning);
  assert.equal([...storage.values].find(([key]) => key.startsWith(RECOVERY_KEY))?.[1], raw);
  const broken = memoryStorage({ [PROJECTS_KEY]: "{broken" });
  assert.deepEqual(loadProjects(broken).store, emptyStore());
  assert.ok([...broken.values.keys()].some(key => key.startsWith(RECOVERY_KEY)));
});
test("unavailable storage and quota errors do not crash or overwrite original data", () => {
  const unavailable: StorageAccess = { getItem() { throw Error("denied"); }, setItem() { throw Error("denied"); } };
  assert.equal(loadProjects(unavailable).writable, false);
  assert.equal(saveProjects(unavailable, emptyStore()), false);
  const storage = memoryStorage({ [PROJECTS_KEY]: "invalid" });
  const quota: StorageAccess = { getItem: storage.getItem, setItem() { throw Error("quota"); } };
  assert.equal(loadProjects(quota).writable, false);
  assert.equal(storage.getItem(PROJECTS_KEY), "invalid");
});
test("future formats and invalid legacy drafts remain untouched", () => {
  const future = memoryStorage({ [PROJECTS_KEY]: JSON.stringify({ version: 2, projects: [] }) });
  assert.equal(loadProjects(future).writable, false);
  assert.equal(future.values.size, 1);
  const legacy = memoryStorage({ [LEGACY_KEY]: "null" });
  assert.deepEqual(loadProjects(legacy).store, emptyStore());
  assert.equal(legacy.getItem(LEGACY_KEY), "null");
});

test("a migration write failure still opens the legacy draft and retains its backup", () => {
  const storage = memoryStorage({ [LEGACY_KEY]: JSON.stringify(initialFestival) });
  const quota: StorageAccess = { getItem: storage.getItem, setItem() { throw Error("quota"); } };
  const loaded = loadProjects(quota);
  assert.deepEqual(loaded.store.projects[0].festival, initialFestival);
  assert.equal(loaded.writable, true);
  assert.ok(loaded.warning);
  assert.equal(storage.getItem(PROJECTS_KEY), null);
  assert.ok(storage.getItem(LEGACY_KEY));
});
