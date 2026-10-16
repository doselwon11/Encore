import { test } from "node:test";
import assert from "node:assert/strict";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { aiBriefSchema, aiConceptSchema, conceptToFestival } from "../src/lib/ai-contract.ts";
import { createAiHandler } from "../src/lib/ai-handler.ts";
import { AiLimitLedger, createClientIdentity } from "../src/lib/ai-limits.ts";
import { AiServiceError, createOpenAiGenerator } from "../src/lib/ai-provider.ts";
import { addAiProject, createProject, loadProjects, saveProjects, type ProjectStore } from "../src/lib/projects.ts";
import { isSchedule } from "../src/lib/schedule.ts";
import { brief, exampleConcept, sdkResponse } from "./fixtures/ai-fixtures.ts";

function request(body: unknown = brief, extra: Record<string,string> = {}) { return new Request("https://encore.example/api/ai/festival", { method: "POST", headers: { origin: "https://encore.example", "content-type": "application/json", ...extra }, body: typeof body === "string" ? body : JSON.stringify(body) }); }
const handler = (generate: (input: typeof brief, signal: AbortSignal) => Promise<unknown> = async input => exampleConcept(input)) => createAiHandler({ configured: () => true, generate });

test("brief validation accepts multilingual data but bounds dates, fields and cost", () => {
  assert.ok(aiBriefSchema.safeParse(brief).success);
  for (const invalid of [{ artistCount: 1000 }, { genres: "x".repeat(501) }, { location: "" }, { length: 8 }, { startDate: "2027-02-30" }, { prompt: "x".repeat(1201) }, { model: "arbitrary-model" }, { startDate: "9999-12-31" }]) assert.ok(!aiBriefSchema.safeParse({ ...brief, ...invalid }).success);
});
test("structured schema is strict and compatible with the official SDK helper", () => {
  const format = zodTextFormat(aiConceptSchema, "fictional_festival");
  assert.equal(format.type,"json_schema"); assert.equal(format.strict,true);
  assert.ok(!aiConceptSchema.safeParse({ ...exampleConcept(), fictional: false }).success);
  assert.ok(!aiConceptSchema.safeParse({ ...exampleConcept(), extra: "untrusted" }).success);
});
test("generated concepts map to native design and conflict-free local schedules", () => {
  const festival = conceptToFestival(exampleConcept(),brief);
  assert.equal(festival.location,brief.location); assert.equal(festival.date,"2027-08-22 – 2027-08-23");
  assert.equal(festival.design?.template,"japanese-city-pop"); assert.ok(isSchedule(festival.schedule)); assert.equal(festival.concept?.fictional,true);
  const overnight = exampleConcept(); overnight.schedule!.performances[0].start = "2027-08-22T23:30"; overnight.schedule!.performances[0].end = "2027-08-23T00:30";
  assert.ok(isSchedule(conceptToFestival(overnight,brief).schedule));
  assert.equal(conceptToFestival(exampleConcept({ ...brief, includeSchedule:false }), { ...brief, includeSchedule:false }).schedule,undefined);
});
test("semantic checks reject duplicates, missing sets, unknown artists and midnight conflicts", () => {
  const cases = [exampleConcept(),exampleConcept(),exampleConcept(),exampleConcept(),exampleConcept()];
  cases[0].tiers[1].artists[0] = cases[0].tiers[0].artists[0];
  cases[1].schedule!.performances.pop();
  cases[2].schedule!.performances[0].artist = "Not in lineup";
  cases[3].schedule!.performances[0] = { ...cases[3].schedule!.performances[0],start:"2027-08-22T23:30",end:"2027-08-23T12:30" };
  cases[4].schedule!.performances[0].stage = "Unknown";
  for(const output of cases) assert.throws(()=>conceptToFestival(output,brief));
});
test("endpoint rejects cross-origin, non-JSON, oversized, malformed and invalid requests before generation", async () => {
  let calls=0; const post=handler(async()=>{ calls++; return exampleConcept(); });
  for(const [req,status] of [[request(brief,{origin:"https://evil.example"}),403],[request(brief,{"content-type":"text/plain"}),415],[request("x".repeat(16001)),413],[request("{"),400],[request({ ...brief,artistCount:999 }),400]] as const) assert.equal((await post(req)).status,status);
  assert.equal(calls,0);
  const largeStream = new ReadableStream({ start(controller){ controller.enqueue(new TextEncoder().encode("x".repeat(16001))); controller.close(); } });
  const streamed = new Request("https://encore.example/api/ai/festival",{method:"POST",headers:{origin:"https://encore.example","content-type":"application/json"},body:largeStream,duplex:"half"} as RequestInit);
  assert.equal((await post(streamed)).status,413);
});
test("missing server configuration fails safely and never invokes OpenAI", async () => {
  const post=createAiHandler({configured:()=>false,generate:async()=>{throw Error("must not run");}});
  const response=await post(request()); assert.equal(response.status,503); assert.equal(response.headers.get("cache-control"),"no-store");
  assert.equal((await response.json()).code,"not_configured");
});
test("provider failures are sanitized, refusal is explicit, invalid output cannot be saved", async () => {
  for(const [error,status,code] of [[new Error("sensitive upstream detail"),503,"unavailable"],[{status:429},503,"upstream_limit"],[{name:"APIConnectionTimeoutError"},504,"timeout"],[new AiServiceError("refused",422,"Adjust the brief."),422,"refused"]] as const) {
    const response=await handler(async()=>{throw error;})(request()); assert.equal(response.status,status); const json=await response.json(); assert.equal(json.code,code); assert.doesNotMatch(JSON.stringify(json),/sensitive upstream/);
  }
  assert.equal((await handler(async()=>({ fictional:false }))(request())).status,502);
});
test("generation deadline aborts the upstream request and releases concurrency", async () => {
  let aborted=false; const ledger=new AiLimitLedger();
  const post=createAiHandler({configured:()=>true,ledger,timeoutMs:10,generate:async(_input,signal)=>new Promise(()=>{signal.addEventListener("abort",()=>{aborted=true;});})});
  assert.equal((await post(request())).status,504); assert.ok(aborted);
  const release=ledger.acquire("another"); assert.ok(release); release();
});
test("signed session budgets resist forged IDs and enforce per-client and global caps", async () => {
  const identify=createClientIdentity(Buffer.alloc(32,1)); const first=identify(request());
  assert.equal(identify(request(brief,{cookie:first.cookie.split(";")[0]})).id,first.id);
  assert.notEqual(identify(request(brief,{cookie:first.cookie.split(";")[0].replace(/.$/,"z")})).id,first.id);
  assert.match(first.cookie,/HttpOnly; SameSite=Strict/); assert.match(first.cookie,/Secure/);
  const post=createAiHandler({configured:()=>true,identity:identify,generate:async()=>exampleConcept()});
  for(let i=0;i<3;i++) assert.equal((await post(request(brief,{cookie:first.cookie.split(";")[0]}))).status,200);
  const limited=await post(request(brief,{cookie:first.cookie.split(";")[0]})); assert.equal(limited.status,429); assert.equal(limited.headers.get("retry-after"),"600");
  const ledger=new AiLimitLedger(); const a=ledger.acquire("a",1), b=ledger.acquire("b",1); assert.ok(a&&b); assert.equal(ledger.acquire("c",1),null); a(); b();
  for(let i=2;i<20;i++){ const release=ledger.acquire(`client${i}`,1); assert.ok(release);release(); }
  assert.equal(ledger.acquire("next",1),null); const later=ledger.acquire("next",3600001); assert.ok(later); later();
  const daily=new AiLimitLedger();
  for(let hour=0;hour<5;hour++) for(let i=0;i<20;i++){const done=daily.acquire(`h${hour}-${i}`,1+hour*3600000); assert.ok(done);done();}
  assert.equal(daily.acquire("day-cap",1+5*3600000),null);
  const nextDay=daily.acquire("next-day",1+86400000); assert.ok(nextDay); nextDay();
});
test("official SDK sends server-selected model, strict schema, no storage, no tools and bounded tokens", async () => {
  let sent: Record<string,unknown> = {};
  const client=new OpenAI({apiKey:"test",maxRetries:0,fetch:async(_url,init)=>{sent=JSON.parse(String(init?.body));return Response.json(sdkResponse());}});
  const output=await createOpenAiGenerator(client)(brief,new AbortController().signal);
  assert.deepEqual(output,exampleConcept()); assert.equal(sent.store,false); assert.equal(sent.model,"gpt-4.1-mini"); assert.equal(sent.max_output_tokens,4000); assert.equal(sent.tools,undefined);
  assert.match(String(sent.instructions),/FICTIONAL/); assert.deepEqual(JSON.parse(((sent.input as {content:string}[])[0]).content),brief);
  const refuseClient=new OpenAI({apiKey:"test",fetch:async()=>Response.json({...sdkResponse(),output:[{type:"message",id:"m",role:"assistant",status:"completed",content:[{type:"refusal",refusal:"No"}]}]})});
  await assert.rejects(createOpenAiGenerator(refuseClient)(brief,new AbortController().signal),error=>error instanceof AiServiceError&&error.code==="refused");
  const incompleteClient=new OpenAI({apiKey:"test",fetch:async()=>Response.json(sdkResponse(exampleConcept(),"incomplete"))});
  await assert.rejects(createOpenAiGenerator(incompleteClient)(brief,new AbortController().signal),error=>error instanceof AiServiceError&&error.code==="incomplete");
});
test("preview edits are isolated and saving adds a fresh project without overwriting existing content", () => {
  const original=createProject("sample"); const store: ProjectStore={version:1,projects:[original],activeProjectId:null}; const before=structuredClone(store);
  const draft=conceptToFestival(exampleConcept(),brief); draft.name="Reviewed 東京 festival"; draft.tiers[0].artists[0]="Edited guest";
  assert.deepEqual(store,before);
  const next=addAiProject(store,draft); assert.equal(next.projects.length,2); assert.deepEqual(next.projects[1],original); assert.notEqual(next.projects[0].id,original.id);
  draft.name="Unsaved later edit"; assert.equal(next.projects[0].festival.name,"Reviewed 東京 festival");
  const values=new Map<string,string>(); const storage={getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value);}};
  assert.ok(saveProjects(storage,next)); assert.deepEqual(loadProjects(storage).store,next); assert.equal(loadProjects(storage).store.projects[0].festival.concept?.fictional,true);
  assert.throws(()=>addAiProject(store,{...draft,concept:undefined}));
});
