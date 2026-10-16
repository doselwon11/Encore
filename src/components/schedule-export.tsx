"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowDownToLine, LoaderCircle } from "lucide-react";
import type { Festival } from "@/lib/festival";
import { fontFamily } from "@/lib/poster-design";
import { dayLabel, daySegments, scheduleConflicts, setLabel, type FestivalSchedule } from "@/lib/schedule";
import { ScheduleTimeline } from "./schedule-timeline";
import { ProjectDialog } from "./project-dialog";

export function ScheduleExport({ festival, schedule, dates, onNotice }: { festival: Festival; schedule: FestivalSchedule; dates: string[]; onNotice: (message: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [image, setImage] = useState<{ url: string; name: string; width: number; height: number } | null>(null);
  const conflicts = scheduleConflicts(schedule), conflictIds = new Set(conflicts.flatMap(conflict => conflict.ids));
  useEffect(() => { if (image) return () => { setTimeout(() => URL.revokeObjectURL(image.url), 60000); }; }, [image]);
  async function exportPng() {
    if (!ref.current || exporting) return;
    setExporting(true);
    try {
      const node = ref.current;
      if (node.offsetHeight > 7400) throw new Error("This schedule is too tall for one high-resolution PNG. Select one day at a time to export.");
      const { toCanvas, getFontEmbedCSS } = await import("html-to-image");
      await document.fonts.load(`400 14px ${getComputedStyle(node).fontFamily}`, node.textContent || "Encore");
      await document.fonts.ready;
      const fontEmbedCSS = await getFontEmbedCSS(node);
      const canvas = await toCanvas(node, { pixelRatio: 2, fontEmbedCSS });
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("Couldn’t render the schedule. Please try again.")), "image/png"));
      const url = URL.createObjectURL(blob);
      const name = `${festival.name.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "") || "encore"}-schedule-${dates.length === 1 ? dates[0] : "all-days"}.png`;
      const link = document.createElement("a"); link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove();
      setImage({ url, name, width: canvas.width, height: canvas.height }); onNotice("Schedule PNG ready. See you at the stage.");
    } catch (error) { onNotice(error instanceof Error ? error.message : "Couldn’t export the schedule. Please try again."); }
    finally { setExporting(false); }
  }
  return <>
    <button className="export-button" disabled={exporting || !dates.length || !schedule.stages.length} onClick={exportPng}>{exporting ? <LoaderCircle size={15} className="animate-spin"/> : <ArrowDownToLine size={15}/>} {exporting ? "Rendering…" : dates.length > 1 ? "Export all days PNG" : "Export day PNG"}</button>
    <div className="schedule-export-offscreen" aria-hidden="true" inert><div ref={ref} className="schedule-export-canvas" style={{ width: Math.max(1200, 154 + schedule.stages.length * 170), fontFamily: fontFamily("sans", `${festival.name} ${festival.location} ${schedule.stages.map(s => s.name).join(" ")} ${schedule.performances.map(p => p.artist).join(" ")}`) }}>
      <div className="schedule-export-heading"><span>ENCORE / FESTIVAL TIMETABLE</span><h1>{festival.name || "Untitled festival"}</h1>{festival.concept?.fictional && <p>FICTIONAL CONCEPT · ARTIST SUGGESTIONS, NOT ACTUAL BOOKINGS</p>}<p>{festival.location} · {schedule.timeZone || "Festival local time"}</p><p>{dates.length === 1 ? dayLabel(dates[0]) : `${dates.length} festival dates`} · {conflicts.length ? `DRAFT — ${conflicts.length} booking conflicts / advisories` : "Find your frequency. Plan your weekend."}</p></div>
      {dates.map(date => <div key={date}><ScheduleTimeline schedule={schedule} date={date} interactive={false} conflictIds={conflictIds}/><div className="schedule-export-agenda"><h3>PERFORMANCE DETAILS</h3>{daySegments(schedule, date).sort((a, b) => a.start - b.start).map(segment => <div key={segment.performance.id}><span>{setLabel(segment.performance)}{segment.continuesBefore && " · from previous day"}</span><strong>{segment.performance.artist}</strong><span>{schedule.stages.find(stage => stage.id === segment.performance.stageId)?.name}</span></div>)}</div></div>)}
      <footer>All times are festival-local. Overnight sets continue on the following calendar date. {conflicts.length ? "Red cards indicate conflicts or repeated bookings; check the editor for details." : "MADE WITH ENCORE ↗"}</footer>
    </div></div>
    {image && <ProjectDialog title="Your schedule is ready" onClose={() => setImage(null)}><p>Your high-resolution schedule PNG. It includes all stages and times in the selected view.</p><Image className="exported-poster" unoptimized src={image.url} alt="Exported festival schedule PNG" width={image.width} height={image.height}/><div className="dialog-actions"><button className="secondary-button" onClick={() => setImage(null)}>Keep scheduling</button><a className="export-button" href={image.url} download={image.name}><ArrowDownToLine size={14}/>Download schedule PNG</a></div></ProjectDialog>}
  </>;
}
