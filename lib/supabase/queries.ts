// Real versions of every lib/supabase function in docs/API_CONTRACT.md, on Supabase.
// Same names, inputs, and return types as mocks/; lib/supabase/index.ts picks one.

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./client";
import type { Database, Tables } from "./database.types";
import { campusClock, dealStatus, openNow } from "./deal-status";
import type {
  AddStaffResult,
  BusinessPublic,
  BusinessStats,
  ClaimClubNightResult,
  ClubNight,
  Deal,
  DealCard,
  DealDetail,
  Hours,
  IssueCodeResult,
  MyDeal,
  NotifyDealResult,
  OpenClubNight,
  RedeemResult,
  Redemption,
  SetPinResult,
  StaffMember,
  StaffRedeemResult,
  Weekday,
} from "./types";

type Db = SupabaseClient<Database>;

let client: Db | null = null;

// Tests pass their own client (local database, service role, or a signed-in test user).
export function setClient(c: Db) {
  client = c;
}

const db = (): Db => (client ??= createClient() as Db);

type Response = { data: unknown; error: { message: string } | null };

function check<R extends Response>(result: R): R["data"] {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

const list = <R extends Response>(result: R) => (check(result) ?? []) as NonNullable<R["data"]>;

function one<R extends Response>(result: R): NonNullable<R["data"]> {
  const row = check(result);
  if (row === null) throw new Error("Row not found");
  return row as NonNullable<R["data"]>;
}

const hhmm = (time: string | null) => (time === null ? null : time.slice(0, 5));

const BUSINESS_PUBLIC = "id, name, address, lat, lng, hours, logo_url, is_truck, redemption_mode";

type BusinessRow = Pick<Tables<"businesses">, "id" | "name" | "address" | "lat" | "lng" | "hours" | "logo_url" | "is_truck" | "redemption_mode">;

function toBusinessPublic(b: BusinessRow): BusinessPublic {
  const hours = (b.hours ?? {}) as Hours;
  return {
    id: b.id,
    name: b.name,
    address: b.address,
    lat: b.lat ?? 0,
    lng: b.lng ?? 0,
    hours,
    logo_url: b.logo_url,
    is_truck: b.is_truck,
    open_now: openNow(hours),
    redemption_mode: b.redemption_mode as BusinessPublic["redemption_mode"],
  };
}

function toDeal(d: Tables<"deals">): Deal {
  const deal = {
    id: d.id,
    business_id: d.business_id,
    title: d.title,
    description: d.description,
    discount_type: d.discount_type as Deal["discount_type"],
    discount_value: d.discount_value,
    photo_url: d.photo_url,
    starts_at: d.starts_at,
    ends_at: d.ends_at,
    active_days: d.active_days as Weekday[] | null,
    daily_start: hhmm(d.daily_start),
    daily_end: hhmm(d.daily_end),
    visibility: d.visibility as Deal["visibility"],
    students_only: d.students_only,
    created_at: d.created_at,
  };
  return { ...deal, status: dealStatus(deal) };
}

async function userId(): Promise<string | null> {
  const { data } = await db().auth.getUser();
  return data.user?.id ?? null;
}

// ---------- Queries ----------

// Calls Hikaru's deals_nearby SQL function (#88), which returns DealCard rows.
export async function getDealsNearby(input: {
  lat: number;
  lng: number;
  radiusM: number;
  openNow?: boolean;
  hasDeals?: boolean;
}): Promise<DealCard[]> {
  // Untyped until deals_nearby exists and the database types are regenerated.
  const untyped = db() as unknown as SupabaseClient;
  const result = await untyped.rpc("deals_nearby", {
    lat: input.lat,
    lng: input.lng,
    radius_m: input.radiusM,
    open_now: input.openNow ?? false,
    has_deals: input.hasDeals ?? false,
  });
  return list(result) as DealCard[];
}

// Opens a deal from its link, public or link-only, through deal_by_id().
export async function getDeal(input: { id: string }): Promise<DealDetail | null> {
  const [row] = list(await db().rpc("deal_by_id", { deal_id: input.id }));
  if (!row) return null;
  const business = one(await db().from("businesses").select(BUSINESS_PUBLIC).eq("id", row.business_id).single());
  const student = await userId();
  let redeemed_today = false;
  if (student) {
    const { count } = await db()
      .from("redemptions")
      .select("id", { count: "exact", head: true })
      .eq("student_id", student)
      .eq("deal_id", row.id)
      .eq("redeemed_on", campusClock(new Date()).date);
    redeemed_today = (count ?? 0) > 0;
  }
  return { ...toDeal(row), business: toBusinessPublic(business), redeemed_today };
}

export async function getBusinessBySlug(input: {
  slug: string;
}): Promise<{ business: BusinessPublic; liveDeals: Deal[] } | null> {
  const business = check(await db().from("businesses").select(BUSINESS_PUBLIC).eq("qr_slug", input.slug).maybeSingle());
  if (!business) return null;
  const rows = list(await db().from("deals").select("*").eq("business_id", business.id).eq("visibility", "public"));
  const liveDeals = rows.map(toDeal).filter((d) => d.status === "live");
  return { business: toBusinessPublic(business), liveDeals };
}

export async function getMyRedemptions(): Promise<Redemption[]> {
  const student = await userId();
  if (!student) return [];
  const rows = list(
    await db()
      .from("redemptions")
      .select("id, deal_id, business_id, student_id, redeemed_at, redeemed_on, method, deals(title), businesses(name)")
      .eq("student_id", student)
      .order("redeemed_at", { ascending: false }),
  );
  return rows.map(({ deals, businesses, ...r }) => ({
    ...r,
    method: r.method as Redemption["method"],
    deal_title: deals?.title ?? "",
    business_name: businesses?.name ?? "",
  }));
}

// Counts verified visits in [from, to), per deal and per campus hour. #21 may move this into SQL.
export async function getBusinessStats(input: { businessId: string; from: string; to: string }): Promise<BusinessStats> {
  const rows = list(
    await db()
      .from("redemptions")
      .select("deal_id, redeemed_at, deals(title)")
      .eq("business_id", input.businessId)
      .gte("redeemed_at", input.from)
      .lt("redeemed_at", input.to),
  );
  const perDeal = new Map<string, { deal_id: string; title: string; count: number }>();
  const perHour = new Map<number, number>();
  for (const r of rows) {
    const deal = perDeal.get(r.deal_id) ?? { deal_id: r.deal_id, title: r.deals?.title ?? "", count: 0 };
    deal.count++;
    perDeal.set(r.deal_id, deal);
    const hour = Number(campusClock(new Date(r.redeemed_at)).time.slice(0, 2));
    perHour.set(hour, (perHour.get(hour) ?? 0) + 1);
  }
  return {
    perDeal: [...perDeal.values()].sort((a, b) => b.count - a.count),
    perHour: [...perHour].map(([hour, count]) => ({ hour, count })).sort((a, b) => a.hour - b.hour),
    total: rows.length,
  };
}

export async function getMyDeals(input: { businessId: string }): Promise<MyDeal[]> {
  const rows = list(
    await db()
      .from("deals")
      .select("*, redemptions(count)")
      .eq("business_id", input.businessId)
      .order("starts_at", { ascending: false }),
  );
  return rows.map(({ redemptions, ...d }) => ({ ...toDeal(d), redemption_count: redemptions[0]?.count ?? 0 }));
}

// ---------- Club nights ----------

type ClubNightRow = Pick<
  Tables<"club_nights">,
  "id" | "business_id" | "night_date" | "start_time" | "end_time" | "giveback"
> & { businesses: { name: string } | null };

function expired(c: Pick<ClubNightRow, "night_date" | "end_time">, now = new Date()): boolean {
  const today = campusClock(now);
  return c.night_date < today.date || (c.night_date === today.date && hhmm(c.end_time)! <= today.time);
}

function toOpenClubNight(c: ClubNightRow): OpenClubNight {
  return {
    id: c.id,
    business_id: c.business_id,
    business_name: c.businesses?.name ?? "",
    night_date: c.night_date,
    start_time: hhmm(c.start_time)!,
    end_time: hhmm(c.end_time)!,
    giveback: c.giveback,
  };
}

// Open club nights students can claim, soonest first. RLS limits them to the student's campus.
export async function getOpenClubNights(): Promise<OpenClubNight[]> {
  const rows = list(
    await db()
      .from("club_nights")
      .select("id, business_id, night_date, start_time, end_time, giveback, businesses(name)")
      .is("claimed_club_name", null)
      .gte("night_date", campusClock(new Date()).date)
      .order("night_date")
      .order("start_time"),
  );
  return rows.filter((c) => !expired(c)).map(toOpenClubNight);
}

// A business's club nights with verified visits, newest first.
export async function getClubNights(input: { businessId: string }): Promise<ClubNight[]> {
  const rows = list(
    await db()
      .from("club_nights")
      .select(
        "id, business_id, night_date, start_time, end_time, giveback, claimed_club_name, claimed_at, deal_id, businesses(name), deals(redemptions(count))",
      )
      .eq("business_id", input.businessId)
      .order("night_date", { ascending: false })
      .order("start_time", { ascending: false }),
  );
  return rows.map((c) => ({
    ...toOpenClubNight(c),
    status: c.claimed_club_name ? "claimed" : expired(c) ? "expired" : "open",
    claimed_club_name: c.claimed_club_name,
    claimed_at: c.claimed_at,
    deal_id: c.deal_id,
    visit_count: c.deals?.redemptions[0]?.count ?? 0,
  }));
}

// ---------- Business settings ----------

export async function getStaff(input: { businessId: string }): Promise<StaffMember[]> {
  const rows = list(await db().from("business_members").select("*").eq("business_id", input.businessId));
  return rows.map((m) => ({
    ...m,
    role: m.role as StaffMember["role"],
    status: m.user_id ? "active" : "invited",
  }));
}

// ---------- Edge Functions ----------

// Every function answers HTTP 200 with { ok: true, ... } or { ok: false, error }.
// Anything else (network, server crash) throws, so screens show a generic error.
async function invoke<T>(name: string, body: object): Promise<T> {
  const { data, error } = await db().functions.invoke<T>(name, { body });
  if (error) throw error;
  return data as T;
}

export const redeem = (input: { deal_id: string; qr_slug: string; lat: number | null; lng: number | null }) =>
  invoke<RedeemResult>("redeem", input);

export const redeemPin = (input: { deal_id: string; business_id: string; pin: string }) =>
  invoke<RedeemResult>("redeem-pin", input);

export const issueCode = (input: { deal_id: string }) => invoke<IssueCodeResult>("issue-code", input);

export const staffRedeem = (input: { token: string }) => invoke<StaffRedeemResult>("staff-redeem", input);

export const claimClubNight = (input: { club_night_id: string; club_name: string }) =>
  invoke<ClaimClubNightResult>("claim-club-night", input);

export const setPin = (input: { business_id: string }) => invoke<SetPinResult>("set-pin", input);

export const addStaff = (input: { business_id: string; email: string }) => invoke<AddStaffResult>("add-staff", input);

// Stretch goal: there is no notify-deal function yet.
export const notifyDeal = (input: { deal_id: string }) => invoke<NotifyDealResult>("notify-deal", input);
