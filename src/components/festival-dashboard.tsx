"use client";

import { CalendarDays, Copy, FolderHeart, Music2, Pencil, Plus, Sparkles, Trash2, ArrowUpRight } from "lucide-react";
import { FestivalPoster } from "./festival-poster";
import type { FestivalProject } from "@/lib/projects";

const paletteNames = { ultraviolet: "Ultraviolet", sunset: "Desert sunset", afterhours: "After hours" };
export function FestivalDashboard({ projects, onCreate, onOpen, onRename, onDuplicate, onDelete }: {
  projects: FestivalProject[]; onCreate: () => void; onOpen: (id: string) => void;
  onRename: (project: FestivalProject) => void; onDuplicate: (project: FestivalProject) => void; onDelete: (project: FestivalProject) => void;
}) {
  return <main className="main-shell dashboard">
    <div className="page-heading"><div><div className="eyebrow"><span/> YOUR NEXT UNFORGETTABLE WEEKEND</div><h1>My <span>Festivals.</span></h1><p>Your ideas. Your lineups. A whole world of possibilities.</p></div><button className="export-button" onClick={onCreate}><Plus size={16}/>New festival</button></div>
    <div className="library-heading"><span><FolderHeart size={16}/> Your festival collection <b>{projects.length}</b></span><small>Saved in this browser</small></div>
    {projects.length === 0 ? <section className="festival-empty"><span className="empty-icon"><Sparkles size={30}/></span><h2>The stage is yours.</h2><p>Start with a blank canvas or remix our sample lineup.<br/>Your next great festival starts right here.</p><button className="export-button" onClick={onCreate}><Plus size={16}/>Create your first festival</button></section> :
      <div className="festival-grid">{projects.map(project => {
        const { festival } = project;
        const count = festival.tiers.reduce((sum, tier) => sum + tier.artists.length, 0);
        const name = festival.name || "Untitled festival";
        return <article className="festival-card" key={project.id} aria-label={`${name} project`}>
          <button className="card-preview" aria-label={`Open ${name}`} onClick={() => onOpen(project.id)}><div aria-hidden="true"><FestivalPoster festival={festival}/></div><span className="open-overlay">Open in studio <ArrowUpRight size={16}/></span></button>
          <div className="card-content"><div className="card-title"><h2>{name}</h2><span className="theme-label"><i className={`swatch-${festival.palette}`}/>{paletteNames[festival.palette]}</span></div>
            <p className="card-date"><CalendarDays size={13}/>{festival.date || "Dates to be announced"}</p>
            <div className="card-footer"><span><Music2 size={13}/>{count} {count === 1 ? "artist" : "artists"}</span><div className="card-actions"><button className="icon-button" onClick={() => onRename(project)} aria-label={`Rename ${name}`} title="Rename festival"><Pencil size={14}/></button><button className="icon-button" onClick={() => onDuplicate(project)} aria-label={`Duplicate ${name}`} title="Duplicate festival"><Copy size={14}/></button><button className="icon-button delete-project" onClick={() => onDelete(project)} aria-label={`Delete ${name}`} title="Delete festival"><Trash2 size={14}/></button></div></div>
          </div>
        </article>;
      })}<button className="new-festival-card" onClick={onCreate}><span><Plus size={24}/></span><strong>One more encore?</strong><small>Create a new festival</small></button></div>}
    <footer className="page-footer"><span><Music2 size={14}/>Made for the love of live music.</span><span>A little imagination. A lot of encore.<Sparkles size={12}/></span></footer>
  </main>;
}
