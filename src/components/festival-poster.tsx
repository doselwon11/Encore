import type { Festival } from "@/lib/festival";
import { forwardRef } from "react";

export const FestivalPoster = forwardRef<HTMLDivElement, { festival: Festival }>(function FestivalPoster({ festival }, ref) {
  return (
    <div ref={ref} className={`festival-poster palette-${festival.palette}`} aria-label={`${festival.name} festival poster`}>
      <div className="poster-art" aria-hidden="true">
        <div className="planet" />
        <svg viewBox="0 0 600 800" preserveAspectRatio="none" className="orbital-lines">
          <defs><linearGradient id="orbit" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#eeb4ff" stopOpacity=".1"/><stop offset=".5" stopColor="#f5bcff" stopOpacity=".75"/><stop offset="1" stopColor="#7448ff" stopOpacity=".05"/></linearGradient></defs>
          {Array.from({ length: 22 }, (_, i) => <ellipse key={i} cx="300" cy={260 + i * 4} rx={155 + i * 11} ry={65 + i * 6} transform="rotate(-29 300 300)" fill="none" stroke="url(#orbit)" strokeWidth=".8" />)}
        </svg>
        <div className="poster-grain" />
      </div>
      <div className="poster-content">
        <div className="poster-kicker"><span>AN EXPERIENCE BEYOND THE ORDINARY</span><span>✳</span></div>
        <div className="poster-title-block"><div className="poster-edition">MUSIC · ART · CONNECTION</div><h2 style={{ fontSize: festival.name.length > 13 ? "2.9em" : festival.name.length > 9 ? "3.7em" : undefined }}>{festival.name || "YOUR FESTIVAL"}</h2><p>{festival.tagline}</p></div>
        <div className="poster-lineup">{festival.tiers.map((tier, i) => <div key={tier.id} className={`poster-tier poster-tier-${Math.min(i, 2)}`}>{tier.artists.map((artist, index) => <span key={`${artist}-${index}`}>{artist}</span>)}</div>)}</div>
        <div className="poster-bottom"><div className="poster-date">{festival.date}</div><div className="poster-location">{festival.location}</div><div className="poster-rule"/><div className="poster-foot"><span>FIND YOUR FREQUENCY.</span><span>MADE WITH ENCORE ↗</span></div></div>
      </div>
    </div>
  );
});
