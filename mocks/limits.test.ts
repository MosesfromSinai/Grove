import { expect, test } from "vitest";
import { clubNights } from "./data";
import { claimClubNight, redeem } from "./index";

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
