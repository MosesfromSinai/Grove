// set-pin (#120): the owner gets a new random 4-digit PIN, shown this once and stored only as
// a hash. Used at onboarding and for "Reset PIN".

import { admin, signedIn } from "../_shared/auth.ts";
import { isUuid, json, preflight, readJson, serverError } from "../_shared/http.ts";
import { hashPin } from "../_shared/pin.ts";

// Uniform 0000–9999: redraw the few values that would make % 10000 uneven.
function randomPin(): string {
  const limit = Math.floor(2 ** 32 / 10_000) * 10_000;
  const draw = new Uint32Array(1);
  do crypto.getRandomValues(draw);
  while (draw[0] >= limit);
  return String(draw[0] % 10_000).padStart(4, "0");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight();
  try {
    const user = await signedIn(req);
    if (!user.ok) return json(user);

    const { business_id } = await readJson(req);
    if (!isUuid(business_id)) return json({ ok: false, error: "NOT_OWNER" });
    const { data: owner } = await admin
      .from("business_members")
      .select("role")
      .eq("business_id", business_id)
      .eq("user_id", user.id)
      .eq("role", "owner")
      .maybeSingle();
    if (!owner) return json({ ok: false, error: "NOT_OWNER" });

    const pin = randomPin();
    const { error } = await admin.from("businesses").update({ staff_pin: await hashPin(admin, pin) }).eq("id", business_id);
    return error ? serverError(error) : json({ ok: true, pin });
  } catch (error) {
    return serverError(error);
  }
});
