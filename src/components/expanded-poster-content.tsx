import type { CSSProperties } from "react";
import type { Festival } from "@/lib/festival";
import { fontFamily, titleSize, type PosterDesign, type TextGroup } from "@/lib/poster-design";
import { TemplateArtwork } from "./template-artwork";

const editions = { "japanese-city-pop": "SIDE A / COASTAL FREQUENCIES", brutalist: "NO RULES. JUST SOUND.", psychedelic: "ENTER ANOTHER FREQUENCY", editorial: "THE LIVE MUSIC ISSUE", "cyber-rave": "SYSTEM ONLINE / LIVE TRANSMISSION", botanical: "A GATHERING IN FULL BLOOM" };
export function ExpandedPosterContent({ festival, design }: { festival: Festival; design: PosterDesign }) {
  const template = design.template;
  function type(group: TextGroup, text: string, size: number): CSSProperties {
    const value = design.typography[group];
    return { fontFamily: fontFamily(value.font, text), fontSize: `${size * value.size}cqw`, letterSpacing: `${value.spacing}em`, lineHeight: value.lineHeight, textAlign: value.align, justifyContent: { left: "flex-start", center: "center", right: "flex-end" }[value.align] };
  }
  const isEditorial = template === "editorial";
  return <div className="expanded-content" style={{fontFamily:fontFamily("sans", Object.values(festival).filter(v=>typeof v === "string").join(" "))}}>
    <div className="composition-masthead"><span>{editions[template as keyof typeof editions]}</span><span>{isEditorial ? "VOL. 01" : "ENCORE / LIVE"}</span></div>
    <header className="composition-title"><h2 style={type("title",festival.name,titleSize(festival.name))}>{festival.name || "YOUR FESTIVAL"}</h2>{festival.tagline && <p style={type("tagline",festival.tagline,2.6)}>{festival.tagline}</p>}</header>
    {design.background.decorations && <div className="composition-art-plate" style={{ opacity: .35 + design.background.lineOpacity * .65 }}><TemplateArtwork template={template}/></div>}
    {isEditorial && <div className="editorial-deck"><span>THE SOUND<br/>OF RIGHT NOW.</span><span>Artists, discoveries &<br/>unforgettable moments.</span></div>}
    <div className="composition-lineup">{festival.tiers.filter(tier=>tier.artists.length).map((tier,i)=><section key={tier.id} className={`composition-tier composition-tier-${Math.min(i,2)}`}><div className="composition-tier-label"><span>{String(i+1).padStart(2,"0")}</span>{tier.name}</div><div className="composition-artists" style={type("artists",tier.artists.join(" "),[4.6,3.25,2.4][Math.min(i,2)])}>{tier.artists.map((artist,index)=><div className="composition-artist" key={`${artist}-${index}`}>{(isEditorial || template === "cyber-rave") && <small>{String(index+1).padStart(2,"0")}{template === "cyber-rave" ? "_" : "."}</small>}<span>{artist}</span></div>)}</div></section>)}</div>
    <footer className="composition-footer"><div className="poster-date" style={type("details",festival.date,3.2)}>{festival.date}</div><div className="poster-location" style={type("details",festival.location,2)}>{festival.location}</div><div className="composition-colophon"><span>{template === "botanical" ? "MUSIC TAKES ROOT." : "FIND YOUR FREQUENCY."}</span><span>MADE WITH ENCORE ↗</span></div></footer>
  </div>;
}
