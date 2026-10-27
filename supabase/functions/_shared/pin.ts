// Typed wrappers around the PIN SQL functions in 20261026220100_pin_and_rate_limit.sql
// (lockout per student per business since 20261027000000_pin_lockout_per_student.sql).
// Import these in redeem-pin and set-pin instead of calling supabase.rpc() directly.
//
// Usage in redeem (flood check):
//   await recordRedeemAttempt(supabase, studentId);
//   if (await isRedeemRateLimited(supabase, studentId)) return error("RATE_LIMITED");
//
// Usage in redeem-pin:
//   if (await isPinRateLimited(supabase, businessId, studentId)) return error("RATE_LIMITED");
//   const ok = await verifyPin(supabase, businessId, inputPin);
//   await recordPinAttempt(supabase, businessId, studentId, ok);
//   if (!ok) return error("BAD_PIN");
//
// Usage in set-pin:
//   const hashed = await hashPin(supabase, newPin);
//   await supabase.from("businesses").update({ staff_pin: hashed }).eq("id", businessId);

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// Every wrapper throws on a database error instead of returning a default, so a failed
// check never reads as "not rate limited" or "PIN ok". The function answers with a server error.
async function call<T>(supabase: SupabaseClient, fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(`${fn} failed: ${error.message}`);
  return data as T;
}

// Locked out after 5 failed PINs by this student at this business in 15 minutes.
export async function isPinRateLimited(
  supabase: SupabaseClient,
  businessId: string,
  studentId: string,
): Promise<boolean> {
  return (await call<boolean>(supabase, "is_pin_rate_limited", { bid: businessId, sid: studentId })) !== false;
}

export async function verifyPin(
  supabase: SupabaseClient,
  businessId: string,
  inputPin: string,
): Promise<boolean> {
  return (await call<boolean>(supabase, "verify_pin", { bid: businessId, input_pin: inputPin })) === true;
}

export async function recordPinAttempt(
  supabase: SupabaseClient,
  businessId: string,
  studentId: string,
  succeeded: boolean,
): Promise<void> {
  await call<null>(supabase, "record_pin_attempt", { bid: businessId, sid: studentId, succeeded });
}

export async function hashPin(
  supabase: SupabaseClient,
  pin: string,
): Promise<string> {
  if (!/^\d{4}$/.test(pin)) throw new Error("PIN must be 4 digits");
  const hashed = await call<string | null>(supabase, "hash_pin", { pin });
  if (!hashed) throw new Error("hash_pin failed");
  return hashed;
}

export async function isRedeemRateLimited(
  supabase: SupabaseClient,
  studentId: string,
): Promise<boolean> {
  return (await call<boolean>(supabase, "is_redeem_rate_limited", { sid: studentId })) !== false;
}

export async function recordRedeemAttempt(
  supabase: SupabaseClient,
  studentId: string,
): Promise<void> {
  await call<null>(supabase, "record_redeem_attempt", { sid: studentId });
}
