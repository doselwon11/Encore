"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowDownToLine, Check, LoaderCircle } from "lucide-react";
import type { Festival } from "@/lib/festival";
import { pngFilename, socialFormat, socialFormats, type SocialFormatId } from "@/lib/social-export";
import { ProjectDialog } from "./project-dialog";
import { loadPosterFonts, SocialPosterPreview, type PosterReadiness } from "./social-poster-preview";

export function SocialExportStudio({ festival, onClose }: { festival: Festival; onClose: () => void }) {
  const [formatId, setFormatId] = useState<SocialFormatId>("poster");
  const [name, setName] = useState(festival.name || "encore");
  const [guides, setGuides] = useState(true);
  const [status, setStatus] = useState<PosterReadiness>({ ready: false, compact: false, error: "" });
  const [exporting, setExporting] = useState(false), [notice, setNotice] = useState("");
  const [image, setImage] = useState<{ url: string; name: string } | null>(null);
  useEffect(() => { if (image) return () => { setTimeout(() => URL.revokeObjectURL(image.url), 60000); }; }, [image]);
  const poster = useRef<HTMLDivElement>(null);
  const format = socialFormat(formatId), filename = pngFilename(name, format);
  async function download() {
    if (!poster.current || !status.ready || exporting) return;
    setExporting(true); setNotice("");
    try {
      const node = poster.current;
      await loadPosterFonts(node);
      const { toCanvas, getFontEmbedCSS } = await import("html-to-image");
      const fontEmbedCSS = await getFontEmbedCSS(node);
      const canvas = await toCanvas(node, { width: format.width, height: format.height, canvasWidth: format.width, canvasHeight: format.height, pixelRatio: 1, fontEmbedCSS });
      if (canvas.width !== format.width || canvas.height !== format.height) throw new Error("The export dimensions didn’t match. Please try again.");
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("PNG rendering failed. Please try again.")), "image/png"));
      const url = URL.createObjectURL(blob), link = document.createElement("a");
      link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
      setImage({ url, name: filename });
      setNotice(`PNG ready: ${filename} · ${canvas.width} × ${canvas.height} PNG`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Couldn’t export. Please try again."); }
    finally { setExporting(false); }
  }
  return <ProjectDialog title="Social Media Export Studio" onClose={onClose}><div className="social-export-studio"><div className="social-export-controls"><div className="eyebrow"><span/> READY FOR YOUR NEXT DROP</div><p>One festival. Every feed. Your design, composed for each canvas.</p><fieldset className="social-format-options" disabled={exporting}><legend>Choose a format</legend>{socialFormats.map(option => <label className={`social-format-option ${option.id === formatId ? "selected" : ""}`} key={option.id}><input type="radio" name="social-format" value={option.id} checked={option.id === formatId} onChange={() => { setStatus({ ready: false, compact: false, error: "" }); setNotice(""); setImage(null); setFormatId(option.id); }}/><span><strong>{option.name}</strong><small>{option.width} × {option.height} · {option.description}</small></span>{option.id === formatId && <Check size={15}/>}</label>)}</fieldset><label className="field">File name<input className="schedule-input" aria-label="Export file name" value={name} disabled={exporting} onChange={event => { setName(event.target.value); setNotice(""); setImage(null); }} maxLength={120}/><small className="social-filename">{filename}</small></label><label className="design-checkbox"><input type="checkbox" checked={guides} onChange={event => setGuides(event.target.checked)}/>Show safe-area guides</label><p className="design-hint">{formatId === "story" ? "Story keeps text and artwork 250 px from the top and bottom, and 60 px from the sides." : "Content is reflowed to fit the selected canvas."} Guides stay out of your PNG.</p><div role="status" aria-live="polite" className="social-export-status">{status.error || (status.ready ? status.compact ? "Dense lineup: type has been fitted to keep every artist visible. Review the preview before sharing." : "Ready to download. All artists included." : "Preparing fonts and fitting your design…")}</div><button className="export-button" disabled={!status.ready || exporting} onClick={download}>{exporting ? <LoaderCircle size={16} className="animate-spin"/> : <ArrowDownToLine size={16}/>} {exporting ? "Rendering PNG…" : "Download PNG"}</button>{notice && <p className="social-export-notice" role="status">{notice}</p>}{image && <a className="secondary-button social-download-again" href={image.url} download={image.name}>Download PNG again</a>}</div><section className="social-export-preview" aria-label="Export live preview"><div className="social-preview-caption"><span>LIVE PREVIEW</span><strong>{format.width} × {format.height}</strong></div><SocialPosterPreview key={formatId} festival={festival} format={format} guides={guides} posterRef={poster} onReady={setStatus}/><p>PNG · {format.name} · Embedded multilingual fonts</p></section></div></ProjectDialog>;
}
