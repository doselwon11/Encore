import type { CSSProperties } from "react";
import type { PosterDesign } from "@/lib/poster-design";

export function PosterBackground({ design, orbitId }: { design: PosterDesign; orbitId: string }) {
  const { background: bg, template } = design;
  const pattern: CSSProperties = { opacity: bg.patternOpacity };
  return <div className={`poster-art background-${template}`} aria-hidden="true" style={{ background: `linear-gradient(${bg.angle}deg, ${bg.start}, ${bg.end})` }}>
    <div className="designer-glow" style={{ opacity: bg.glow, background: `radial-gradient(ellipse at 70% 22%, ${bg.accent}, transparent 65%)` }}/>
    <div className={`designer-pattern pattern-${bg.pattern}`} style={pattern}/>
    {bg.decorations && <>
      {template === "neon-waves" && <><div className="planet" style={{ opacity: bg.glow }}/><svg viewBox="0 0 600 800" preserveAspectRatio="none" className="orbital-lines" style={{ opacity: bg.lineOpacity }}>
        <defs><linearGradient id={orbitId} x1="0" x2="1" y1="0" y2="1"><stop stopColor={bg.accent} stopOpacity=".1"/><stop offset=".5" stopColor={bg.text} stopOpacity=".8"/><stop offset="1" stopColor={bg.accent} stopOpacity=".05"/></linearGradient></defs>
        {Array.from({ length: 22 }, (_, i) => <ellipse key={i} cx="300" cy={260 + i * 4} rx={155 + i * 11} ry={65 + i * 6} transform="rotate(-29 300 300)" fill="none" stroke={`url(#${orbitId})`} strokeWidth=".8"/>)}</svg></>}
      {template === "tokyo-nights" && <div className="tokyo-scene"><div className="tokyo-moon"/><div className="tokyo-buildings" style={{ opacity: .35 + bg.lineOpacity * .65 }}>{Array.from({ length: 11 }, (_, i) => <i key={i} style={{ height: `${20 + (i * 17 % 55)}%`, width: `${6 + (i % 3)}%` }}/>)}</div><div className="tokyo-horizon" style={{ opacity: bg.lineOpacity }}/></div>}
      {template === "golden-hour" && <div className="sunset-scene"><div className="sunset-disc"/><div className="desert-ridge ridge-far"/><div className="desert-ridge ridge-near"/><div className="sunset-lines" style={{ opacity: bg.lineOpacity }}/></div>}
      {template === "minimalist" && <div className="editorial-art" style={{ opacity: bg.lineOpacity }}><div className="editorial-circle"/><div className="editorial-line"/></div>}
      {template === "retro-festival" && <div className="retro-art"><div className="retro-rays" style={{ opacity: bg.lineOpacity }}/><div className="retro-rings"/><div className="retro-star star-one">✳</div><div className="retro-star star-two">✳</div></div>}
    </>}
    <div className="poster-grain" style={{ opacity: bg.grain }}/>
  </div>;
}
