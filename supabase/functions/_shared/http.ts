// CORS and JSON replies shared by every Grove Edge Function.

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const preflight = () => new Response("ok", { headers: corsHeaders });

// Contract results ({ ok: true, ... } or { ok: false, error }) always go out as HTTP 200.
// Anything else is a 500, which the lib/supabase wrapper throws.
export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

export function serverError(error: unknown) {
  console.error(error);
  return json({ error: "Server error" }, 500);
}

// The request body as an object; a missing or malformed body reads as {}.
export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? body : {};
  } catch {
    return {};
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: unknown): value is string => typeof value === "string" && UUID.test(value);
