"use client";
import { useState } from "react";
import { fontPresets, fontFamily, textGroups, type PosterDesign, type TextGroup, type TypographyStyle } from "@/lib/poster-design";

export function DesignSlider({ label, value, min, max, step = 1, suffix = "", onChange }: { label: string; value: number; min: number; max: number; step?: number; suffix?: string; onChange: (value: number) => void }) {
  return <label className="design-slider"><span>{label}<output>{Number(value.toFixed(3))}{suffix}</output></span><input type="range" aria-label={label} min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))}/></label>;
}
export function TypographyControls({ design, onChange }: { design: PosterDesign; onChange: (design: PosterDesign) => void }) {
  const [group, setGroup] = useState<TextGroup>("title");
  const style = design.typography[group];
  function update(patch: Partial<TypographyStyle>) { onChange({ ...design, typography: { ...design.typography, [group]: { ...style, ...patch } } }); }
  return <section className="design-section" aria-label="Typography studio">
    <div className="section-caption"><h3>Typography studio</h3><p>Give every word its own voice. Japanese & English welcome.</p></div>
    <label className="design-select">Text to customize<select aria-label="Text to customize" value={group} onChange={event => setGroup(event.target.value as TextGroup)}>{textGroups.map(item => <option value={item.id} key={item.id}>{item.label}</option>)}</select></label>
    <label className="design-select">Font preset<select aria-label="Font preset" value={style.font} onChange={event => update({ font: event.target.value as TypographyStyle["font"] })}>{Object.entries(fontPresets).map(([id, preset]) => <option value={id} key={id}>{preset.label}</option>)}</select></label>
    <div className="typography-sample" style={{ fontFamily: fontFamily(style.font, "Make a little noise. 音楽祭") }}>Make a little noise. 音楽祭</div>
    <DesignSlider label="Font size" value={Math.round(style.size * 100)} min={60} max={160} suffix="%" onChange={size => update({ size: size / 100 })}/>
    <DesignSlider label="Letter spacing" value={style.spacing} min={-.06} max={.25} step={.005} suffix=" em" onChange={spacing => update({ spacing })}/>
    <DesignSlider label="Line height" value={style.lineHeight} min={1} max={2} step={.05} onChange={lineHeight => update({ lineHeight })}/>
    <fieldset className="alignment-control"><legend>Alignment</legend>{(["left", "center", "right"] as const).map(align => <button type="button" key={align} aria-pressed={style.align === align} onClick={() => update({ align })}>{align}</button>)}</fieldset>
    <p className="design-hint">Long titles wrap automatically. Layout height grows with your lineup so every artist stays visible. Fonts are bundled for export.</p>
  </section>;
}
