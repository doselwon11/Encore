"use client";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { Festival } from "@/lib/festival";
import { fitsPoster, type SocialFormat } from "@/lib/social-export";
import { FestivalPoster } from "./festival-poster";

export type PosterReadiness = { ready: boolean; compact: boolean; error: string };
export async function loadPosterFonts(node: HTMLElement) {
  const elements = [node, ...Array.from(node.querySelectorAll<HTMLElement>("h2,p,.poster-tier,.poster-date,.poster-location,.composition-artists,.composition-masthead,.poster-edition"))];
  await Promise.all(elements.map(element => {
    const style = getComputedStyle(element);
    return document.fonts.load(`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`, element.textContent || "Encore");
  }));
  await document.fonts.ready;
}

export function SocialPosterPreview({ festival, format, guides, posterRef, onReady }: { festival: Festival; format: SocialFormat; guides: boolean; posterRef: React.RefObject<HTMLDivElement | null>; onReady: (value: PosterReadiness) => void }) {
  const viewport = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(.3), [density, setDensity] = useState(1);
  useEffect(() => {
    const observer = new ResizeObserver(() => { if (viewport.current) setZoom(viewport.current.clientWidth / format.width); });
    if (viewport.current) observer.observe(viewport.current);
    return () => observer.disconnect();
  }, [format.width]);
  useEffect(() => {
    let cancelled = false;
    async function fit() {
      try {
        if (!posterRef.current) return;
        await loadPosterFonts(posterRef.current);
        if (cancelled) return;
        flushSync(() => setDensity(1));
        const measure = () => {
          const safe = posterRef.current!.querySelector<HTMLElement>(".social-safe-area")!;
          const content = safe.firstElementChild as HTMLElement;
          return fitsPoster({ width: content.scrollWidth, height: content.offsetHeight }, { width: safe.clientWidth, height: safe.clientHeight });
        };
        let result = 1;
        if (!measure()) {
          let low = .08, high = 1;
          flushSync(() => setDensity(low));
          if (!measure()) throw new Error("This lineup is too large for this canvas. Shorten the text or choose a taller format.");
          for (let i = 0; i < 12; i++) {
            const middle = (low + high) / 2;
            flushSync(() => setDensity(middle));
            if (measure()) low = middle; else high = middle;
          }
          result = low * .995;
          flushSync(() => setDensity(result));
        }
        const node = posterRef.current!;
        const safe = node.querySelector<HTMLElement>(".social-safe-area")!.getBoundingClientRect();
        const clipped = Array.from(node.querySelectorAll<HTMLElement>("h2,p,.poster-tier > span,.composition-artist,.poster-date,.poster-location")).some(element => {
          const box = element.getBoundingClientRect();
          return box.left < safe.left - 1 || box.right > safe.right + 1 || box.bottom > safe.bottom + 1 || box.top < safe.top - 1 || element.scrollWidth > element.clientWidth + 1;
        });
        if (clipped) throw new Error("Some text doesn’t fit safely. Try a taller format or reduce typography size in Design.");
        if (!cancelled) onReady({ ready: true, compact: result < .65, error: "" });
      } catch (error) { if (!cancelled) onReady({ ready: false, compact: false, error: error instanceof Error ? error.message : "Couldn’t prepare the preview. Try reopening the studio." }); }
    }
    void fit();
    return () => { cancelled = true; };
  }, [festival, format, onReady, posterRef]);
  return <div className="social-preview-viewport" ref={viewport} style={{ aspectRatio: `${format.width}/${format.height}`, maxWidth: `min(100%, calc((100dvh - 210px) * ${format.width / format.height}))` }}><div className="social-preview-transform" style={{ width: format.width, height: format.height, transform: `scale(${zoom})` }}><FestivalPoster festival={festival} format={format} density={density} ref={posterRef}/>{guides && <div className="social-safe-guide" aria-hidden="true" style={{ inset: `${format.top}px ${format.side}px ${format.bottom}px` }}><span>CONTENT SAFE AREA</span></div>}</div></div>;
}
