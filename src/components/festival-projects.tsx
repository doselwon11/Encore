"use client";

import { useEffect, useState } from "react";
import { Check, FilePlus2, LoaderCircle, Radio, Sparkles, X } from "lucide-react";
import { FestivalDashboard } from "./festival-dashboard";
import { FestivalStudio } from "./festival-studio";
import { ProjectDialog } from "./project-dialog";
import { createProject, deleteProject, duplicateProject, emptyStore, loadProjects, saveProjects, updateProject, type FestivalProject, type ProjectStore } from "@/lib/projects";

type Action = { kind: "create" } | { kind: "rename" | "delete"; project: FestivalProject };
export function FestivalProjects() {
  const [store, setStore] = useState<ProjectStore>(emptyStore);
  const [ready, setReady] = useState(false);
  const [writable, setWritable] = useState(true);
  const [storageWarning, setStorageWarning] = useState("");
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState("");
  const [action, setAction] = useState<Action | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      let result: ReturnType<typeof loadProjects>;
      try { result = loadProjects(window.localStorage); } catch {
        result = { store: emptyStore(), writable: false, warning: "Browser storage is unavailable. Changes in this session won’t be saved." };
      }
      setStore(result.store); setWritable(result.writable); setStorageWarning(result.warning || ""); setSaved(result.writable && !result.warning?.includes("could not be saved")); setReady(true);
    });
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  function commit(next: ProjectStore) {
    // Save in the same event as the edit so navigation and reload cannot race a debounce.
    let persisted = false;
    if (writable) {
      try { persisted = saveProjects(window.localStorage, next); } catch { /* Storage getters may themselves throw. */ }
      if (persisted && (storageWarning.startsWith("Couldn’t save") || storageWarning.includes("migration could not be saved"))) setStorageWarning("");
      if (!persisted) setStorageWarning("Couldn’t save to browser storage. Keep this tab open; changes are available for this session. Free up storage, then try another edit to save again.");
    }
    setSaved(persisted); setStore(next);
  }
  function create(template: "blank" | "sample") {
    const project = createProject(template);
    commit({ ...store, projects: [project, ...store.projects], activeProjectId: project.id });
    setAction(null); setNotice(template === "sample" ? "Sample festival created. Make it yours." : "Your new festival is ready for its first headliner.");
  }
  const active = store.projects.find(project => project.id === store.activeProjectId);

  return <>
    {!ready ? <div className="library-loading" role="status"><LoaderCircle className="animate-spin" size={24}/>Opening your festival collection…</div> : <>
      {storageWarning && <div className="storage-warning" role="alert">{storageWarning}</div>}
      {active ? <FestivalStudio key={active.id} festival={active.festival} saved={saved} onChange={festival => commit(updateProject(store, active.id, festival))} onBack={() => commit({ ...store, activeProjectId: null })}/> : <div className="studio-shell">
        <header className="app-header"><div className="brand"><span className="brand-icon"><Radio size={22}/></span>encore<span className="brand-dot">.</span></div><div className="header-divider"/><span className="workspace-label">Your creative playground</span><div className="header-right"><span className="studio-badge"><span/> MY FESTIVALS</span><span className="avatar">JD</span></div></header>
        <FestivalDashboard projects={store.projects} onCreate={() => setAction({ kind: "create" })} onOpen={id => commit({ ...store, activeProjectId: id })} onRename={project => { setName(project.festival.name); setAction({ kind: "rename", project }); }} onDuplicate={project => {
          const copy = duplicateProject(project); commit({ ...store, projects: [copy, ...store.projects] }); setNotice(`“${project.festival.name || "Untitled festival"}” duplicated.`);
        }} onDelete={project => setAction({ kind: "delete", project })}/>
      </div>}
      {action && <ProjectDialog title={action.kind === "create" ? "Your next main event." : action.kind === "rename" ? "Rename festival" : "Delete festival?"} onClose={() => setAction(null)}>
        {action.kind === "create" ? <><p>Every great festival starts somewhere. Choose your canvas.</p><div className="create-options"><button onClick={() => create("blank")}><FilePlus2 size={24}/><strong>Start from scratch</strong><span>A blank poster and empty lineup tiers. All you.</span></button><button onClick={() => create("sample")}><Sparkles size={24}/><strong>Remix a sample</strong><span>Afterglow’s dream lineup, ready for your spin.</span></button></div></> : action.kind === "rename" ?
          <form onSubmit={event => { event.preventDefault(); if (!name.trim()) return; commit(updateProject(store, action.project.id, { ...action.project.festival, name: name.trim() })); setAction(null); setNotice("Festival renamed."); }}><p>This name also appears on your festival poster.</p><label className="field">Festival name<div className="input-wrap"><input autoFocus value={name} onChange={event => setName(event.target.value)} maxLength={80} required/></div></label><div className="dialog-actions"><button type="button" className="secondary-button" onClick={() => setAction(null)}>Cancel</button><button className="export-button" type="submit" disabled={!name.trim()}>Save name</button></div></form> :
          <><p>“{action.project.festival.name || "Untitled festival"}” and its lineup will be permanently removed from this browser. This can’t be undone.</p><div className="dialog-actions"><button className="secondary-button" onClick={() => setAction(null)}>Keep festival</button><button className="danger-button" onClick={() => { commit(deleteProject(store, action.project.id)); setAction(null); setNotice("Festival deleted."); }}>Delete festival</button></div></>}
      </ProjectDialog>}
    </>}
    {notice && <div className="toast" role="status"><Check size={16}/>{notice}<button onClick={() => setNotice("")} aria-label="Dismiss notification"><X size={14}/></button></div>}
  </>;
}
