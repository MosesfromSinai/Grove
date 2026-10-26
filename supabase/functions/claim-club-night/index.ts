// claim-club-night (#103): a student claims an open club night for their club. The signed-in and
// .edu checks happen here; claim_club_night() makes the claim and creates the link-only deal.

import { admin, signedInStudent } from "../_shared/auth.ts";
import { isUuid, json, preflight, readJson, serverError } from "../_shared/http.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight();
  const student = await signedInStudent(req);
  if (!student.ok) return json(student);

  const { club_night_id, club_name } = await readJson(req);
  if (!isUuid(club_night_id)) return json({ ok: false, error: "CLUB_NIGHT_EXPIRED" });
  // The claim screen requires a name, so a blank one is a bad request (the wrapper throws).
  const club = typeof club_name === "string" ? club_name.trim().slice(0, 60) : "";
  if (!club) return json({ error: "club_name is required" }, 400);
  // TODO(#106): return RATE_LIMITED from Celso's per-student claim limit once it lands.

  const { data, error } = await admin.rpc("claim_club_night", { p_student: student.id, p_night: club_night_id, p_club: club });
  return error ? serverError(error) : json(data);
});
