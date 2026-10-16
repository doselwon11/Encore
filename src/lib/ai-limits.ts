import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export class AiLimitLedger {
  private clients = new Map<string, { start: number; count: number; active: boolean }>();
  private hour = { start: 0, count: 0 };
  private day = { start: 0, count: 0 };
  private active = 0;
  acquire(id: string, now = Date.now()): (() => void) | null {
    for (const [key, value] of this.clients) if (!value.active && value.start + 600000 <= now) this.clients.delete(key);
    if (this.hour.start + 3600000 <= now) this.hour = { start: now, count: 0 };
    if (this.day.start + 86400000 <= now) this.day = { start: now, count: 0 };
    const client = this.clients.get(id) || { start: now, count: 0, active: false };
    if (this.active >= 2 || client.active || client.count >= 3 || this.hour.count >= 20 || this.day.count >= 100 || (!this.clients.has(id) && this.clients.size >= 1000)) return null;
    client.count++; client.active = true; this.clients.set(id, client); this.hour.count++; this.day.count++; this.active++;
    let released = false;
    return () => { if (!released) { released = true; client.active = false; this.active--; } };
  }
}
export function createClientIdentity(secret = randomBytes(32)) {
  const sign = (id: string) => createHmac("sha256", secret).update(id).digest("hex");
  return (request: Request) => {
    const token = request.headers.get("cookie")?.split(";").map(part => part.trim()).find(part => part.startsWith("encore-ai="))?.slice(10) || "";
    const [candidate, signature] = token.split(".");
    const valid = /^[a-f0-9-]{36}$/.test(candidate || "") && /^[a-f0-9]{64}$/.test(signature || "") && timingSafeEqual(Buffer.from(signature), Buffer.from(sign(candidate)));
    const id = valid ? candidate : crypto.randomUUID();
    const cookie = `encore-ai=${id}.${sign(id)}; HttpOnly; SameSite=Strict; Path=/api/ai/festival; Max-Age=600${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`;
    return { id, cookie };
  };
}
