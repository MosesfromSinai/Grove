// Local Supabase for function tests: `npm run test:db` after `supabase start` (serves every function).

import { execSync } from "node:child_process";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const local: { API_URL: string; ANON_KEY: string; SERVICE_ROLE_KEY: string } = process.env.SUPABASE_DB_TESTS
  ? JSON.parse(execSync("npx supabase status -o json", { stdio: ["ignore", "pipe", "ignore"] }).toString())
  : { API_URL: "", ANON_KEY: "", SERVICE_ROLE_KEY: "" };

const options = { auth: { persistSession: false } };
export const admin = () => createClient(local.API_URL, local.SERVICE_ROLE_KEY, options);
export const anon = () => createClient(local.API_URL, local.ANON_KEY, options);

// Creates a confirmed user with a profile and returns a client signed in as them.
export async function testUser(email: string, profile: { verified_student?: boolean; role?: string } = {}) {
  const password = `pw-${crypto.randomUUID()}`;
  const { data, error } = await admin().auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  const id = data.user.id;
  await admin().from("profiles").upsert({ id, email, ...profile });
  const client = anon();
  await client.auth.signInWithPassword({ email, password });
  return { id, client };
}

export async function removeUser(id: string, cleanup: (db: SupabaseClient) => Promise<unknown>) {
  await cleanup(admin());
  await admin().from("profiles").delete().eq("id", id);
  await admin().auth.admin.deleteUser(id);
}
