// redeem (#14): sticker redemption. The signed-in and .edu checks happen here; every redemption
// rule lives in redeem_sticker() so the checks and the insert run in one transaction.

import { admin, signedInStudent } from "../_shared/auth.ts";
import { isUuid, json, preflight, readJson, serverError } from "../_shared/http.ts";

const coordinate = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : null);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight();
  const student = await signedInStudent(req);
  if (!student.ok) return json(student);

  const { deal_id, qr_slug, lat, lng } = await readJson(req);
  if (!isUuid(deal_id)) return json({ ok: false, error: "DEAL_NOT_LIVE" });
  // TODO(#128): return RATE_LIMITED from Celso's attempt-based limiter once it lands.

  const { data, error } = await admin.rpc("redeem_sticker", {
    p_student: student.id,
    p_deal: deal_id,
    p_qr_slug: typeof qr_slug === "string" ? qr_slug : "",
    p_lat: coordinate(lat),
    p_lng: coordinate(lng),
  });
  return error ? serverError(error) : json(data);
});
