"use client";

import { useState } from "react";
import { addDays, artistNames, dayLabel, performanceErrors, type FestivalSchedule, type Performance } from "@/lib/schedule";
import { ProjectDialog } from "./project-dialog";

export function PerformanceForm({ schedule, artists, performance, initialArtist = "", initialDate, onSave, onClose }: { schedule: FestivalSchedule; artists: string[]; performance?: Performance; initialArtist?: string; initialDate: string; onSave: (performance: Performance) => void; onClose: () => void }) {
  const [artist, setArtist] = useState(performance?.artist || initialArtist);
  const [stageId, setStageId] = useState(performance?.stageId || schedule.stages[0]?.id || "");
  const [date, setDate] = useState(performance?.start.slice(0, 10) || initialDate);
  const [startTime, setStartTime] = useState(performance?.start.slice(11) || "18:00");
  const [endTime, setEndTime] = useState(performance?.end.slice(11) || "19:00");
  const [nextDay, setNextDay] = useState(!!performance && performance.start.slice(0, 10) !== performance.end.slice(0, 10));
  const [error, setError] = useState("");
  const suggestions = artistNames([...artists, ...schedule.performances.map(p => p.artist)]);
  return <ProjectDialog title={performance ? "Edit performance" : "Schedule a performance"} onClose={onClose}>
    <form className="schedule-form" onSubmit={event => {
      event.preventDefault();
      try {
        const fields = new FormData(event.currentTarget);
        const formDate = String(fields.get("date") || "");
        const formStart = String(fields.get("startTime") || "").slice(0, 5), formEnd = String(fields.get("endTime") || "").slice(0, 5);
        const entry: Performance = { id: performance?.id || crypto.randomUUID(), artist: String(fields.get("artist") || "").trim(), stageId: String(fields.get("stage") || ""), start: `${formDate}T${formStart}`, end: `${fields.has("nextDay") ? addDays(formDate, 1) : formDate}T${formEnd}` };
        const errors = performanceErrors(entry, schedule);
        if (errors.length) { setError(errors.join(" ")); return; }
        onSave(entry);
      } catch { setError("Choose valid festival-local dates and times."); }
    }}>
      <p>Times use the festival’s local calendar, including after midnight. Conflicts are highlighted after saving.</p>
      <label className="field">Artist<input className="schedule-input" name="artist" aria-label="Performance artist" list="schedule-artist-options" value={artist} onChange={event => setArtist(event.target.value)} maxLength={160} required autoFocus placeholder="Choose a lineup artist or enter a guest"/></label>
      <datalist id="schedule-artist-options">{suggestions.map(name => <option key={name} value={name}/>)}</datalist>
      <div className="schedule-form-columns"><label className="field">Stage<select className="schedule-input" name="stage" aria-label="Performance stage" value={stageId} onChange={event => setStageId(event.target.value)} required>{schedule.stages.map(stage => <option key={stage.id} value={stage.id}>{stage.name}</option>)}</select></label><label className="field">Festival day<select className="schedule-input" name="date" aria-label="Performance day" value={date} onChange={event => setDate(event.target.value)} required>{[...schedule.days].sort().map(day => <option key={day} value={day}>{dayLabel(day)}</option>)}</select></label></div>
      <div className="schedule-form-columns"><label className="field">Starts at<input className="schedule-input" name="startTime" aria-label="Performance start time" type="time" step={60} value={startTime} onInput={event => setStartTime(event.currentTarget.value)} required/></label><label className="field">Ends at<input className="schedule-input" name="endTime" aria-label="Performance end time" type="time" step={60} value={endTime} onInput={event => setEndTime(event.currentTarget.value)} required/></label></div>
      <label className="design-checkbox"><input type="checkbox" name="nextDay" checked={nextDay} onChange={event => setNextDay(event.target.checked)}/>Ends next day (crosses midnight)</label>
      {date && <span className="schedule-form-note">{date} {startTime} → {nextDay ? addDays(date, 1) : date} {endTime} · {schedule.timeZone || "festival local time"}</span>}
      {error && <p className="schedule-error" role="alert">{error}</p>}
      <div className="dialog-actions"><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button className="export-button" type="submit">{performance ? "Save performance" : "Add performance"}</button></div>
    </form>
  </ProjectDialog>;
}
