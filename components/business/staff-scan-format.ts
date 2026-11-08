import type { ErrorCode, StaffRedeemResult } from "@/lib/supabase/types";

export const staffScanErrors: Record<ErrorCode, string> = {
  NOT_SIGNED_IN: "Sign in again with your business account before scanning.",
  NOT_STAFF: "Your account cannot scan for this business. Reload your business access.",
  NOT_OWNER: "Your business access has changed. Reload your business before scanning.",
  NOT_VERIFIED_STUDENT: "The student needs to sign in with a verified school account.",
  DEAL_NOT_LIVE: "This deal is not live now. Ask the student to check its schedule.",
  WRONG_BUSINESS: "This code belongs to another business. Ask the student to open a deal for this business.",
  TOO_FAR: "The visit could not pass its location check. Ask the student to check their in-store redemption options.",
  LOCATION_REQUIRED: "The visit needs a location check. Ask the student to check their in-store redemption options.",
  ALREADY_REDEEMED_TODAY: "This student has already redeemed this deal today.",
  BAD_PIN: "This code could not be verified. Ask the student to show their latest in-store code.",
  CODE_EXPIRED: "This code expired or was already used. Ask the student to show their latest code.",
  RATE_LIMITED: "Too many checks. Wait a moment before scanning a fresh code.",
  ALREADY_CLAIMED: "This code cannot verify a visit. Ask the student to open their deal and show its in-store code.",
  CLUB_NIGHT_EXPIRED: "This club night has ended. Ask the student to check their deal.",
};

// Tokens are opaque. Never parse claims, follow URLs or infer verification from
// the QR itself. Only a successful staffRedeem response can verify a visit.
export function staffScanToken(text: string): string | null {
  if (!text || text.length > 4096 || /\s|[\u0000-\u001f\u007f]/.test(text) || /^[a-z][a-z\d+.-]*:\/\//i.test(text) || text.startsWith("/")) return null;
  return text;
}

export function confirmedStaffVisit(result: StaffRedeemResult, businessId: string) {
  if (result.ok === false) {
    if (!Object.hasOwn(staffScanErrors, result.error)) throw new Error("Unconfirmed scan result.");
    return { ok: false as const, error: result.error, reason: staffScanErrors[result.error] };
  }
  if (result.ok !== true) throw new Error("Unconfirmed scan result.");
  const visit = result.redemption;
  if (!visit || visit.business_id !== businessId || visit.method !== "staff_scan" || typeof visit.id !== "string" || !visit.id.trim() || typeof visit.deal_id !== "string" || !visit.deal_id.trim() ||
    typeof result.deal_title !== "string" || !result.deal_title.trim() || typeof visit.redeemed_at !== "string" ||
    !/^\d{4}-\d\d-\d\dT/.test(visit.redeemed_at) || !Number.isFinite(Date.parse(visit.redeemed_at))) throw new Error("Unconfirmed scan result.");
  return { ok: true as const, title: result.deal_title, redeemedAt: visit.redeemed_at };
}
