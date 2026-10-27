// redeem-pin (#15): the PIN backup when location or camera fails. Staff type the business's
// 4-digit PIN on the student's phone. Same live and daily checks as redeem, no location.

import { admin, signedInStudent } from "../_shared/auth.ts";
import { isUuid, json, preflight, readJson, serverError } from "../_shared/http.ts";
import {
  isPinRateLimited,
  isRedeemRateLimited,
  recordPinAttempt,
  recordRedeemAttempt,
  verifyPin,
} from "../_shared/pin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight();
  try {
    const student = await signedInStudent(req);
    if (!student.ok) return json(student);

    await recordRedeemAttempt(admin, student.id);
    if (await isRedeemRateLimited(admin, student.id)) return json({ ok: false, error: "RATE_LIMITED" });

    const { deal_id, business_id, pin } = await readJson(req);
    if (!isUuid(deal_id) || !isUuid(business_id)) return json({ ok: false, error: "DEAL_NOT_LIVE" });
    const live = await admin.rpc("deal_live_at", { p_deal: deal_id, p_business: business_id });
    if (live.error) return serverError(live.error);
    if (live.data !== true) return json({ ok: false, error: "DEAL_NOT_LIVE" });

    // Lockout is per student per business, so one person's bad tries don't block everyone else.
    if (await isPinRateLimited(admin, business_id, student.id)) return json({ ok: false, error: "RATE_LIMITED" });
    const right = typeof pin === "string" && /^\d{4}$/.test(pin) && (await verifyPin(admin, business_id, pin));
    await recordPinAttempt(admin, business_id, student.id, right);
    if (!right) return json({ ok: false, error: "BAD_PIN" });

    const { data, error } = await admin.rpc("record_redemption", { p_student: student.id, p_deal: deal_id, p_method: "pin" });
    return error ? serverError(error) : json(data);
  } catch (error) {
    return serverError(error);
  }
});
