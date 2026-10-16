"use client";
import { useEffect, useRef, useState } from "react";
import { initialFestival } from "@/lib/festival";
import { templateDesign, type TemplateId } from "@/lib/poster-design";
import { FestivalPoster } from "./festival-poster";

export function TemplateThumbnail({ template }: { template: TemplateId }) {
  const frame = useRef<HTMLDivElement>(null), poster = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const fit = () => { if (frame.current && poster.current) setScale(Math.min(1, frame.current.clientHeight / poster.current.offsetHeight)); };
    const observer = new ResizeObserver(fit);
    if (frame.current) observer.observe(frame.current);
    if (poster.current) observer.observe(poster.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={frame} className="template-thumbnail" aria-hidden="true"><div className="template-thumbnail-scaler" style={{ transform: `scale(${scale})` }}><FestivalPoster ref={poster} festival={{ ...initialFestival, name: "ENCORE", tiers: initialFestival.tiers.map(tier => ({ ...tier, artists: tier.artists.slice(0, 2) })), design: templateDesign(template) }}/></div></div>;
}
