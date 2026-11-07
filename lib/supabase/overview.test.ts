import { afterEach, expect, test, vi } from "vitest";
import { overviewPeriod } from "./overview-period";
import { getBusinessOverview, setClient, subscribeToRedemptions } from "./queries";

afterEach(() => { setClient(null as unknown as Parameters<typeof setClient>[0]); vi.useRealTimers(); });
test("overview periods use campus midnight and Monday across DST and year boundaries", () => {
  expect(overviewPeriod(new Date("2026-11-01T09:30:00Z"))).toEqual({ todayFrom: "2026-11-01T07:00:00.000Z", weekFrom: "2026-10-26T07:00:00.000Z", asOf: "2026-11-01T09:30:00.000Z" });
  expect(overviewPeriod(new Date("2026-11-02T08:00:00Z"))).toMatchObject({ todayFrom: "2026-11-02T08:00:00.000Z", weekFrom: "2026-11-02T08:00:00.000Z" });
  expect(overviewPeriod(new Date("2027-01-01T07:59:59Z"))).toMatchObject({ todayFrom: "2026-12-31T08:00:00.000Z", weekFrom: "2026-12-28T08:00:00.000Z" });
  expect(overviewPeriod(new Date("2026-03-09T07:00:00Z"))).toMatchObject({ todayFrom: "2026-03-09T07:00:00.000Z", weekFrom: "2026-03-09T07:00:00.000Z" });
});

type Result = { data: unknown; error: { message: string } | null; count?: number | null };
function use(results: Result[], user = true) {
  const calls: { table: string; ops: [string, unknown[]][] }[] = [];
  const client = { auth: { getUser: async () => ({ data: { user: user ? { id: "owner" } : null }, error: null }) },
    from(table: string) {
      const query = { table, ops: [] as [string, unknown[]][] }; calls.push(query);
      const result = results.shift(); if (!result) throw new Error("Unexpected query");
      const chain: unknown = new Proxy({}, { get: (_, key) => key === "then" ? (resolve: (r: Result) => void) => Promise.resolve(result).then(resolve)
        : (...args: unknown[]) => { query.ops.push([String(key), args]); return chain; } }); return chain;
    } };
  setClient(client as unknown as Parameters<typeof setClient>[0]); return calls;
}
const ok = (data: unknown, count?: number | null): Result => ({ data, count, error: null });

test("overview uses exact independent counts, a bounded safe feed, and one cutoff", async () => {
  vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2026-11-06T20:00:00Z"));
  const calls = use([ok({ role: "staff" }), ok(null, 1200), ok(null, 5200), ok([{ id: "r1", business_id: "b1", deal_id: "d1", student_id: "s1", redeemed_at: "2026-11-06T19:00Z", redeemed_on: "2026-11-06", method: "pin", deals: { title: "Lunch" }, businesses: { name: "Kitchen" } }])]);
  const result = await getBusinessOverview({ businessId: "b1" });
  expect(result).toMatchObject({ today: 1200, week: 5200, as_of: "2026-11-06T20:00:00.000Z", recentVisits: [{ id: "r1", deal_title: "Lunch", business_name: "Kitchen", method: "pin" }] });
  for (const query of calls.slice(1)) {
    expect(query.ops).toContainEqual(["eq", ["business_id", "b1"]]);
    expect(query.ops).toContainEqual(["lte", ["redeemed_at", result.as_of]]);
  }
  expect(calls[1].ops).toContainEqual(["select", ["id", { count: "exact", head: true }]]);
  expect(calls[1].ops).toContainEqual(["gte", ["redeemed_at", "2026-11-06T08:00:00.000Z"]]);
  expect(calls[2].ops).toContainEqual(["gte", ["redeemed_at", "2026-11-02T08:00:00.000Z"]]);
  expect(calls[3].ops).toContainEqual(["limit", [8]]);
  expect(JSON.stringify(calls)).not.toContain("student_location");
});

test("overview refuses signed-out/nonmember access and does not turn errors into zero", async () => {
  const calls = use([], false); await expect(getBusinessOverview({ businessId: "b1" })).rejects.toMatchObject({ code: "NOT_SIGNED_IN" }); expect(calls).toHaveLength(0);
  const denied = use([ok(null)]); await expect(getBusinessOverview({ businessId: "b1" })).rejects.toMatchObject({ code: "NOT_MEMBER" }); expect(denied).toHaveLength(1);
  use([ok({ role: "owner" }), ok(null, null), ok(null, 0), ok([])]);
  await expect(getBusinessOverview({ businessId: "b1" })).rejects.toThrow("count unavailable");
  use([ok({ role: "owner" }), { data: null, error: { message: "offline" } }, ok(null, 0), ok([])]);
  await expect(getBusinessOverview({ businessId: "b1" })).rejects.toThrow("offline");
  use([ok({ role: "owner" }), ok(null, 0), ok(null, 0), ok([])]);
  expect(await getBusinessOverview({ businessId: "b1" })).toMatchObject({ today: 0, week: 0, recentVisits: [] });
});

test("overview mocks count actual visits by campus periods and keep only the latest eight", async () => {
  vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2026-11-06T20:00:00Z"));
  const mocks = await import("../../mocks"); const data = await import("../../mocks/data");
  const original = [...data.redemptions];
  const row = { deal_id: "deal-opt-burrito", business_id: "biz-opt", student_id: "s1", method: "sticker" as const };
  try {
    data.redemptions.splice(0, data.redemptions.length, ...Array.from({ length: 12 }, (_, i) => ({ ...row, id: `visit-${i}`, redeemed_at: new Date(Date.now() - i * 60_000).toISOString() })),
      { ...row, id: "yesterday", redeemed_at: "2026-11-06T07:59:59Z" },
      { ...row, id: "last-week", redeemed_at: "2026-11-02T07:59:59Z" },
      { ...row, id: "future", redeemed_at: "2026-11-07T20:00:00Z" },
      { ...row, id: "foreign", business_id: "biz-owl", redeemed_at: new Date().toISOString() });
    const result = await mocks.getBusinessOverview({ businessId: "biz-opt" });
    expect(result).toMatchObject({ today: 12, week: 13 }); expect(result.recentVisits.map(r => r.id)).toEqual(Array.from({ length: 8 }, (_, i) => `visit-${i}`));
    expect(result.recentVisits[0].redeemed_on).toBe("2026-11-06");
    await expect(mocks.getBusinessOverview({ businessId: "foreign" })).rejects.toMatchObject({ code: "NOT_MEMBER" });
  } finally { data.redemptions.splice(0, data.redemptions.length, ...original); }
});

test("Realtime reports connection states, filters businesses, and cancels late enrichment", async () => {
  let onEvent: (payload: { new: unknown }) => Promise<void> = async () => {};
  let onStatus: (status: string) => void = () => {};
  let finishLookup: (result: { data: null }) => void = () => {};
  const remove = vi.fn(); const receive = vi.fn(); const status = vi.fn();
  const channel = { on: vi.fn((_kind, _filter, callback) => { onEvent = callback; return channel; }), subscribe: vi.fn(callback => { onStatus = callback; return channel; }) };
  const from = vi.fn(() => ({ select: () => ({ eq: () => ({ maybeSingle: () => new Promise(resolve => { finishLookup = resolve; }) }) }) }));
  setClient({ channel: () => channel, from, removeChannel: remove } as unknown as Parameters<typeof setClient>[0]);
  const stop = subscribeToRedemptions({ businessId: "b1" }, receive, status);
  expect(channel.on.mock.calls[0][1]).toMatchObject({ filter: "business_id=eq.b1", event: "INSERT" });
  expect(status).toHaveBeenCalledWith("connecting"); onStatus("SUBSCRIBED"); expect(status).toHaveBeenLastCalledWith("live");
  onStatus("CHANNEL_ERROR"); expect(status).toHaveBeenLastCalledWith("reconnecting");
  await onEvent({ new: { business_id: "foreign" } }); expect(from).not.toHaveBeenCalled();
  const pending = onEvent({ new: { id: "r1", business_id: "b1", deal_id: "d1" } });
  stop(); finishLookup({ data: null }); await pending;
  expect(receive).not.toHaveBeenCalled(); expect(remove).toHaveBeenCalledWith(channel);
  status.mockClear(); onStatus("SUBSCRIBED"); expect(status).not.toHaveBeenCalled();
});
