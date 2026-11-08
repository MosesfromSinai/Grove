import { afterEach, expect, test, vi } from "vitest";
import { validateCreateClubNight } from "./club-night-input";
import { createClubNight, getClubNights, setClient } from "./queries";
import type { CreateClubNightInput } from "./types";

const now = new Date("2026-11-06T20:00:00Z");
const input: CreateClubNightInput = { business_id: "b1", night_date: "2026-11-07", start_time: "18:00", end_time: "21:00", giveback: " 15% back to your club " };
afterEach(() => { vi.useRealTimers(); setClient(null as unknown as Parameters<typeof setClient>[0]); });

test("club-night validation canonicalizes only allowed insert fields and permits a still-open same-day window", () => {
  expect(validateCreateClubNight({ ...input, claimed_by: "not-allowed", claimed_club_name: "Not assigned", deal_id: "not-a-deal" } as CreateClubNightInput, now)).toEqual({ ok: true, value: { ...input, giveback: "15% back to your club" } });
  expect(validateCreateClubNight({ ...input, night_date: "2026-11-06", start_time: "11:00", end_time: "13:00" }, now).ok).toBe(true);
});

test("invalid dates, expired/overnight windows, malformed times and missing/long giveback are refused", () => {
  const cases: [Partial<CreateClubNightInput>, string][] = [
    [{ night_date: "2026-02-30" }, "night_date"], [{ night_date: "" }, "night_date"], [{ night_date: "2026-11-05" }, "night_date"],
    [{ start_time: "24:00" }, "start_time"], [{ end_time: "21:00:00" }, "end_time"], [{ end_time: "18:00" }, "end_time"],
    [{ start_time: "22:00", end_time: "02:00" }, "end_time"], [{ giveback: "\n " }, "giveback"], [{ giveback: "x".repeat(501) }, "giveback"],
    [{ night_date: "2026-11-06", start_time: "10:00", end_time: "12:00" }, "end_time"],
  ];
  for (const [override, key] of cases) { const result = validateCreateClubNight({ ...input, ...override }, now); expect(result.ok).toBe(false); if (!result.ok) expect(result.fields).toHaveProperty(key); }
});

test("campus-date boundaries ignore the device timezone and reject ambiguous/nonexistent DST endpoints", () => {
  expect(validateCreateClubNight({ ...input, night_date: "2026-11-06" }, new Date("2026-11-07T07:59:59Z")).ok).toBe(false); // its end has passed
  expect(validateCreateClubNight({ ...input, night_date: "2026-11-06", start_time: "23:58", end_time: "23:59" }, new Date("2026-11-07T07:58:00Z")).ok).toBe(true);
  expect(validateCreateClubNight({ ...input, night_date: "2026-11-06" }, new Date("2026-11-07T08:00:00Z")).ok).toBe(false);
  for (const night_date of ["2026-11-01", "2027-03-14"]) {
    const result = validateCreateClubNight({ ...input, night_date, start_time: night_date.endsWith("11-01") ? "01:30" : "02:30", end_time: "03:30" }, new Date("2026-10-01T00:00Z"));
    expect(result.ok).toBe(false); if (!result.ok) expect(result.fields.start_time).toContain("daylight-saving");
  }
});

type Result = { data: unknown; error: { code?: string; message: string } | null };
const ok = (data: unknown): Result => ({ data, error: null });
function use(results: Result[], signedIn = true) {
  const calls: { table: string; ops: [string, unknown[]][] }[] = [];
  const client = { auth: { getUser: async () => ({ data: { user: signedIn ? { id: "member" } : null }, error: null }) },
    from(table: string) {
      const call = { table, ops: [] as [string, unknown[]][] }; calls.push(call);
      const result = results.shift(); if (!result) throw new Error("Unexpected query");
      const chain: unknown = new Proxy({}, { get: (_, prop) => prop === "then" ? (resolve: (r: Result) => void) => Promise.resolve(result).then(resolve)
        : (...args: unknown[]) => { call.ops.push([String(prop), args]); return chain; } }); return chain;
    } };
  setClient(client as unknown as Parameters<typeof setClient>[0]); return calls;
}

test("owner and staff posting follows existing member permissions with no claim/deal/private writes", async () => {
  vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(now);
  for (const role of ["owner", "staff"]) {
    const calls = use([ok({ role }), ok({ ...input, giveback: "15% back to your club", id: "night1", start_time: "18:00:00", end_time: "21:00:00", businesses: { name: "Kitchen" } })]);
    const result = await createClubNight({ ...input, claimed_by: "private", claimed_club_name: "Not assigned", deal_id: "none" } as CreateClubNightInput);
    expect(result).toEqual({ ok: true, club_night: { ...input, giveback: "15% back to your club", id: "night1", business_name: "Kitchen" } });
    expect(calls[1].table).toBe("club_nights"); expect(calls[1].ops).toContainEqual(["insert", [{ ...input, giveback: "15% back to your club" }]]);
    expect(JSON.stringify(calls)).not.toContain("claimed_by"); expect(JSON.stringify(calls)).not.toContain("deal_id"); expect(JSON.stringify(calls)).not.toContain("staff_pin");
  }
});

test("posting and management reads refuse missing membership, distinguish invalid input and transport failure", async () => {
  vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(now);
  const signedOut = use([], false); expect(await createClubNight(input)).toEqual({ ok: false, error: "NOT_SIGNED_IN" }); expect(signedOut).toHaveLength(0);
  await expect(getClubNights({ businessId: "b1" })).rejects.toMatchObject({ code: "NOT_SIGNED_IN" });
  const missing = use([ok(null)]); expect(await createClubNight(input)).toEqual({ ok: false, error: "NOT_OWNER" }); expect(missing).toHaveLength(1);
  use([ok(null)]); await expect(getClubNights({ businessId: "b1" })).rejects.toMatchObject({ code: "NOT_MEMBER" });
  const invalid = use([ok({ role: "owner" })]); expect(await createClubNight({ ...input, giveback: " " })).toMatchObject({ ok: false, error: "INVALID_CLUB_NIGHT" }); expect(invalid).toHaveLength(1);
  use([ok({ role: "staff" }), { data: null, error: { code: "42501", message: "denied" } }]); expect(await createClubNight(input)).toEqual({ ok: false, error: "NOT_OWNER" });
  use([ok({ role: "owner" }), { data: null, error: { message: "offline" } }]); await expect(createClubNight(input)).rejects.toThrow("offline");
});

test("club results preserve claimed zero counts and large aggregates without returning private identities", async () => {
  const row = { ...input, id: "n1", businesses: { name: "Kitchen" }, claimed_club_name: "Student-entered club", claimed_at: "2026-11-06T20:00:00Z", deal_id: "d1", claimed_by: "private-user", deals: { redemptions: [{ count: 2305 }] } };
  const calls = use([ok({ role: "staff" }), ok([row, { ...row, id: "n2", deals: { redemptions: [{ count: 0 }] } }])]);
  const results = await getClubNights({ businessId: "b1" });
  expect(results.map(n => n.visit_count)).toEqual([2305, 0]); expect(results[0].claimed_club_name).toBe("Student-entered club");
  expect(results[0]).not.toHaveProperty("claimed_by"); expect(JSON.stringify(calls)).not.toContain("claimed_by");
  expect(calls[1].ops).toContainEqual(["eq", ["business_id", "b1"]]); expect(calls[1].ops).toContainEqual(["range", [0, 499]]);
});

test("missing or invalid claimed-deal aggregates fail instead of reporting zero", async () => {
  const row = { ...input, id: "n1", businesses: { name: "Kitchen" }, claimed_club_name: "Club", claimed_at: "2026-11-06T20:00Z", deal_id: "d1" };
  for (const deals of [null, { redemptions: [] }, { redemptions: [{ count: null }] }, { redemptions: [{ count: -1 }] }, { redemptions: [{ count: 1.5 }] }]) {
    use([ok({ role: "owner" }), ok([{ ...row, deals }])]); await expect(getClubNights({ businessId: "b1" })).rejects.toThrow("count unavailable");
  }
  use([ok({ role: "owner" }), ok([{ ...row, deal_id: null, deals: null }])]); await expect(getClubNights({ businessId: "b1" })).rejects.toThrow("count unavailable");
});

test("club-night reads retrieve older pages with stable ordering and fail rather than return a partial list", async () => {
  const row = { ...input, businesses: { name: "Kitchen" }, claimed_club_name: null, claimed_at: null, deal_id: null, deals: null };
  const first = Array.from({ length: 500 }, (_, i) => ({ ...row, id: `n${i}` }));
  const calls = use([ok({ role: "owner" }), ok(first), ok([{ ...row, id: "older-night" }])]);
  expect((await getClubNights({ businessId: "b1" })).at(-1)?.id).toBe("older-night");
  expect(calls[2].ops).toContainEqual(["range", [500, 999]]); expect(calls[2].ops).toContainEqual(["order", ["id", { ascending: false }]]);
  use([ok({ role: "owner" }), ok(first), { data: null, error: { message: "second page offline" } }]);
  await expect(getClubNights({ businessId: "b1" })).rejects.toThrow("second page offline");
});
