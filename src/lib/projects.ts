import { initialFestival, isFestival, type Festival } from "./festival.ts";

export const PROJECTS_KEY = "encore-projects-v1";
export const LEGACY_KEY = "encore-festival-v1";
export const RECOVERY_KEY = "encore-projects-recovery";
export type FestivalProject = { id: string; festival: Festival; createdAt: string; updatedAt: string };
export type ProjectStore = { version: 1; projects: FestivalProject[]; activeProjectId: string | null };
export type StorageAccess = Pick<Storage, "getItem" | "setItem">;
export const emptyStore = (): ProjectStore => ({ version: 1, projects: [], activeProjectId: null });

export function createProject(template: "blank" | "sample", now = new Date().toISOString()): FestivalProject {
  const festival: Festival = template === "sample" ? structuredClone(initialFestival) : {
    name: "Untitled festival", date: "", location: "", tagline: "", palette: "ultraviolet",
    tiers: [{ id: crypto.randomUUID(), name: "Headliners", artists: [] }, { id: crypto.randomUUID(), name: "Main support", artists: [] }, { id: crypto.randomUUID(), name: "Discovery", artists: [] }],
  };
  return { id: crypto.randomUUID(), festival, createdAt: now, updatedAt: now };
}

export function duplicateProject(project: FestivalProject): FestivalProject {
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), festival: { ...structuredClone(project.festival), name: `${project.festival.name || "Untitled festival"} (copy)` }, createdAt: now, updatedAt: now };
}

export function updateProject(store: ProjectStore, id: string, festival: Festival): ProjectStore {
  return { ...store, projects: store.projects.map(project => project.id === id ? { ...project, festival, updatedAt: new Date().toISOString() } : project) };
}

export function deleteProject(store: ProjectStore, id: string): ProjectStore {
  return { ...store, projects: store.projects.filter(project => project.id !== id), activeProjectId: store.activeProjectId === id ? null : store.activeProjectId };
}

function isProject(value: unknown): value is FestivalProject {
  if (!value || typeof value !== "object") return false;
  const p = value as FestivalProject;
  return typeof p.id === "string" && p.id.length > 0 && isFestival(p.festival) && typeof p.createdAt === "string" && Number.isFinite(Date.parse(p.createdAt)) && typeof p.updatedAt === "string" && Number.isFinite(Date.parse(p.updatedAt));
}

export function loadProjects(storage: StorageAccess): { store: ProjectStore; writable: boolean; warning?: string } {
  try {
    const raw = storage.getItem(PROJECTS_KEY);
    if (raw !== null) {
      let parsed: unknown;
      try { parsed = JSON.parse(raw); } catch { parsed = null; }
      const data = parsed as Partial<ProjectStore> | null;
      if (data && data.version !== undefined && data.version !== 1) {
        return { store: emptyStore(), writable: false, warning: "This library uses a newer format. Your saved data is untouched; changes in this session won’t be saved." };
      }
      const seen = new Set<string>();
      const projects = data?.version === 1 && Array.isArray(data.projects) ? data.projects.filter((p: unknown): p is FestivalProject => {
        if (!isProject(p) || seen.has(p.id)) return false;
        seen.add(p.id); return true;
      }) : [];
      const valid = data?.version === 1 && Array.isArray(data.projects) && projects.length === data.projects.length;
      if (!valid) {
        // Preserve the original payload before permitting any replacement writes.
        storage.setItem(`${RECOVERY_KEY}-${crypto.randomUUID()}`, raw);
      }
      const activeProjectId = projects.some(p => p.id === data?.activeProjectId) ? data!.activeProjectId! : null;
      return { store: { version: 1, projects, activeProjectId }, writable: true, ...(!valid ? { warning: "Some saved data was invalid. A recovery copy was preserved; valid festivals are still available." } : {}) };
    }
    const legacy = storage.getItem(LEGACY_KEY);
    if (legacy !== null) {
      let draft: unknown;
      try { draft = JSON.parse(legacy); } catch { draft = null; }
      if (isFestival(draft)) {
        const project = { ...createProject("blank"), festival: draft };
        const store: ProjectStore = { version: 1, projects: [project], activeProjectId: project.id };
        if (!saveProjects(storage, store)) {
          return { store, writable: true, warning: "Your old draft is open, but migration could not be saved. The original is untouched. Free up browser storage, then edit to retry saving." };
        }
        // Keep the legacy draft as a backup; the new store takes precedence.
        return { store, writable: true };
      }
      return { store: emptyStore(), writable: true, warning: "The old draft could not be read. It has been left untouched in browser storage." };
    }
    return { store: emptyStore(), writable: true };
  } catch {
    return { store: emptyStore(), writable: false, warning: "Browser storage could not be read or migrated. Existing data is untouched. Changes in this session won’t be saved." };
  }
}

export function saveProjects(storage: StorageAccess, store: ProjectStore): boolean {
  try { storage.setItem(PROJECTS_KEY, JSON.stringify(store)); return true; } catch { return false; }
}
