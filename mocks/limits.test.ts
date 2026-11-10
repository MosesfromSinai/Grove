import { expect, test } from "vitest";
import { clubNights } from "./data";
import { cancelClubNight, claimClubNight, redeem } from "./index";

test("an impossible location is INVALID_LOCATION", async () => {
  const input = { deal_id: "deal-opt-horchata", qr_slug: "orange-peel-tacos" };
  expect(await redeem({ ...input, lat: 95, lng: -117.3254 })).toEqual({ ok: false, error: "INVALID_LOCATION" });
  expect(await redeem({ ...input, lat: 33.9762, lng: -190 })).toEqual({ ok: false, error: "INVALID_LOCATION" });
});

test("a 4th claim in 7 days is RATE_LIMITED, like claim_club_night()", async () => {
  // Jordan already claimed Chess Club night; add two more open nights to reach the cap of 3.
  const open = clubNights.find((c) => c.id === "cn-pep-open")!;
  clubNights.push({ ...open, id: "cn-cap-1" }, { ...open, id: "cn-cap-2" });
  expect(await claimClubNight({ club_night_id: "cn-pep-open", club_name: "ACM" })).toMatchObject({ ok: true });
  expect(await claimClubNight({ club_night_id: "cn-cap-1", club_name: "Cyber" })).toMatchObject({ ok: true });
  expect(await claimClubNight({ club_night_id: "cn-cap-2", club_name: "PAT" })).toEqual({ ok: false, error: "RATE_LIMITED" });
});

test("cancelClubNight removes an open night and refuses a claimed one", async () => {
  const template = clubNights.find((c) => c.id === "cn-pep-open")!;
  clubNights.push({ ...template, id: "cn-opt-open", business_id: "biz-opt", claimed_club_name: null, claimed_by: null, claimed_at: null, deal_id: null });
  expect(await cancelClubNight({ business_id: "biz-opt", club_night_id: "cn-opt-open" })).toEqual({ ok: true, club_night_id: "cn-opt-open" });
  expect(clubNights.some((c) => c.id === "cn-opt-open")).toBe(false);
  expect(await cancelClubNight({ business_id: "biz-opt", club_night_id: "cn-opt-chess" })).toEqual({ ok: false, error: "ALREADY_CLAIMED" });
  expect(await cancelClubNight({ business_id: "biz-pep", club_night_id: "cn-pep-open" })).toEqual({ ok: false, error: "NOT_OWNER" });
});
