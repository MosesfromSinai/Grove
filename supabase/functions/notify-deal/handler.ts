// Dependency-injected worker: offline tests never contact a push service.
export type Delivery = {
  subscription_id: string; deal_id: string; window_start: string;
  endpoint: string; keys: { p256dh: string; auth: string };
  business_name: string; title: string; live_until: string;
};
export type WorkerDeps = {
  authorize(req: Request, deal: string | null): Promise<string | null>;
  enabled: boolean;
  claim(deal: string | null): Promise<Delivery[]>;
  send(row: Delivery, payload: string, ttl: number): Promise<void>;
  finish(row: Delivery, outcome: "sent" | "failed"): Promise<void>;
  remove(row: Delivery): Promise<void>;
  now(): number;
};
const endpoint = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.port && !url.username && !url.password && !url.hash &&
      ["fcm.googleapis.com", "updates.push.services.mozilla.com", "web.push.apple.com"].includes(url.hostname) && url.pathname.length>1;
  } catch { return false; }
};
export function makeHandler(deps: WorkerDeps) {
  return async (req: Request): Promise<Response> => {
    const reply = (value: unknown, status=200) => new Response(JSON.stringify(value), {
      status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info" },
    });
    if (req.method === "OPTIONS") return new Response(null,{status:204,headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST, OPTIONS","Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info"}});
    if (req.method !== "POST") return reply({ error: "Method not allowed" },405);
    let input: Record<string, unknown>;
    try { const value=await req.json(); if(!value || typeof value!=="object" || Array.isArray(value)) throw Error(); input=value; }
    catch { return reply({ error: "Invalid request" },400); }
    const deal=input.deal_id ?? null;
    if (deal !== null && (typeof deal !== "string" || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(deal))) return reply({ error:"Invalid deal" },400);
    try {
      const denied=await deps.authorize(req,deal as string|null);
      if (denied) return reply({ok:false,error:denied});
      if (!deps.enabled) return reply({ok:false,error:"PUSH_DISABLED"});
      const rows=await deps.claim(deal as string|null);
      let sent=0, failed=0;
      // Bound provider concurrency. Claim rows are never returned to callers or logged.
      for(let i=0;i<rows.length;i+=4) {
        await Promise.all(rows.slice(i,i+4).map(async row => {
          const ttl=Math.min(3600,Math.floor((Date.parse(row.live_until)-deps.now())/1000));
          let outcome: "sent" | "failed" = "failed";
          try {
            if (!endpoint(row.endpoint) || !Number.isFinite(ttl) || ttl<=0) throw Error("SKIP");
            await deps.send(row,JSON.stringify({ title:row.business_name.slice(0,80), body:row.title.slice(0,160), path:`/deals/${row.deal_id}` }),ttl);
            sent++;
            outcome="sent";
          } catch(error) {
            failed++;
            const status=(error as {statusCode?:number})?.statusCode;
            if(status===404 || status===410) { await deps.remove(row); return; }
          }
          await deps.finish(row,outcome);
        }));
      }
      return reply({ok:true,sent,failed});
    } catch {
      // web-push errors can contain endpoints, keys or response bodies. Never log them.
      return reply({error:"Push dispatch failed"},500);
    }
  };
}
