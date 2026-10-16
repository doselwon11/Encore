"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { GripVertical, Pencil } from "lucide-react";
import { clock, dayLabel, daySegments, segmentColumns, setLabel, timelineBounds, type DaySegment, type FestivalSchedule, type Performance } from "@/lib/schedule";
import type { CSSProperties } from "react";

export const MINUTE_HEIGHT = 1.6;
export type ScheduleDrop = { stageId: string; start: string };
export type ScheduleDrag = { kind: "artist"; artist: string } | { kind: "performance"; performance: Performance };

function DropSlot({ stageId, date, minute, stageName, allowDrop }: { stageId: string; date: string; minute: number; stageName: string; allowDrop: boolean }) {
  const start = `${date}T${clock(minute)}`;
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${stageId}-${start}`, data: { stageId, start } satisfies ScheduleDrop, disabled: !allowDrop });
  return <div ref={setNodeRef} className={`schedule-drop-slot ${isOver ? "is-over" : ""}`} style={{ height: 15 * MINUTE_HEIGHT }} aria-label={`${stageName}, ${date} at ${clock(minute)}`}>{isOver && <span>{clock(minute)}</span>}</div>;
}

function DragHandle({ performance, date }: { performance: Performance; date: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `performance-${performance.id}-${date}`, data: { kind: "performance", performance } satisfies ScheduleDrag });
  return <button ref={setNodeRef} {...attributes} {...listeners} className="set-drag-handle" aria-label={`Move ${performance.artist}, ${setLabel(performance)}`} style={{ opacity: isDragging ? .4 : 1 }}><GripVertical size={13}/></button>;
}

export function ArtistToSchedule({ artist, disabled, onAssign }: { artist: string; disabled: boolean; onAssign: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `artist-${artist}`, data: { kind: "artist", artist } satisfies ScheduleDrag, disabled });
  return <div className="schedule-artist"><button ref={setNodeRef} {...attributes} {...listeners} className="artist-drag-handle" disabled={disabled} aria-label={`Drag ${artist} to a time slot`} style={{ opacity: isDragging ? .4 : 1 }}><GripVertical size={14}/></button><span>{artist}</span><button className="assign-artist" disabled={disabled} onClick={onAssign} aria-label={`Assign ${artist}`}>Assign</button></div>;
}

function SetCard({ segment, column, columns, rangeStart, color, conflicted, interactive, onEdit, date }: { date: string; segment: DaySegment; column: number; columns: number; rangeStart: number; color: string; conflicted: boolean; interactive: boolean; onEdit?: (performance: Performance) => void }) {
  const { performance } = segment;
  const height = (segment.end - segment.start) * MINUTE_HEIGHT;
  const style: CSSProperties = { top: (segment.start - rangeStart) * MINUTE_HEIGHT, height, left: `calc(${column / columns * 100}% + 3px)`, width: `calc(${100 / columns}% - 6px)`, borderColor: conflicted ? "#fb7185" : color, "--stage-color": color } as CSSProperties;
  const label = `${performance.artist}, ${setLabel(performance)}${segment.continuesBefore ? ", continued from previous day" : ""}${segment.continuesAfter ? ", continues next day" : ""}${conflicted ? ", conflict" : ""}`;
  return <div className={`schedule-set ${conflicted ? "has-conflict" : ""} ${height < 32 ? "short-set" : ""}`} style={style} title={label}>
    {interactive && <DragHandle performance={performance} date={date}/>}
    {interactive ? <button className="schedule-set-content" aria-label={`Edit ${label}`} onClick={() => onEdit?.(performance)}><strong>{performance.artist}</strong><span>{clock(segment.start)}–{clock(segment.end)}</span>{height >= 70 && <small>{segment.continuesBefore ? "↳ From previous day" : segment.continuesAfter ? "Continues next day ↗" : conflicted ? "Review conflict" : "Edit performance"}</small>}<Pencil size={10}/></button> : <div className="schedule-set-content"><strong>{performance.artist}</strong><span>{clock(segment.start)}–{clock(segment.end)}</span>{height >= 70 && <small>{segment.continuesBefore ? "↳ From previous day" : segment.continuesAfter ? "Continues next day ↗" : conflicted ? "Conflict" : "Live set"}</small>}</div>}
  </div>;
}

export function ScheduleTimeline({ schedule, date, fullDay = false, interactive = true, conflictIds, onEdit }: { schedule: FestivalSchedule; date: string; fullDay?: boolean; interactive?: boolean; conflictIds: Set<string>; onEdit?: (performance: Performance) => void }) {
  const segments = daySegments(schedule, date), [start, end] = timelineBounds(segments, fullDay);
  const slots = Array.from({ length: (end - start) / 15 }, (_, index) => start + index * 15);
  const hours = Array.from({ length: (end - start) / 60 + 1 }, (_, index) => start + index * 60);
  const height = (end - start) * MINUTE_HEIGHT;
  return <section className="schedule-day-timeline" aria-label={`Timeline for ${date}`}>
    <div className="schedule-day-title"><div><span>{schedule.days.includes(date) ? "FESTIVAL DAY" : "OVERNIGHT CONTINUATION"}</span><h3>{dayLabel(date)}</h3></div><span>{segments.length} {segments.length === 1 ? "set" : "sets"} · local time</span></div>
    <div className="schedule-timeline-grid" style={{ gridTemplateColumns: `58px repeat(${schedule.stages.length}, minmax(170px, 1fr))`, minWidth: 58 + schedule.stages.length * 170 }}>
      <div className="schedule-time-header">TIME</div>{schedule.stages.map(stage => <div key={stage.id} className="schedule-stage-header"><i style={{ background: stage.color }}/>{stage.name}</div>)}
      <div className="schedule-time-axis" style={{ height }}>{hours.map(hour => <span key={hour} style={{ top: (hour - start) * MINUTE_HEIGHT }}>{clock(hour)}</span>)}</div>
      {schedule.stages.map(stage => <div key={stage.id} className="schedule-stage-lane" style={{ height }}>
        {interactive ? slots.map(minute => <DropSlot key={minute} stageId={stage.id} stageName={stage.name} date={date} minute={minute} allowDrop={schedule.days.includes(date)}/>) : <div className="schedule-print-lines" style={{ height }}/>}
        {segmentColumns(segments.filter(segment => segment.performance.stageId === stage.id)).map(({ segment, column, columns }) => <SetCard key={segment.performance.id} date={date} segment={segment} column={column} columns={columns} rangeStart={start} color={stage.color} conflicted={conflictIds.has(segment.performance.id)} interactive={interactive} onEdit={onEdit}/>)}
      </div>)}
    </div>
  </section>;
}
