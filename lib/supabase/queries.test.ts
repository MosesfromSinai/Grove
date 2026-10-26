import { afterEach, expect, test } from "vitest";
import { campusClock } from "./deal-status";
import {
  getBusinessBySlug,
  getBusinessStats,
  getClubNights,
  getMyDeals,
  getOpenClubNights,
  getStaff,
  redeem,
  setClient,
} from "./queries";

// A stand-in Supabase client: every query chain resolves to the rows configured for its table.
type Fake = {
  tables?: Record<string, unknown>;
  invoke?: (name: string, body: unknown) => { data: unknown; error: Error | null };
};

function fakeClient({ tables = {}, invoke }: Fake) {
  const chain = (data: unknown): unknown =>
    new Proxy(() => {}, {
      get: (_, prop) =>
        prop === "then"
          ? (resolve: (r: unknown) => void) => resolve({ data, error: null, count: null })
          : () => chain(data),
    });
  return {
    from: (table: string) => chain(table in tables ? tables[table] : []),
    rpc: () => chain([]),
    auth: { getUser: async () => ({ data: { user: null } }) },
    functions: { invoke: async (name: string, opts: { body: unknown }) => invoke!(name, opts.body) },
  };
}

const use = (fake: Fake) => setClient(fakeClient(fake) as unknown as Parameters<typeof setClient>[0]);

const DAY = 86_400_000;
const campusDate = (offsetDays: number) => campusClock(new Date(Date.now() + offsetDays * DAY)).date;

const dealRow = {
  id: "d1",
  business_id: "b1",
  title: "$3 off any bowl",
  description: "",
  photo_url: null,
  starts_at: "2026-10-16T07:00:00+00:00",
  ends_at: null,
  active_days: ["mon", "tue", "wed"],
  daily_start: "14:00:00",
  daily_end: "17:00:00",
  visibility: "public",
  discount_type: "amount_off",
  discount_value: 3,
  students_only: true,
  created_at: "2026-10-15T07:00:00+00:00",
};

afterEach(() => setClient(null as unknown as Parameters<typeof setClient>[0]));

test("getMyDeals maps counts, HH:MM windows, and computed status", async () => {
  use({ tables: { deals: [{ ...dealRow, redemptions: [{ count: 4 }] }] } });
  const [deal] = await getMyDeals({ businessId: "b1" });
  expect(deal).toMatchObject({ redemption_count: 4, daily_start: "14:00", daily_end: "17:00" });
  expect(["live", "scheduled"]).toContain(deal.status);
});

test("getBusinessBySlug keeps only live deals and computes open_now", async () => {
  const business = { id: "b1", name: "Verde Bowl", address: "", lat: 33.968, lng: -117.322, hours: {}, logo_url: null, is_truck: false, redemption_mode: "sticker" };
  const live = { ...dealRow, id: "d2", active_days: null, daily_start: null, daily_end: null, ends_at: new Date(Date.now() + DAY).toISOString() };
  const ended = { ...live, id: "d3", ends_at: new Date(Date.now() - DAY).toISOString() };
  use({ tables: { businesses: business, deals: [live, ended] } });
  const result = await getBusinessBySlug({ slug: "verde-bowl" });
  expect(result?.business).toMatchObject({ name: "Verde Bowl", lat: 33.968, open_now: false });
  expect(result?.liveDeals.map((d) => d.id)).toEqual(["d2"]);
});

test("getBusinessBySlug returns null for an unknown sticker", async () => {
  use({ tables: { businesses: null } });
  expect(await getBusinessBySlug({ slug: "nope" })).toBeNull();
});

test("getBusinessStats counts per deal and per campus hour", async () => {
  use({
    tables: {
      redemptions: [
        { deal_id: "d1", redeemed_at: "2026-10-26T19:10:00Z", deals: { title: "A" } }, // 12:10 PM campus
        { deal_id: "d1", redeemed_at: "2026-10-26T19:40:00Z", deals: { title: "A" } },
        { deal_id: "d2", redeemed_at: "2026-10-26T01:05:00Z", deals: { title: "B" } }, // 6:05 PM the day before
      ],
    },
  });
  expect(await getBusinessStats({ businessId: "b1", from: "", to: "" })).toEqual({
    perDeal: [
      { deal_id: "d1", title: "A", count: 2 },
      { deal_id: "d2", title: "B", count: 1 },
    ],
    perHour: [
      { hour: 12, count: 2 },
      { hour: 18, count: 1 },
    ],
    total: 3,
  });
});

const night = { business_id: "b1", start_time: "18:00:00", end_time: "21:00:00", giveback: "15% back", businesses: { name: "Pepper Tree Pizza Co." } };

test("getOpenClubNights drops nights that already ended", async () => {
  use({
    tables: {
      club_nights: [
        { ...night, id: "past", night_date: campusDate(-1) },
        { ...night, id: "soon", night_date: campusDate(2) },
      ],
    },
  });
  const nights = await getOpenClubNights();
  expect(nights.map((n) => n.id)).toEqual(["soon"]);
  expect(nights[0]).toMatchObject({ business_name: "Pepper Tree Pizza Co.", start_time: "18:00", end_time: "21:00" });
});

test("getClubNights computes status and visit counts", async () => {
  const unclaimed = { claimed_club_name: null, claimed_at: null, deal_id: null, deals: null };
  use({
    tables: {
      club_nights: [
        { ...night, ...unclaimed, id: "open", night_date: campusDate(2) },
        { ...night, ...unclaimed, id: "expired", night_date: campusDate(-3) },
        { ...night, id: "claimed", night_date: campusDate(-2), claimed_club_name: "Film Club", claimed_at: "x", deal_id: "d9", deals: { redemptions: [{ count: 18 }] } },
      ],
    },
  });
  const byId = Object.fromEntries((await getClubNights({ businessId: "b1" })).map((n) => [n.id, n]));
  expect(byId.open).toMatchObject({ status: "open", visit_count: 0 });
  expect(byId.expired.status).toBe("expired");
  expect(byId.claimed).toMatchObject({ status: "claimed", visit_count: 18 });
});

test("getStaff marks members without a user id as invited", async () => {
  use({
    tables: {
      business_members: [
        { business_id: "b1", user_id: "u1", email: "owner@x.example", role: "owner" },
        { business_id: "b1", user_id: null, email: "taylor@x.example", role: "staff" },
      ],
    },
  });
  expect((await getStaff({ businessId: "b1" })).map((m) => m.status)).toEqual(["active", "invited"]);
});

test("function wrappers return the { ok, error } body and throw on transport errors", async () => {
  use({ invoke: () => ({ data: { ok: false, error: "TOO_FAR" }, error: null }) });
  expect(await redeem({ deal_id: "d1", qr_slug: "s", lat: 0, lng: 0 })).toEqual({ ok: false, error: "TOO_FAR" });
  use({ invoke: () => ({ data: null, error: new Error("offline") }) });
  await expect(redeem({ deal_id: "d1", qr_slug: "s", lat: 0, lng: 0 })).rejects.toThrow("offline");
});
