"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { PosterDesignStudio } from "./poster-design-studio";
import { resolveDesign, colorPalettes, templateGallery } from "@/lib/poster-design";
import { ProjectDialog } from "./project-dialog";
import { ArrowDownToLine, ArrowLeft, ArrowUpRight, CalendarDays, Check, ChevronDown, ChevronRight, Disc3, Expand, Info, Layers3, LoaderCircle, MapPin, Music2, Palette, Plus, Radio, RotateCcw, Sparkles, Type, WandSparkles, X } from "lucide-react";
import { FestivalPoster } from "./festival-poster";
import { LineupTier } from "./lineup-tier";
import { initialFestival, type Festival, type Palette as PaletteName } from "@/lib/festival";

const palettes: { id: PaletteName; name: string; description: string }[] = [{ id: "ultraviolet", name: "Ultraviolet", description: "Electric purple meets midnight" }, { id: "sunset", name: "Desert sunset", description: "Warm pinks and amber skies" }, { id: "afterhours", name: "After hours", description: "Cool blue with a neon pulse" }];

function Field({ label, value, onChange, placeholder, icon: Icon, maxLength = 80 }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; icon?: typeof Type; maxLength?: number }) {
  return <label className="field"><span>{label}</span><div className="input-wrap">{Icon && <Icon size={15}/>}<input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength}/></div></label>;
}

export function FestivalStudio({ festival, saved, onChange, onBack }: { festival: Festival; saved: boolean; onChange: (festival: Festival) => void; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState("Festival");
  const [exported, setExported] = useState<{ url: string; name: string; width: number; height: number } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [confirmation, setConfirmation] = useState<{ title: string; body: string; run: () => void } | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDialogElement>(null);
  const resetRef = useRef<HTMLDialogElement>(null);
  const currentDesign = resolveDesign(festival.design, festival.palette);
  const selectedPalette = Object.entries(colorPalettes).find(([, palette]) => (["start", "end", "accent", "text"] as const).every(key => palette[key] === currentDesign.background[key]))?.[0] || "custom";
  const artistCount = festival.tiers.reduce((sum, tier) => sum + tier.artists.length, 0);

  useEffect(() => {
    if (!exported) return;
    return () => { setTimeout(() => URL.revokeObjectURL(exported.url), 60000); };
  }, [exported]);
  useEffect(() => { if (!notice) return; const timeout = setTimeout(() => setNotice(""), 5000); return () => clearTimeout(timeout); }, [notice]);
  useEffect(() => { if (expanded) modalRef.current?.showModal(); else modalRef.current?.close(); }, [expanded]);
  useEffect(() => { if (resetOpen) resetRef.current?.showModal(); else resetRef.current?.close(); }, [resetOpen]);

  function update(next: Festival) { onChange(next); }
  function setField(key: "name" | "date" | "location" | "tagline", value: string) { update({ ...festival, [key]: value }); }
  async function exportPoster() {
    if (!posterRef.current || exporting) return;
    setExporting(true);
    try {
      await document.fonts.ready;
      const { toCanvas, getFontEmbedCSS } = await import("html-to-image");
      const node = posterRef.current;
      if (!node) return;
      const textNodes = [node, ...Array.from(node.querySelectorAll<HTMLElement>("h2, p, .poster-tier, .poster-date, .poster-location, .poster-edition"))];
      await Promise.all(textNodes.map(element => {
        const style = getComputedStyle(element);
        return document.fonts.load(`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`, element.textContent || "Encore");
      }));
      await document.fonts.ready;
      const fontEmbedCSS = await getFontEmbedCSS(node);
      const canvas = await toCanvas(node, { pixelRatio: 3, fontEmbedCSS });
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("PNG rendering failed")), "image/png"));
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a"); link.download = `${festival.name.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "") || "encore"}-lineup.png`; link.href = url; document.body.appendChild(link); link.click(); link.remove();
      setExported({ url, name: link.download, width: canvas.width, height: canvas.height });
      setNotice("Your poster is ready. Let the world hear it.");
    } catch { setNotice("Couldn’t export your poster. Please try again."); } finally { setExporting(false); }
  }

  return <div className="studio-shell">
    <header className="app-header"><button onClick={onBack} className="brand brand-button" aria-label="Back to My Festivals"><span className="brand-icon"><Radio size={22}/></span>encore<span className="brand-dot">.</span></button><div className="header-divider"/><span className="workspace-label">Your creative playground</span><div className="header-right"><span className="studio-badge"><span/> FESTIVAL STUDIO</span><span className="avatar">JD</span></div></header>
    <main className="main-shell">
      <button className="back-to-festivals" onClick={onBack}><ArrowLeft size={15}/>Back to My Festivals</button>
      <div className="page-heading"><div><div className="eyebrow"><span/> GOOD MUSIC STARTS WITH A GREAT LINEUP</div><h1>Make a little <span>noise.</span></h1><p>Your dream festival. Your rules. Bring the lineup to life.</p></div><button className="secondary-button reset-button" onClick={() => setResetOpen(true)}><RotateCcw size={14}/> Start fresh</button></div>
      <div className="workspace-grid">
        <section className="editor-panel" aria-label="Festival editor">
          <div className="panel-heading"><div className="flex items-center gap-2.5"><span className="section-icon"><Layers3 size={16}/></span><h2>The festival studio</h2></div><span className="step-label">MAKE IT YOURS</span></div>
          <div className="editor-tabs" role="tablist" aria-label="Editor sections">{[{ name: "Festival", icon: Type }, { name: "Lineup", icon: Music2 }, { name: "Design", icon: Palette }].map(({ name, icon: Icon }) => <button key={name} id={`tab-${name}`} role="tab" aria-selected={activeTab === name} aria-controls={`panel-${activeTab}`} className={activeTab === name ? "active" : ""} onClick={() => setActiveTab(name)}><Icon size={14}/>{name}</button>)}</div>
          <div className="editor-body" role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
            {activeTab === "Festival" && <><div className="section-caption"><h3>Set the scene</h3><p>Every unforgettable weekend starts with a name.</p></div><div className="festival-fields"><Field label="Festival name" value={festival.name} onChange={v => setField("name", v)} placeholder="Give your festival a name" maxLength={160}/><div className="two-fields"><Field label="Festival dates" value={festival.date} onChange={v => setField("date", v)} icon={CalendarDays} maxLength={50}/><Field label="Location" value={festival.location} onChange={v => setField("location", v)} icon={MapPin} maxLength={65}/></div><Field label="Tagline" value={festival.tagline} onChange={v => setField("tagline", v)} maxLength={90}/></div><div className="section-separator"/></>}
            {(activeTab === "Festival" || activeTab === "Lineup") && <><div className="lineup-caption"><div><h3>Build your lineup <span className="small-badge">{artistCount} artists</span></h3><p>The headliners. The discoveries. The next big thing.</p></div><button className="sample-button" title="Replace lineup with sample artists" onClick={() => setConfirmation({ title: "Replace the lineup?", body: "This replaces every lineup tier and artist with the sample lineup.", run: () => { update({ ...festival, tiers: structuredClone(initialFestival.tiers) }); setNotice("Sample lineup loaded."); } })}><WandSparkles size={13}/><span>Use sample</span></button></div><div className="tiers">{festival.tiers.map((tier, i) => <LineupTier key={tier.id} tier={tier} index={i} total={festival.tiers.length} onChange={next => update({ ...festival, tiers: festival.tiers.map(t => t.id === tier.id ? next : t) })} onDelete={() => setConfirmation({ title: "Delete lineup tier?", body: `This removes ${tier.name || "this tier"} and its artists.`, run: () => update({ ...festival, tiers: festival.tiers.filter(t => t.id !== tier.id) }) })} onMove={direction => { const tiers = [...festival.tiers]; [tiers[i], tiers[i + direction]] = [tiers[i + direction], tiers[i]]; update({ ...festival, tiers }); }}/>)}</div><button className="add-tier" disabled={festival.tiers.length >= 8} onClick={() => update({ ...festival, tiers: [...festival.tiers, { id: crypto.randomUUID(), name: "New tier", artists: [] }] })}><Plus size={14}/> Add lineup tier</button><div className="editor-tip"><Info size={13}/><span>Big names up top. Good vibes all the way down.</span></div></>}
            {activeTab === "Design" && <PosterDesignStudio festival={festival} onChange={update}/>}
          </div>
          <div className="editor-footer"><span className="save-state"><Check size={12}/>{saved ? "All changes saved locally" : "Changes aren’t saved to this browser"}</span><span>LET’S MAKE MEMORIES ↗</span></div>
        </section>
        <section className="preview-panel" aria-label="Live poster preview"><div className="preview-heading"><div><span className="live-dot"/><h2>Live preview</h2><span className="preview-subtitle">The main event.</span></div><button className="icon-button" onClick={() => setExpanded(true)} aria-label="Expand poster preview"><Expand size={16}/></button></div><div className="poster-stage"><div className="poster-frame"><FestivalPoster ref={posterRef} festival={festival}/></div><div className="canvas-caption"><span>POSTER / PORTRAIT</span><span>ADAPTIVE PORTRAIT <span className="caption-dot">·</span> HIGH RESOLUTION</span></div></div><div className="preview-controls"><div className="palette-picker"><span className="mini-swatch" style={{ background: currentDesign.background.accent }}/><select aria-label="Poster palette" value={selectedPalette} onChange={e => {
          const palette = e.target.value as PaletteName;
          const design = resolveDesign(festival.design, festival.palette), colors = colorPalettes[palette];
          update({ ...festival, palette, design: { ...design, background: { ...design.background, start: colors.start, end: colors.end, accent: colors.accent, text: colors.text } } });
        }}><option disabled value="custom">{templateGallery.find(template => template.id === currentDesign.template)?.name} / Custom</option>{palettes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><ChevronDown size={13}/></div><span className="preview-scale">FIT TO CANVAS</span><button className="icon-button" onClick={() => setExpanded(true)} aria-label="View full-size poster"><Expand size={14}/></button></div><div className="export-section"><div><h3>Looks like a sellout.</h3><p>Take your festival out into the world.</p></div><button className="export-button" onClick={exportPoster} disabled={exporting}>{exporting ? <LoaderCircle size={16} className="animate-spin"/> : <ArrowDownToLine size={16}/>}<span>{exporting ? "Exporting…" : "Export poster"}</span><ArrowUpRight size={15}/></button></div><div className="export-note"><span>PNG FORMAT</span><span>HIGH QUALITY</span><span>ALL YOURS</span></div></section>
      </div>
      <footer className="page-footer"><span><Disc3 size={14}/> Made for the love of live music.</span><span>A little imagination. A lot of encore.<Sparkles size={12}/></span></footer>
    </main>
    {exported && <ProjectDialog title="Your poster is ready" onClose={() => setExported(null)}><p>This is your exported PNG, with the poster fonts embedded before rendering.</p><Image className="exported-poster" unoptimized src={exported.url} alt="Exported festival poster PNG" width={exported.width} height={exported.height}/><div className="dialog-actions"><button className="secondary-button" onClick={() => setExported(null)}>Keep creating</button><a className="export-button" download={exported.name} href={exported.url}><ArrowDownToLine size={14}/>Download PNG</a></div></ProjectDialog>}
    {notice && <div className="toast" role="status"><Check size={16}/>{notice}<button onClick={() => setNotice("")} aria-label="Dismiss notification"><X size={14}/></button></div>}
    <dialog ref={modalRef} className="preview-dialog" onCancel={() => setExpanded(false)} onClick={e => { if (e.target === e.currentTarget) setExpanded(false); }}><button className="dialog-close icon-button" aria-label="Close full-size preview" onClick={() => setExpanded(false)}><X size={20}/></button><FestivalPoster festival={festival}/></dialog>
    {confirmation && <ProjectDialog title={confirmation.title} onClose={() => setConfirmation(null)}><p>{confirmation.body}</p><div className="dialog-actions"><button className="secondary-button" onClick={() => setConfirmation(null)}>Cancel</button><button className="danger-button" onClick={() => { confirmation.run(); setConfirmation(null); }}>Confirm</button></div></ProjectDialog>}
    <dialog ref={resetRef} className="reset-dialog" onCancel={() => setResetOpen(false)}><span className="section-icon"><RotateCcw size={20}/></span><h2>A fresh start?</h2><p>This replaces the festival details and lineup with the original sample. Your poster design stays the same.</p><div><button className="secondary-button" onClick={() => setResetOpen(false)}>Keep creating</button><button className="export-button" onClick={() => { update({ ...structuredClone(initialFestival), design: festival.design }); setResetOpen(false); setActiveTab("Festival"); }}>Start fresh<ChevronRight size={15}/></button></div></dialog>
  </div>;
}
