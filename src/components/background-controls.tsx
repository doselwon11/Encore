"use client";
import { useState } from "react";
import { colorPalettes, type BackgroundDesign, type PosterDesign } from "@/lib/poster-design";
import { DesignSlider } from "./typography-controls";

function HexInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [draft, setDraft] = useState(value);
  function apply() {
    if (/^#[0-9a-f]{6}$/i.test(draft)) onChange(draft.toLowerCase());
    else setDraft(value);
  }
  return <input className="hex-color-input" aria-label={`${label} hex`} value={draft} maxLength={7} spellCheck={false} onChange={event => setDraft(event.target.value)} onBlur={apply} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); apply(); } }}/>;
}

export function BackgroundControls({ design, onChange }: { design: PosterDesign; onChange: (design: PosterDesign) => void }) {
  const bg = design.background;
  function update(patch: Partial<BackgroundDesign>) { onChange({ ...design, background: { ...bg, ...patch } }); }
  return <section className="design-section" aria-label="Background designer">
    <div className="section-caption"><h3>Background designer</h3><p>Set the atmosphere. Fine-tune every layer.</p></div>
    <div className="background-palette-buttons">{Object.entries(colorPalettes).map(([id, palette]) => <button key={id} onClick={() => update({ start: palette.start, end: palette.end, accent: palette.accent, text: palette.text })}><i style={{ background: `linear-gradient(135deg,${palette.start},${palette.accent})` }}/>{palette.name}</button>)}</div>
    <div className="color-controls">{([{ key: "start", name: "Gradient start" }, { key: "end", name: "Gradient end" }, { key: "accent", name: "Accent & glow" }, { key: "text", name: "Poster text" }] as const).map(color => <div className="color-control" key={color.key}><input aria-label={color.name} type="color" value={bg[color.key]} onInput={event => update({ [color.key]: event.currentTarget.value })}/><span>{color.name}<HexInput key={bg[color.key]} label={color.name} value={bg[color.key]} onChange={value => update({ [color.key]: value })}/></span></div>)}</div>
    <DesignSlider label="Gradient direction" value={bg.angle} min={0} max={360} suffix="°" onChange={angle => update({ angle })}/>
    <label className="design-select">Background pattern<select aria-label="Background pattern" value={bg.pattern} onChange={event => update({ pattern: event.target.value as BackgroundDesign["pattern"] })}><option value="waves">Wave lines</option><option value="grid">Neon grid</option><option value="dots">Halftone dots</option><option value="none">No pattern</option></select></label>
    <DesignSlider label="Pattern opacity" value={Math.round(bg.patternOpacity * 100)} min={0} max={100} suffix="%" onChange={value => update({ patternOpacity: value / 100 })}/>
    <DesignSlider label="Decorative line opacity" value={Math.round(bg.lineOpacity * 100)} min={0} max={100} suffix="%" onChange={value => update({ lineOpacity: value / 100 })}/>
    <DesignSlider label="Glow intensity" value={Math.round(bg.glow * 100)} min={0} max={100} suffix="%" onChange={value => update({ glow: value / 100 })}/>
    <DesignSlider label="Grain texture" value={Math.round(bg.grain * 100)} min={0} max={100} suffix="%" onChange={value => update({ grain: value / 100 })}/>
    <label className="design-checkbox"><input type="checkbox" checked={bg.decorations} onChange={event => update({ decorations: event.target.checked })}/>Show template decorations</label>
  </section>;
}
