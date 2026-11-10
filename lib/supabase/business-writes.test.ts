import { afterEach, expect, test, vi } from "vitest";
import { createDeal, endDeal, cancelDeal, getMyBusiness, getMyDeals, getBusinessSticker, saveBusiness, setRedemptionMode, setPin, setClient } from "./queries";
const visits = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `r${i}` }));
import type { CreateDealInput, SaveBusinessInput } from "./types";

type Result = { data: unknown; error: { code?: string; message: string } | null };
type Query = { table: string; operations: [string, unknown[]][] };
const ok = (data: unknown): Result => ({ data, error: null });
const failure = (code: string): Result => ({ data: null, error: { code, message: "database refused request" } });
function fixture(results: Result[], user: string | null = "signed-in-owner") {
  const calls: Query[] = [];
  const remaining = [...results];
  const client = {
    auth: { getUser: async () => ({ data: { user: user ? { id: user } : null }, error: null }) },
    from(table: string) {
      const query: Query = { table, operations: [] };
      calls.push(query);
      const response = remaining.shift();
      if (!response) throw new Error(`Unexpected query on ${table}`);
      const chain: unknown = new Proxy({}, { get: (_, prop) => prop === "then"
        ? (resolve: (value: Result) => void) => Promise.resolve(response).then(resolve)
        : (...args: unknown[]) => { query.operations.push([String(prop), args]); return chain; } });
      return chain;
    },
  };
  setClient(client as unknown as Parameters<typeof setClient>[0]);
  return { calls, remaining, client };
}
const now = "2026-11-06T20:00:00.000Z";
const business = { id: "b1", name: "Test Kitchen", address: "Test address", lat: 33.97, lng: -117.32, hours: {}, logo_url: "https://storage.example/existing.png", is_truck: false, redemption_mode: "sticker" };
const deal = { id: "d1", business_id: "b1", title: "Lunch", description: "Lunch special", discount_type: "amount_off", discount_value: 2, photo_url: null, starts_at: "2026-11-05T20:00:00Z", ends_at: null, active_days: ["mon"], daily_start: "14:00:00", daily_end: "17:00:00", visibility: "link_only", students_only: true, created_at: now, redemptions: visits(3) };
const post: CreateDealInput = { business_id: "b1", title: " Lunch ", description: " Special ", discount_type: "amount_off", discount_value: 2, photo_url: null, starts_at: now, ends_at: null, active_days: ["wed", "mon"], daily_start: "14:00", daily_end: "17:00", visibility: "link_only", students_only: true };
const setup: SaveBusinessInput = { business_id: "b1", name: "Test Kitchen", address: "Test address", lat: 33.97, lng: -117.32, hours: { mon: [["11:00", "21:00"]] }, logo_url: business.logo_url, is_truck: false };
afterEach(() => { setClient(null as unknown as Parameters<typeof setClient>[0]); vi.useRealTimers(); vi.unstubAllEnvs(); });
function freeze() { vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date(now)); }

test("sticker reads check membership and return only the business-facing sticker fields", async () => {
  const { calls } = fixture([ok({ role: "owner" }), ok({ ...business, qr_slug: "test-kitchen", staff_pin: "never-return", owner_id: "private" })]);
  expect(await getBusinessSticker({ businessId: "b1" })).toEqual({ business_id: "b1", business_name: "Test Kitchen", qr_slug: "test-kitchen" });
  expect(calls[1].operations).toContainEqual(["select", ["id, name, qr_slug"]]);
  expect(calls[1].operations).toContainEqual(["eq", ["id", "b1"]]);
  fixture([], null);
  await expect(getBusinessSticker({ businessId: "b1" })).rejects.toMatchObject({ code: "NOT_SIGNED_IN" });
  const denied = fixture([ok(null)]);
  await expect(getBusinessSticker({ businessId: "foreign" })).rejects.toMatchObject({ code: "NOT_MEMBER" });
  expect(denied.calls).toHaveLength(1);
});

test("redemption mode changes are owner-only and preserve all other business fields", async () => {
  fixture([], null); expect(await setRedemptionMode({ business_id: "b1", redemption_mode: "sticker" })).toEqual({ ok: false, error: "NOT_SIGNED_IN" });
  for (const role of [null, { role: "staff" }]) {
    const denied = fixture([ok(role)]); expect(await setRedemptionMode({ business_id: "b1", redemption_mode: "sticker" })).toEqual({ ok: false, error: "NOT_OWNER" }); expect(denied.calls).toHaveLength(1);
  }
  const { calls } = fixture([ok({ role: "owner" }), ok({ redemption_mode: "sticker" })]);
  expect(await setRedemptionMode({ business_id: "b1", redemption_mode: "sticker" })).toEqual({ ok: true, redemption_mode: "sticker" });
  expect(calls[1].operations).toContainEqual(["update", [{ redemption_mode: "sticker" }]]);
  expect(calls[1].operations).toContainEqual(["eq", ["id", "b1"]]);
  expect(calls[1].operations).toContainEqual(["select", ["redemption_mode"]]);
  expect(JSON.stringify(calls)).not.toContain("staff_pin"); expect(JSON.stringify(calls)).not.toContain("qr_slug");
});

test("live Staff scan stays unavailable until #20; mode failures never return success", async () => {
  const pending = fixture([ok({ role: "owner" })]); expect(await setRedemptionMode({ business_id: "b1", redemption_mode: "staff_scan" })).toEqual({ ok: false, error: "STAFF_SCAN_UNAVAILABLE" }); expect(pending.calls).toHaveLength(1);
  fixture([ok({ role: "owner" })]); expect(await setRedemptionMode({ business_id: "b1", redemption_mode: "invalid" as "sticker" })).toEqual({ ok: false, error: "INVALID_MODE" });
  for (const result of [ok(null), failure("42501")]) { fixture([ok({ role: "owner" }), result]); expect(await setRedemptionMode({ business_id: "b1", redemption_mode: "sticker" })).toEqual({ ok: false, error: "NOT_OWNER" }); }
  fixture([ok({ role: "owner" }), failure("network")]); await expect(setRedemptionMode({ business_id: "b1", redemption_mode: "sticker" })).rejects.toThrow("database refused");
  fixture([ok({ role: "owner" }), ok({ redemption_mode: "staff_scan" })]); await expect(setRedemptionMode({ business_id: "b1", redemption_mode: "sticker" })).rejects.toThrow("not confirmed");
});

test("Reset PIN uses only the existing Edge Function contract and propagates refusals", async () => {
  const response = { ok: false, error: "NOT_OWNER" };
  const invoke = vi.fn(async (): Promise<{ data: unknown; error: Error | null }> => ({ data: response, error: null }));
  setClient({ functions: { invoke } } as unknown as Parameters<typeof setClient>[0]);
  expect(await setPin({ business_id: "b1" })).toEqual(response);
  expect(invoke).toHaveBeenCalledWith("set-pin", { body: { business_id: "b1" } });
  invoke.mockResolvedValueOnce({ data: null, error: new Error("offline") });
  await expect(setPin({ business_id: "b1" })).rejects.toThrow("offline");
});

test("sticker reads distinguish missing setup from network failure without generating a slug", async () => {
  fixture([ok({ role: "staff" }), ok(null)]);
  expect(await getBusinessSticker({ businessId: "b1" })).toBeNull();
  fixture([ok({ role: "owner" }), ok({ ...business, qr_slug: "" })]);
  expect(await getBusinessSticker({ businessId: "b1" })).toBeNull();
  fixture([ok({ role: "owner" }), failure("network")]);
  await expect(getBusinessSticker({ businessId: "b1" })).rejects.toThrow("database refused");
});

test("profile uses the authenticated membership and never reads or guesses PIN readiness", async () => {
  const { calls } = fixture([ok([{ business_id: "b1", role: "owner" }]), ok(business)]);
  const result = await getMyBusiness();
  expect(result).toMatchObject({ membership_role: "owner", pin_ready: null, business: { id: "b1" } });
  expect(calls[0].operations).toContainEqual(["eq", ["user_id", "signed-in-owner"]]);
  expect(calls[1].operations).toContainEqual(["eq", ["id", "b1"]]);
  expect(JSON.stringify(calls)).not.toContain("staff_pin");
  expect(JSON.stringify(result)).not.toContain("owner_id");
});

test("missing and ambiguous memberships do not select an arbitrary business", async () => {
  fixture([ok([])]);
  expect(await getMyBusiness()).toBeNull();
  const { calls } = fixture([ok([{ business_id: "b1", role: "owner" }, { business_id: "b2", role: "staff" }])]);
  await expect(getMyBusiness()).rejects.toMatchObject({ code: "MULTIPLE_BUSINESSES" });
  expect(calls).toHaveLength(1);
});

test("signed-out and foreign-member writes fail before mutating anything", async () => {
  const signedOut = fixture([], null);
  for (const action of [() => createDeal(post), () => saveBusiness(setup), () => endDeal({ business_id: "b1", deal_id: "d1" }), () => cancelDeal({ business_id: "b1", deal_id: "d1" })]) expect(await action()).toEqual({ ok: false, error: "NOT_SIGNED_IN" });
  expect(signedOut.calls).toHaveLength(0);
  const foreign = fixture([ok(null)]);
  expect(await createDeal(post)).toEqual({ ok: false, error: "NOT_OWNER" });
  expect(foreign.calls).toHaveLength(1);
  fixture([ok(null)]);
  await expect(getMyDeals({ businessId: "foreign" })).rejects.toMatchObject({ code: "NOT_MEMBER" });
});

test("staff may post a normalized repeating link-only deal but cannot edit the business", async () => {
  freeze();
  const { calls } = fixture([ok({ role: "staff" }), ok(deal)]);
  expect(await createDeal(post)).toMatchObject({ ok: true, deal: { visibility: "link_only", daily_start: "14:00", redemption_count: 0 } });
  const insert = calls[1].operations.find(([name]) => name === "insert")![1][0];
  expect(insert).toMatchObject({ title: "Lunch", description: "Special", active_days: ["mon", "wed"], ends_at: null, visibility: "link_only" });
  expect(insert).not.toHaveProperty("id");
  fixture([ok({ role: "staff" })]);
  expect(await saveBusiness(setup)).toEqual({ ok: false, error: "NOT_OWNER" });
});

test("saving existing details preserves PIN and logo; writes geography in longitude/latitude order", async () => {
  const { calls } = fixture([ok({ role: "owner" }), ok(business), ok(business)]);
  expect(await saveBusiness(setup)).toMatchObject({ ok: true, profile: { pin_ready: null } });
  const update = calls[2].operations.find(([name]) => name === "update")![1][0];
  expect(update).toMatchObject({ location: "SRID=4326;POINT(-117.32 33.97)", logo_url: business.logo_url });
  expect(update).not.toHaveProperty("staff_pin");
  expect(update).not.toHaveProperty("owner_id");
  expect(update).not.toHaveProperty("qr_slug");
});

test("unsupported images never become successful-looking uploads", async () => {
  freeze();
  const create = fixture([ok({ role: "owner" })]);
  expect(await createDeal({ ...post, photo_url: "data:image/png;base64,AAAA" })).toEqual({ ok: false, error: "IMAGE_STORAGE_UNAVAILABLE" });
  expect(create.calls).toHaveLength(1);
  const save = fixture([ok({ role: "owner" }), ok(business)]);
  expect(await saveBusiness({ ...setup, logo_url: "https://storage.example/new.png" })).toEqual({ ok: false, error: "IMAGE_STORAGE_UNAVAILABLE" });
  expect(save.calls).toHaveLength(2);
});

test("End now preserves history for a repeating deal outside its daily window", async () => {
  freeze();
  const { calls } = fixture([ok({ role: "owner" }), ok(deal), ok({ ...deal, ends_at: now })]);
  expect(await endDeal({ business_id: "b1", deal_id: "d1" })).toMatchObject({ ok: true, deal: { status: "ended", redemption_count: 3 } });
  expect(calls[2].operations).toContainEqual(["lt", ["starts_at", now]]);
  expect(calls[2].operations).toContainEqual(["eq", ["business_id", "b1"]]);
  expect(calls[2].operations.some(([name]) => name === "delete")).toBe(false);
  fixture([ok({ role: "owner" }), ok({ ...deal, starts_at: "2027-01-01T00:00:00Z" })]);
  expect(await endDeal({ business_id: "b1", deal_id: "d1" })).toMatchObject({ error: "DEAL_NOT_LIVE" });
});

test("Cancel protects counts, club-night references, and history added during deletion", async () => {
  freeze();
  const future = { ...deal, starts_at: "2027-01-01T00:00:00Z", redemptions: visits(0) };
  fixture([ok({ role: "owner" }), ok({ ...future, redemptions: visits(1) })]);
  expect(await cancelDeal({ business_id: "b1", deal_id: "d1" })).toMatchObject({ error: "DEAL_HAS_REDEMPTIONS" });
  fixture([ok({ role: "owner" }), ok(future), ok([{ id: "club1" }])]);
  expect(await cancelDeal({ business_id: "b1", deal_id: "d1" })).toMatchObject({ error: "DEAL_IN_USE" });
  fixture([ok({ role: "owner" }), ok(future), ok([]), failure("23503"), ok({ ...future, redemptions: visits(1) })]);
  expect(await cancelDeal({ business_id: "b1", deal_id: "d1" })).toMatchObject({ error: "DEAL_HAS_REDEMPTIONS" });
});

test("conditional mutation failures and network failures never return success", async () => {
  freeze();
  fixture([ok({ role: "owner" }), ok(deal), ok(null)]);
  expect(await endDeal({ business_id: "b1", deal_id: "d1" })).toMatchObject({ error: "DEAL_NOT_LIVE" });
  fixture([ok({ role: "owner" }), failure("network")]);
  await expect(createDeal(post)).rejects.toThrow("database refused");
  fixture([ok({ role: "owner" }), failure("42501")]);
  expect(await createDeal(post)).toEqual({ ok: false, error: "NOT_OWNER" });
});

test("the shared real-data switch never calls mock business adapters", async () => {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_DATA_SOURCE", "supabase");
  const real = await import("./queries");
  const client = fixture([], null).client;
  real.setClient(client as unknown as Parameters<typeof real.setClient>[0]);
  const api = await import("./index");
  expect(api.isMockData).toBe(false);
  await expect(api.getMyBusiness()).rejects.toMatchObject({ code: "NOT_SIGNED_IN" });
  expect(await api.createDeal({ ...post, business_id: "biz-opt" })).toEqual({ ok: false, error: "NOT_SIGNED_IN" });
  real.setClient(null as unknown as Parameters<typeof real.setClient>[0]);
});
