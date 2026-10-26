// Who is calling. Edge Functions read the caller's JWT, then use the service role for data.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

type Caller<E extends string> = { ok: true; id: string } | { ok: false; error: E };

// The signed-in user behind the request. The anon key alone isn't a user.
export async function signedIn(req: Request): Promise<Caller<"NOT_SIGNED_IN">> {
  const jwt = req.headers.get("Authorization")?.replace(/^Bearer /, "");
  if (!jwt) return { ok: false, error: "NOT_SIGNED_IN" };
  const { data } = await admin.auth.getUser(jwt);
  return data.user ? { ok: true, id: data.user.id } : { ok: false, error: "NOT_SIGNED_IN" };
}

// A signed-in student who passed the .edu check. Every redemption needs one.
export async function signedInStudent(req: Request): Promise<Caller<"NOT_SIGNED_IN" | "NOT_VERIFIED_STUDENT">> {
  const user = await signedIn(req);
  if (!user.ok) return user;
  const { data } = await admin.from("profiles").select("verified_student").eq("id", user.id).maybeSingle();
  return data?.verified_student ? user : { ok: false, error: "NOT_VERIFIED_STUDENT" };
}
