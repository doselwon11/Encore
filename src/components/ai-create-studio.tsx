"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, LoaderCircle, Save, Sparkles, WandSparkles } from "lucide-react";
import { aiBriefSchema, FICTIONAL_NOTICE, type AiBrief } from "@/lib/ai-contract";
import { isFestival, type Festival } from "@/lib/festival";
import { FestivalStudio } from "./festival-studio";
import { ProjectDialog } from "./project-dialog";

const emptyBrief: AiBrief = { genres: "", artists: "", location: "", startDate: "", length: 2, artistCount: 12, visualStyle: "", language: "", prompt: "", includeSchedule: false };
export function AiCreateStudio({ onSave, onClose }: { onSave: (festival: Festival) => void; onClose: () => void }) {
  const [brief, setBrief] = useState<AiBrief>(emptyBrief);
  const [draft, setDraft] = useState<Festival | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [confirm, setConfirm] = useState<"close" | "regenerate" | null>(null);
  const controller = useRef<AbortController | null>(null);
  const requestId = useRef(0);
  useEffect(() => () => { requestId.current++; controller.current?.abort(); }, []);
  function cancel() { requestId.current++; controller.current?.abort(); setBusy(false); setError("Generation cancelled. Your festivals are unchanged. A request already sent may still count toward usage."); }
  async function generate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const next = { genres: String(fields.get("genres") || ""), artists: String(fields.get("artists") || ""), location: String(fields.get("location") || ""), startDate: String(fields.get("startDate") || ""), length: Number(fields.get("length")), artistCount: Number(fields.get("artistCount")), visualStyle: String(fields.get("visualStyle") || ""), language: String(fields.get("language") || ""), prompt: String(fields.get("prompt") || ""), includeSchedule: fields.has("includeSchedule") };
    const parsed = aiBriefSchema.safeParse(next);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message || "Check your brief."); return; }
    setBrief(parsed.data); setError(""); setBusy(true);
    const id = ++requestId.current, abort = new AbortController(); controller.current = abort;
    const timeout = setTimeout(() => abort.abort(), 60000);
    try {
      const response = await fetch("/api/ai/festival", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data), signal: abort.signal });
      const result: unknown = await response.json();
      if (id !== requestId.current) return;
      if (!result || typeof result !== "object") throw new Error("The AI returned an unreadable response. Nothing was saved.");
      const payload = result as { error?: unknown; festival?: unknown };
      if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Couldn’t create a concept. Please try again.");
      if (!isFestival(payload.festival) || payload.festival.concept?.source !== "ai" || payload.festival.concept.fictional !== true) throw new Error("The AI returned an unreadable preview. Nothing was saved.");
      setDraft(payload.festival);
    } catch (caught) {
      if (id === requestId.current) setError(abort.signal.aborted ? "Generation timed out. Try fewer artists or omit the schedule." : caught instanceof Error ? caught.message : "Couldn’t reach the AI service. Please try again.");
    } finally { clearTimeout(timeout); if (id === requestId.current) setBusy(false); }
  }
  const update = (field: keyof AiBrief, value: string | number | boolean) => setBrief(previous => ({ ...previous, [field]: value }));
  return <div className="ai-create-page">
    {draft ? <><div className="ai-review-bar"><div><strong><Sparkles size={16}/>Review your fictional concept</strong><span>{FICTIONAL_NOTICE} Edits stay in this preview until you save.</span></div><button className="secondary-button" onClick={() => setConfirm("regenerate")}>Edit brief</button><button className="export-button" disabled={!draft.name.trim()} onClick={() => onSave(draft)}><Save size={15}/>Save as new festival</button></div><FestivalStudio festival={draft} saved={false} onChange={setDraft} onBack={() => setConfirm("close")}/></> : <main className="main-shell ai-brief-shell"><button className="back-to-festivals" onClick={() => busy ? setConfirm("close") : onClose()}><ArrowLeft size={15}/>Back to My Festivals</button><div className="ai-hero"><div className="eyebrow"><span/> ENCORE / AI CREATE</div><h1>Your dream lineup.<br/><span>A spark away.</span></h1><p>Tell us the sound, the place, the feeling. Shape a fictional festival, then make it yours.</p><div className="ai-fiction-notice"><Sparkles size={15}/>{FICTIONAL_NOTICE}</div></div>
      <form className="ai-brief-form" onSubmit={generate}><fieldset disabled={busy}><legend>Your festival brief</legend><label className="field">Genres & sound<textarea name="genres" aria-label="Genres and sound" value={brief.genres} onChange={e => update("genres", e.target.value)} placeholder="City pop, indie electronic, dreamy jazz… 日本語・한국어・Tiếng Việt welcome" maxLength={500} required rows={2}/></label><label className="field">Artists you love (optional)<textarea name="artists" aria-label="Artists you love" value={brief.artists} onChange={e => update("artists", e.target.value)} placeholder="Artists to inspire your fictional lineup" maxLength={800} rows={2}/></label><div className="ai-field-grid"><label className="field">Location<input className="schedule-input" name="location" value={brief.location} onChange={e => update("location", e.target.value)} maxLength={160} placeholder="Tokyo, Japan" required/></label><label className="field">First festival date<input className="schedule-input" name="startDate" type="date" value={brief.startDate} onInput={e => update("startDate", e.currentTarget.value)} min="1900-01-01" max="9999-12-23" required/></label><label className="field">Festival length<select className="schedule-input" name="length" value={brief.length} onChange={e => update("length", Number(e.target.value))}>{[1,2,3,4,5,6,7].map(days => <option key={days} value={days}>{days} {days === 1 ? "day" : "days"}</option>)}</select></label><label className="field">Lineup size<select className="schedule-input" name="artistCount" value={brief.artistCount} onChange={e => update("artistCount", Number(e.target.value))}>{[6,12,18,24].map(count => <option key={count} value={count}>{count} artists</option>)}</select></label></div><label className="field">Visual style<input className="schedule-input" name="visualStyle" value={brief.visualStyle} onChange={e => update("visualStyle", e.target.value)} maxLength={600} placeholder="Japanese City Pop, botanical, neon rave, warm editorial…"/></label><label className="field">Output language (optional)<input className="schedule-input" name="language" value={brief.language} onChange={e => update("language", e.target.value)} maxLength={60} placeholder="Match my brief, or specify 日本語 / 한국어 / Tiếng Việt / English"/></label><label className="field">Anything else? (optional)<textarea name="prompt" value={brief.prompt} onChange={e => update("prompt", e.target.value)} maxLength={1200} rows={3} placeholder="Mood, discoveries, a balance of local and international artists…"/></label><label className="design-checkbox"><input name="includeSchedule" type="checkbox" checked={brief.includeSchedule} onChange={e => update("includeSchedule", e.target.checked)}/>Include a fictional schedule</label><p className="design-hint">Only this brief is sent to OpenAI. Your saved projects stay in this browser. Generating a concept can use the server’s paid API quota. No automatic retries.</p></fieldset>{error && <div className="ai-error" role="alert">{error}</div>}{busy && <div className="ai-loading" role="status"><LoaderCircle className="animate-spin" size={19}/><div><strong>Finding your festival’s frequency…</strong><span>Composing a fictional lineup and poster direction. This can take up to a minute.</span></div></div>}<div className="ai-form-actions"><span>Review and edit before saving.</span>{busy ? <button type="button" className="secondary-button" onClick={cancel}>Cancel generation</button> : <button className="export-button" type="submit"><WandSparkles size={16}/>Generate fictional festival</button>}</div></form>
    </main>}
    {confirm && <ProjectDialog title={confirm === "close" ? "Leave AI Create?" : "Return to your brief?"} onClose={() => setConfirm(null)}><p>{confirm === "close" ? "Your unsaved concept will be discarded. Existing festival projects stay untouched." : "Your unsaved preview edits will be discarded. Your brief stays available, and no existing festival is changed."}</p><div className="dialog-actions"><button className="secondary-button" onClick={() => setConfirm(null)}>Keep reviewing</button><button className="danger-button" onClick={() => { if (confirm === "close") { controller.current?.abort(); onClose(); } else { setDraft(null); setError(""); } setConfirm(null); }}>{confirm === "close" ? "Leave without saving" : "Edit brief"}</button></div></ProjectDialog>}
  </div>;
}
