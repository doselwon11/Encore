import type { SocialFormat } from "@/lib/social-export";
import type { Festival } from "@/lib/festival";
import { forwardRef, useId, type CSSProperties } from "react";
import { ExpandedPosterContent } from "./expanded-poster-content";
import { PosterBackground } from "./poster-background";
import { expandedTemplateIds, fontFamily, resolveDesign, titleSize, type TextGroup } from "@/lib/poster-design";

export const FestivalPoster = forwardRef<HTMLDivElement, { festival: Festival; format?: SocialFormat; density?: number }>(function FestivalPoster({ festival, format, density = 1 }, ref) {
  const orbitId = useId();
  const design = resolveDesign(festival.design, festival.palette);
  function typography(group: TextGroup, text: string): CSSProperties {
    const value = design.typography[group];
    return { fontFamily: fontFamily(value.font, text), letterSpacing: `${value.spacing}em`, lineHeight: value.lineHeight, textAlign: value.align };
  }
  const artistText = festival.tiers.flatMap(tier => tier.artists).join(" ");
  const content = expandedTemplateIds.includes(design.template) ? <ExpandedPosterContent festival={festival} design={design} density={density}/> : <div className="poster-content" style={{ fontFamily: fontFamily("sans", `${festival.name} ${artistText} ${festival.tagline} ${festival.date} ${festival.location} ${design.template === "tokyo-nights" ? "東京" : ""}`) }}>
        <div className="poster-kicker"><span>AN EXPERIENCE BEYOND THE ORDINARY</span><span>✳</span></div>
        <div className="poster-title-block"><div className="poster-edition">{design.template === "tokyo-nights" ? "東京 · MUSIC AFTER DARK" : design.template === "minimalist" ? "AN INDEPENDENT MUSIC GATHERING" : design.template === "retro-festival" ? "GOOD MUSIC · GOOD PEOPLE" : "MUSIC · ART · CONNECTION"}</div><h2 style={{ ...typography("title", festival.name), fontSize: `${titleSize(festival.name) * design.typography.title.size * density}cqw` }}>{festival.name || "YOUR FESTIVAL"}</h2><p style={{ ...typography("tagline", festival.tagline), fontSize: `${1.32 * design.typography.tagline.size * density}em` }}>{festival.tagline}</p></div>
        <div className="poster-lineup">{festival.tiers.map((tier, i) => <div key={tier.id} className={`poster-tier poster-tier-${Math.min(i, 2)}`} style={{ ...typography("artists", artistText), fontSize: `${[2.28, 1.4, .94][Math.min(i, 2)] * design.typography.artists.size * density}em`, justifyContent: { left: "flex-start", center: "center", right: "flex-end" }[design.typography.artists.align] }}>{tier.artists.map((artist, index) => <span key={`${artist}-${index}`}>{artist}</span>)}</div>)}</div>
        <div className="poster-bottom"><div className="poster-date" style={{ ...typography("details", festival.date), fontSize: `${1.6 * design.typography.details.size * density}em` }}>{festival.date}</div><div className="poster-location" style={{ ...typography("details", festival.location), fontSize: `${.76 * design.typography.details.size * density}em` }}>{festival.location}</div><div className="poster-rule"/><div className="poster-foot"><span>FIND YOUR FREQUENCY.</span><span>MADE WITH ENCORE ↗</span></div></div>
      </div>;
  return (
    <div ref={ref} className={`festival-poster advanced-poster palette-${festival.palette} template-${design.template} ${format ? `social-poster social-${format.id}` : ""}`} data-template={design.template} style={{ ...(format ? { width: format.width, height: format.height, "--social-density": density, "--social-top": `${format.top}px`, "--social-bottom": `${format.bottom}px`, "--social-side": `${format.side}px` } : {}), color: design.background.text, "--poster-bright": design.background.accent, "--poster-deep": design.background.start, "--poster-glow": design.background.accent, "--poster-end": design.background.end } as CSSProperties} aria-label={`${festival.name} festival poster`}>
      <PosterBackground design={design} orbitId={orbitId}/>
      {format ? <div className="social-safe-area">{content}</div> : content}
    </div>
  );
});
