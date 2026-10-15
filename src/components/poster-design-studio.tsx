"use client";
import { useState } from "react";
import type { Festival } from "@/lib/festival";
import { resolveDesign, templateGallery, templateDesign, type TemplateId } from "@/lib/poster-design";
import { FestivalPoster } from "./festival-poster";
import { TypographyControls } from "./typography-controls";
import { BackgroundControls } from "./background-controls";
import { ProjectDialog } from "./project-dialog";

export function PosterDesignStudio({ festival, onChange }: { festival: Festival; onChange: (festival: Festival) => void }) {
  const [section, setSection] = useState("Typography");
  const [pending, setPending] = useState<TemplateId | null>(null);
  const design = resolveDesign(festival.design, festival.palette);
  return <div className="advanced-design-studio">
    <div className="design-section-nav" aria-label="Design tools">{["Typography", "Background", "Templates"].map(name => <button key={name} aria-pressed={section === name} onClick={() => setSection(name)}>{name}</button>)}</div>
    {section === "Typography" && <TypographyControls design={design} onChange={next => onChange({ ...festival, design: next })}/>}
    {section === "Background" && <BackgroundControls design={design} onChange={next => onChange({ ...festival, design: next })}/>}
    {section === "Templates" && <section className="design-section"><div className="section-caption"><h3>Find your main-stage look</h3><p>Five compositions. Infinite ways to make them yours.</p></div><div className="template-gallery">{templateGallery.map(template => <button key={template.id} className={`template-card ${design.template === template.id ? "selected" : ""}`} onClick={() => setPending(template.id)} aria-label={`Apply ${template.name} template`}><div className="template-thumbnail" aria-hidden="true"><FestivalPoster festival={{ ...festival, design: templateDesign(template.id) }}/></div><strong>{template.name}</strong><small>{template.description}</small>{design.template === template.id && <span className="template-current">CURRENT COMPOSITION</span>}</button>)}</div></section>}
    {pending && <ProjectDialog title={`Apply ${templateGallery.find(template => template.id === pending)?.name}?`} onClose={() => setPending(null)}><p>This replaces this festival’s typography and background settings. Your festival details and lineup stay the same.</p><div className="dialog-actions"><button className="secondary-button" onClick={() => setPending(null)}>Keep my design</button><button className="export-button" onClick={() => { onChange({ ...festival, design: templateDesign(pending) }); setPending(null); }}>Apply template</button></div></ProjectDialog>}
  </div>;
}
