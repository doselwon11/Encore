"use client";

import { useEffect, useState } from "react";
import { closestCenter, pointerWithin, DndContext, DragOverlay, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { ArrowDown, ArrowUp, CalendarDays, CheckCircle2, Music2, Pencil, Plus, Radio, Trash2, TriangleAlert } from "lucide-react";
import type { Festival } from "@/lib/festival";
import { artistKey, artistNames, dayLabel, emptySchedule, localMinute, localTimeAt, movePerformance, readSchedule, removeDay, removeStage, scheduleConflicts, scheduleDays, setLabel, stageColors, upsertPerformance, validDate, validTimeZone, type FestivalSchedule, type Performance, type Stage } from "@/lib/schedule";
import { ArtistToSchedule, ScheduleTimeline, type ScheduleDrag, type ScheduleDrop } from "./schedule-timeline";
import { PerformanceForm } from "./performance-form";
import { ScheduleExport } from "./schedule-export";
import { ProjectDialog } from "./project-dialog";

type Action = { kind: "performance"; performance?: Performance; artist?: string } | { kind: "stage"; stage?: Stage } | { kind: "delete-stage"; stage: Stage } | { kind: "delete-day"; day: string } | { kind: "delete-performance"; performance: Performance } | { kind: "reset" };

function StageForm({ stage, schedule, onSave, onClose }: { stage?: Stage; schedule: FestivalSchedule; onSave: (stage: Stage) => void; onClose: () => void }) {
  const [name, setName] = useState(stage?.name || "");
  const [color, setColor] = useState(stage?.color || stageColors[schedule.stages.length % stageColors.length]);
  const [error, setError] = useState("");
  return <ProjectDialog title={stage ? "Edit stage" : "Add a stage"} onClose={onClose}><form className="schedule-form" onSubmit={event => {
    event.preventDefault();
    if (!name.trim()) { setError("Give this stage a name."); return; }
    if (schedule.stages.some(item => item.id !== stage?.id && artistKey(item.name) === artistKey(name))) { setError("A stage with this name already exists."); return; }
    onSave({ id: stage?.id || crypto.randomUUID(), name: name.trim(), color });
  }}><p>Give each stage a name and a color. Stage names and colors also appear in exports.</p><label className="field">Stage name<input aria-label="Stage name" className="schedule-input" value={name} maxLength={80} required autoFocus placeholder="e.g. Main stage" onChange={event => setName(event.target.value)}/></label><label className="field">Stage color<input aria-label="Stage color" type="color" value={color} onInput={event => setColor(event.currentTarget.value)}/></label>{error && <p className="schedule-error" role="alert">{error}</p>}<div className="dialog-actions"><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button className="export-button" type="submit">Save stage</button></div></form></ProjectDialog>;
}

function TimeZoneForm({ timeZone, onSave }: { timeZone: string; onSave: (value: string) => void }) {
  const [value, setValue] = useState(timeZone), [error, setError] = useState("");
  return <form className="schedule-timezone-form" onSubmit={event => { event.preventDefault(); if (!validTimeZone(value.trim())) { setError("Enter an IANA timezone, such as America/Los_Angeles or Asia/Tokyo."); return; } setError(""); onSave(value.trim()); }}><label className="field">Festival timezone (optional)<input aria-label="Festival timezone" className="schedule-input" list="festival-timezones" value={value} placeholder="e.g. America/Los_Angeles" onChange={event => setValue(event.target.value)}/></label><datalist id="festival-timezones">{["America/Los_Angeles", "America/Chicago", "America/New_York", "Europe/London", "Europe/Paris", "Asia/Tokyo", "Asia/Seoul", "Australia/Sydney", "UTC"].map(zone => <option key={zone} value={zone}/>)}</datalist><button className="secondary-button" type="submit">Save timezone</button>{error && <span role="alert" className="schedule-error">{error}</span>}</form>;
}

export function ScheduleBuilder({ festival, onChange }: { festival: Festival; onChange: (festival: Festival) => void }) {
  const { schedule, invalid } = readSchedule(festival.schedule);
  const [selectedDay, setSelectedDay] = useState("");
  const [allDays, setAllDays] = useState(false), [fullDay, setFullDay] = useState(false);
  const [newDay, setNewDay] = useState("");
  const [action, setAction] = useState<Action | null>(null);
  const [drag, setDrag] = useState<ScheduleDrag | null>(null);
  const [notice, setNotice] = useState("");
  const days = scheduleDays(schedule), activeDay = days.includes(selectedDay) ? selectedDay : days[0] || "";
  const dates = allDays ? days : activeDay ? [activeDay] : [];
  const artists = artistNames(festival.tiers.flatMap(tier => tier.artists));
  const conflicts = scheduleConflicts(schedule), conflictIds = new Set(conflicts.flatMap(item => item.ids));
  const errors = conflicts.filter(conflict => conflict.severity === "error").length;
  const canAssign = !invalid && !!schedule.stages.length && !!schedule.days.length;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));
  useEffect(() => { if (!notice) return; const timeout = setTimeout(() => setNotice(""), 6000); return () => clearTimeout(timeout); }, [notice]);

  function publish(next: FestivalSchedule, message: string) {
    onChange({ ...festival, schedule: next });
    const count = scheduleConflicts(next).length;
    setNotice(`${message}${count ? ` ${count} conflict${count === 1 ? "" : "s"} / repeat-booking advisories to review.` : ""}`);
  }
  function savePerformance(performance: Performance) {
    try { publish(upsertPerformance(schedule, performance), "Performance saved."); setAction(null); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Couldn’t save this performance."); }
  }
  function drop(event: DragEndEvent) {
    setDrag(null);
    const source = event.active.data.current as ScheduleDrag | undefined;
    const target = event.over?.data.current as ScheduleDrop | undefined;
    if (!source || !target || invalid) return;
    try {
      const performance = source.kind === "performance" ? movePerformance(source.performance, target.stageId, target.start) : { id: crypto.randomUUID(), artist: source.artist, stageId: target.stageId, start: target.start, end: localTimeAt(localMinute(target.start) + 60) };
      savePerformance(performance);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Couldn’t move this performance."); }
  }
  const selectedStartDate = schedule.days.includes(activeDay) ? activeDay : [...schedule.days].sort()[0] || "";

  return <DndContext id="encore-schedule" sensors={sensors} collisionDetection={args => { const underPointer = pointerWithin(args); return underPointer.length ? underPointer : closestCenter(args); }} onDragStart={event => setDrag(event.active.data.current as ScheduleDrag)} onDragEnd={drop} onDragCancel={() => setDrag(null)} accessibility={{ screenReaderInstructions: { draggable: "Press Space to pick up an artist or performance. Use arrow keys to move over a stage time slot, Space to drop, or Escape to cancel. You can also use Assign or Edit to set an exact date, time, and stage." } }}>
    <div className="schedule-builder">
      <div className="schedule-heading"><div><div className="eyebrow"><span/> FROM DREAM LINEUP TO SHOWTIME</div><h2>Every set. <em>Right on time.</em></h2><p>{schedule.stages.length} stages · {schedule.performances.length} performances · {schedule.days.length} festival days</p></div><ScheduleExport festival={festival} schedule={schedule} dates={dates} onNotice={setNotice}/></div>
      {notice && <div className="schedule-notice" role="status">{notice}</div>}
      {invalid && <div className="schedule-invalid" role="alert"><p>This saved schedule couldn’t be read. Its original data is untouched, and other festival features still work.</p><button className="danger-button" onClick={() => setAction({ kind: "reset" })}>Replace invalid schedule</button></div>}
      <fieldset className="schedule-controls-fieldset" disabled={invalid}>
        <details className="schedule-setup" open={!schedule.days.length || !schedule.stages.length}><summary><Radio size={15}/>Stages & festival dates<span>Set up your weekend</span></summary>
          <div className="schedule-setup-columns"><section aria-label="Stage management"><div className="schedule-section-heading"><h3>Your stages</h3><button className="secondary-button" onClick={() => setAction({ kind: "stage" })}><Plus size={13}/>Add stage</button></div>{!schedule.stages.length && <p className="design-hint">Add your first stage to start scheduling.</p>}<div className="schedule-stages">{schedule.stages.map((stage, index) => <div key={stage.id} className="schedule-stage-row"><i style={{ background: stage.color }}/><span>{stage.name}</span><div><button className="icon-button" disabled={index === 0} aria-label={`Move ${stage.name} up`} onClick={() => { const stages = [...schedule.stages]; [stages[index], stages[index - 1]] = [stages[index - 1], stages[index]]; publish({ ...schedule, stages }, "Stage order updated."); }}><ArrowUp size={12}/></button><button className="icon-button" disabled={index === schedule.stages.length - 1} aria-label={`Move ${stage.name} down`} onClick={() => { const stages = [...schedule.stages]; [stages[index], stages[index + 1]] = [stages[index + 1], stages[index]]; publish({ ...schedule, stages }, "Stage order updated."); }}><ArrowDown size={12}/></button><button className="icon-button" aria-label={`Edit stage ${stage.name}`} onClick={() => setAction({ kind: "stage", stage })}><Pencil size={13}/></button><button className="icon-button" aria-label={`Delete stage ${stage.name}`} onClick={() => setAction({ kind: "delete-stage", stage })}><Trash2 size={13}/></button></div></div>)}</div></section>
          <section aria-label="Festival date management"><div className="schedule-section-heading"><h3>Festival dates</h3><CalendarDays size={15}/></div><form className="schedule-add-day" onSubmit={event => { event.preventDefault(); const day = String(new FormData(event.currentTarget).get("festivalDay") || ""); if (!validDate(day)) { setNotice("Choose a valid festival date."); return; } if (schedule.days.includes(day)) { setNotice("This festival day already exists."); return; } publish({ ...schedule, days: [...schedule.days, day].sort() }, "Festival day added."); setSelectedDay(day); setAllDays(false); setNewDay(""); }}><label className="field">Add a festival date<input aria-label="New festival date" name="festivalDay" className="schedule-input" type="date" min="1900-01-01" max="9999-12-30" value={newDay} onInput={event => setNewDay(event.currentTarget.value)} required/></label><button className="secondary-button" type="submit"><Plus size={13}/>Add day</button></form><div className="schedule-date-chips">{[...schedule.days].sort().map(day => <span key={day}>{dayLabel(day)}<button aria-label={`Delete festival day ${day}`} onClick={() => setAction({ kind: "delete-day", day })}><Trash2 size={12}/></button></span>)}</div><TimeZoneForm key={schedule.timeZone} timeZone={schedule.timeZone} onSave={timeZone => publish({ ...schedule, timeZone }, "Festival timezone saved.")}/><p className="design-hint">All times are local wall-clock times. Changing the timezone label does not shift performances. For overnight sets, explicitly choose Ends next day.</p></section></div>
        </details>
        <div className="schedule-view-toolbar"><div className="schedule-day-tabs" aria-label="Schedule day views"><button className={allDays ? "active" : ""} onClick={() => setAllDays(true)} disabled={!days.length}>All days</button>{days.map(day => <button key={day} className={!allDays && day === activeDay ? "active" : ""} onClick={() => { setSelectedDay(day); setAllDays(false); }}>{dayLabel(day)}{!schedule.days.includes(day) && <small>Overnight</small>}</button>)}</div><label className="design-checkbox"><input type="checkbox" checked={fullDay} onChange={event => setFullDay(event.target.checked)}/>Show 24 hours</label></div>
        <div className="schedule-workspace"><aside className="schedule-sidebar"><div className="schedule-section-heading"><h3><Music2 size={14}/>Artist assignments</h3></div><button className="export-button schedule-add-performance" disabled={!canAssign} onClick={() => setAction({ kind: "performance" })}><Plus size={14}/>Add performance</button><p className="design-hint">Drag a handle onto a stage and time, or use Assign. New dragged sets last 60 minutes; moves keep their duration. Drops snap to 15-minute slots.</p>{!artists.length && <p className="schedule-side-empty">Add artists in the Lineup tab, or use Add performance for a guest artist.</p>}<div className="schedule-artist-pool">{artists.map(artist => <ArtistToSchedule key={artist} artist={artist} disabled={!canAssign} onAssign={() => setAction({ kind: "performance", artist })}/>)}</div><p className="design-hint">Keyboard: Space to lift a handle, arrows to move, Space to drop. Edit gives precise date and time controls.</p></aside>
          <div className="schedule-timeline-panel">{!dates.length || !schedule.stages.length ? <div className="schedule-empty"><CalendarDays size={30}/><h3>Your weekend is a blank canvas.</h3><p>Add a stage and festival date above, then assign artists or drag them into the timeline.</p></div> : <div className="schedule-timeline-scroll">{dates.map(date => <ScheduleTimeline key={date} schedule={schedule} date={date} fullDay={fullDay} conflictIds={conflictIds} onEdit={performance => setAction({ kind: "performance", performance })}/>)}</div>}</div>
        </div>
        <section className={`schedule-conflicts ${conflicts.length ? "with-conflicts" : ""}`} aria-label="Booking conflicts"><div className="schedule-section-heading"><h3>{conflicts.length ? <TriangleAlert size={15}/> : <CheckCircle2 size={15}/>} {conflicts.length ? `${errors} overlapping conflict${errors === 1 ? "" : "s"} · ${conflicts.length - errors} repeat-booking advisories` : "No booking conflicts"}</h3></div>{conflicts.length ? <ul>{conflicts.map((conflict, index) => <li key={`${conflict.kind}-${index}`}><span className={`conflict-severity ${conflict.severity}`}>{conflict.severity === "error" ? "CONFLICT" : "REVIEW"}</span>{conflict.message}<button onClick={() => setAction({ kind: "performance", performance: schedule.performances.find(p => p.id === conflict.ids[1]) })}>Review set</button></li>)}</ul> : <p className="design-hint">Stage overlaps and duplicate artist bookings are checked across all days, including midnight continuations.</p>}</section>
        <section className="schedule-performance-list" aria-label="All performances"><div className="schedule-section-heading"><h3>All performances</h3><span>{schedule.timeZone || "Festival local time"}</span></div>{!schedule.performances.length && <p className="design-hint">No sets yet. Assign your first artist to bring the weekend to life.</p>}{[...schedule.performances].sort((a, b) => a.start.localeCompare(b.start)).map(performance => <div key={performance.id} className={`performance-list-row ${conflictIds.has(performance.id) ? "conflicted" : ""}`}><div><strong>{performance.artist}</strong><span>{dayLabel(performance.start.slice(0, 10))} · {setLabel(performance)} · {schedule.stages.find(stage => stage.id === performance.stageId)?.name}</span>{!artists.some(artist => artistKey(artist) === artistKey(performance.artist)) && <small>Guest / not in the current lineup</small>}</div><button className="secondary-button" aria-label={`Edit performance ${performance.artist}`} onClick={() => setAction({ kind: "performance", performance })}><Pencil size={12}/>Edit</button><button className="icon-button" aria-label={`Delete performance ${performance.artist}`} onClick={() => setAction({ kind: "delete-performance", performance })}><Trash2 size={14}/></button></div>)}</section>
      </fieldset>
    </div>
    <DragOverlay>{drag && <div className="schedule-drag-overlay"><Music2 size={14}/>{drag.kind === "artist" ? drag.artist : drag.performance.artist}</div>}</DragOverlay>
    {action?.kind === "performance" && <PerformanceForm schedule={schedule} artists={artists} performance={action.performance} initialArtist={action.artist} initialDate={selectedStartDate} onSave={savePerformance} onClose={() => setAction(null)}/>}
    {action?.kind === "stage" && <StageForm stage={action.stage} schedule={schedule} onSave={stage => { publish({ ...schedule, stages: action.stage ? schedule.stages.map(item => item.id === stage.id ? stage : item) : [...schedule.stages, stage] }, "Stage saved."); setAction(null); }} onClose={() => setAction(null)}/>}
    {action && ["delete-stage", "delete-day", "delete-performance", "reset"].includes(action.kind) && <ProjectDialog title={action.kind === "reset" ? "Replace saved schedule?" : action.kind === "delete-day" ? "Delete festival day?" : action.kind === "delete-stage" ? "Delete stage?" : "Delete performance?"} onClose={() => setAction(null)}><p>{action.kind === "reset" ? "This permanently replaces the unreadable schedule with an empty schedule. Festival details, lineup and poster designs stay unchanged." : action.kind === "delete-stage" ? `Remove ${action.stage.name} and ${schedule.performances.filter(p => p.stageId === action.stage.id).length} scheduled performances? This can’t be undone.` : action.kind === "delete-day" ? `Remove ${dayLabel(action.day)} and all sets starting on this date? Overnight sets starting the previous day are kept. This can’t be undone.` : action.kind === "delete-performance" ? `Remove ${action.performance.artist} from the schedule? The lineup artist is kept. This can’t be undone.` : ""}</p><div className="dialog-actions"><button className="secondary-button" onClick={() => setAction(null)}>Cancel</button><button className="danger-button" onClick={() => { if (action.kind === "reset") publish(emptySchedule(), "Schedule reset."); else if (action.kind === "delete-stage") publish(removeStage(schedule, action.stage.id), "Stage and its performances removed."); else if (action.kind === "delete-day") publish(removeDay(schedule, action.day), "Festival day removed."); else if (action.kind === "delete-performance") publish({ ...schedule, performances: schedule.performances.filter(p => p.id !== action.performance.id) }, "Performance removed."); setAction(null); }}>Confirm deletion</button></div></ProjectDialog>}
  </DndContext>;
}
