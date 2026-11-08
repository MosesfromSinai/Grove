import { expect, test } from "vitest";
import { confirmedStaffVisit, staffScanErrors, staffScanToken } from "./staff-scan-format";
import type { StaffRedeemResult } from "@/lib/supabase/types";

const success: StaffRedeemResult = { ok: true, deal_title: "Club night", redemption: { id: "r1", business_id: "b1", deal_id: "d1", method: "staff_scan", redeemed_at: "2026-11-07T20:00:00Z", redeemed_on: "2026-11-07", student_id: "private", deal_title: "Club night", business_name: "Kitchen" } };
test("scanner tokens stay opaque and advertising/sticker URLs never reach redemption", () => {
  for (const token of ["mock-test-code", "opaque.token_value-123"]) expect(staffScanToken(token)).toBe(token);
  for (const token of ["", "https://grove.example/deals/d1", "https://grove.example/b/kitchen", "/b/kitchen", " code", "a\nb", "a\0b", "x".repeat(4097)]) expect(staffScanToken(token)).toBeNull();
});
test("only a canonical staff-scan visit for the selected business can become Verified", () => {
  expect(confirmedStaffVisit(success, "b1")).toEqual({ ok: true, title: "Club night", redeemedAt: "2026-11-07T20:00:00Z" });
  for (const redemption of [{ ...success.redemption, business_id: "b2" }, { ...success.redemption, method: "pin" }, { ...success.redemption, id: "" }, { ...success.redemption, redeemed_at: "invalid" }]) expect(() => confirmedStaffVisit({ ...success, redemption } as StaffRedeemResult, "b1")).toThrow();
  expect(() => confirmedStaffVisit({ ...success, deal_title: "" }, "b1")).toThrow();
  expect(JSON.stringify(confirmedStaffVisit(success, "b1"))).not.toContain("private");
});
test("every contract error has a friendly reason while unknown responses remain unconfirmed", () => {
  for (const error of Object.keys(staffScanErrors) as (keyof typeof staffScanErrors)[]) expect(confirmedStaffVisit({ ok: false, error }, "b1")).toEqual({ ok: false, error, reason: staffScanErrors[error] });
  expect(() => confirmedStaffVisit({ ok: false, error: "UNKNOWN" } as unknown as StaffRedeemResult, "b1")).toThrow();
});
