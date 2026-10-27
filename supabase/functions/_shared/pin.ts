// Typed wrappers around the PIN SQL functions in 20261026000100_pin_and_rate_limit.sql.
// Import these in redeem-pin and set-pin instead of calling supabase.rpc() directly.
//
// Usage in redeem (flood check):
//   await recordRedeemAttempt(supabase, studentId);
//   if (await isRedeemRateLimited(supabase, studentId)) return error("RATE_LIMITED");
//
// Usage in redeem-pin:
//   if (await isPinRateLimited(supabase, businessId)) return error("RATE_LIMITED");
//   const ok = await verifyPin(supabase, businessId, inputPin);
//   await recordPinAttempt(supabase, businessId, ok);
//   if (!ok) return error("BAD_PIN");
//
// Usage in set-pin:
//   const hashed = await hashPin(supabase, newPin);
//   await supabase.from("businesses").update({ staff_pin: hashed }).eq("id", businessId);

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function isPinRateLimited(
  supabase: SupabaseClient,
  businessId: string,
): Promise<boolean> {
  const { data } = await supabase.rpc("is_pin_rate_limited", { bid: businessId });
  return data === true;
}

export async function verifyPin(
  supabase: SupabaseClient,
  businessId: string,
  inputPin: string,
): Promise<boolean> {
  const { data } = await supabase.rpc("verify_pin", { bid: businessId, input_pin: inputPin });
  return data === true;
}

export async function recordPinAttempt(
  supabase: SupabaseClient,
  businessId: string,
  succeeded: boolean,
): Promise<void> {
  await supabase.rpc("record_pin_attempt", { bid: businessId, succeeded });
}

export async function hashPin(
  supabase: SupabaseClient,
  pin: string,
): Promise<string> {
  const { data, error } = await supabase.rpc("hash_pin", { pin });
  if (error || !data) throw new Error("hash_pin failed");
  return data as string;
}

export async function isRedeemRateLimited(
  supabase: SupabaseClient,
  studentId: string,
): Promise<boolean> {
  const { data } = await supabase.rpc("is_redeem_rate_limited", { sid: studentId });
  return data === true;
}

export async function recordRedeemAttempt(
  supabase: SupabaseClient,
  studentId: string,
): Promise<void> {
  await supabase.rpc("record_redeem_attempt", { sid: studentId });
}
