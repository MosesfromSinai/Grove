// Mock versions of every lib/supabase function in docs/API_CONTRACT.md.
// Same names, inputs, and return types, so swapping to the real ones is an import change.
// State lives in memory and resets on page reload.

import { dealStatus } from "../lib/supabase/deal-status";
import type {
  BusinessPublic,
  BusinessStats,
  Deal,
  DealCard,
  DealDetail,
  IssueCodeResult,
  MyDeal,
  NotifyDealResult,
  RedeemResult,
  Redemption,
  StaffRedeemResult,
} from "../lib/supabase/types";
import {
  businesses,
  deals,
  mockStaff,
  mockStudent,
  orangePeelStats,
  redemptions,
  type MockBusiness,
  type MockDeal,
  type MockRedemption,
} from "./data";

export { UCR_CENTER } from "./data";

const REDEEM_RADIUS_M = 150;
const CODE_TTL_MS = 30_000;

// Handy coordinates for testing redeem() away from Riverside.
export const MOCK_POSITIONS = {
  atOrangePeelTacos: { lat: 33.9762, lng: -117.3254 },
  campusCenter: { lat: 33.9737, lng: -117.3281 },
};

const delay = <T>(value: T, ms = 250) => new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

function distanceM(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const r = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * r * Math.asin(Math.sqrt(h)));
}

function localDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toDeal(d: MockDeal): Deal {
  return { ...d, status: dealStatus(d.starts_at, d.ends_at) };
}

function toBusinessPublic(b: MockBusiness): BusinessPublic {
  const { qr_slug: _slug, staff_pin: _pin, ...pub } = b;
  return pub;
}

function businessById(id: string): MockBusiness {
  const b = businesses.find((x) => x.id === id);
  if (!b) throw new Error(`Mock business ${id} not found`);
  return b;
}

function toRedemption(r: MockRedemption): Redemption {
  const d = deals.find((x) => x.id === r.deal_id);
  return {
    ...r,
    redeemed_on: localDate(r.redeemed_at),
    deal_title: d?.title ?? "",
    business_name: businessById(r.business_id).name,
  };
}

function redeemedToday(dealId: string): boolean {
  const today = localDate(new Date().toISOString());
  return redemptions.some(
    (r) => r.student_id === mockStudent.id && r.deal_id === dealId && localDate(r.redeemed_at) === today,
  );
}

function record(d: MockDeal, method: MockRedemption["method"]): Redemption {
  const r: MockRedemption = {
    id: `red-${Date.now()}`,
    deal_id: d.id,
    business_id: d.business_id,
    student_id: mockStudent.id,
    redeemed_at: new Date().toISOString(),
    method,
  };
  redemptions.unshift(r);
  return toRedemption(r);
}

// ---------- Queries ----------

export async function getDealsNearby(input: {
  lat: number;
  lng: number;
  radiusM: number;
  openNow?: boolean;
  hasDeals?: boolean;
}): Promise<DealCard[]> {
  const rows: DealCard[] = [];
  for (const b of businesses) {
    const distance_m = distanceM(input.lat, input.lng, b.lat, b.lng);
    if (distance_m > input.radiusM) continue;
    if (input.openNow && !b.open_now) continue;
    const base = {
      business_id: b.id,
      business_name: b.name,
      logo_url: b.logo_url,
      is_truck: b.is_truck,
      lat: b.lat,
      lng: b.lng,
      distance_m,
      open_now: b.open_now,
    };
    const live = deals.filter((d) => d.business_id === b.id && dealStatus(d.starts_at, d.ends_at) === "live");
    for (const d of live) {
      rows.push({
        ...base,
        has_deal: true,
        deal_id: d.id,
        title: d.title,
        discount_type: d.discount_type,
        discount_value: d.discount_value,
        ends_at: d.ends_at,
        students_only: d.students_only,
        photo_url: d.photo_url,
      });
    }
    if (live.length === 0 && !input.hasDeals) {
      rows.push({
        ...base,
        has_deal: false,
        deal_id: null,
        title: null,
        discount_type: null,
        discount_value: null,
        ends_at: null,
        students_only: null,
        photo_url: null,
      });
    }
  }
  rows.sort((a, b) => a.distance_m - b.distance_m);
  return delay(rows);
}

export async function getDeal(input: { id: string }): Promise<DealDetail | null> {
  const d = deals.find((x) => x.id === input.id);
  if (!d) return delay(null);
  return delay({
    ...toDeal(d),
    business: toBusinessPublic(businessById(d.business_id)),
    redeemed_today: redeemedToday(d.id),
  });
}

export async function getBusinessBySlug(input: {
  slug: string;
}): Promise<{ business: BusinessPublic; liveDeals: Deal[] } | null> {
  const b = businesses.find((x) => x.qr_slug === input.slug);
  if (!b) return delay(null);
  const liveDeals = deals
    .filter((d) => d.business_id === b.id)
    .map(toDeal)
    .filter((d) => d.status === "live");
  return delay({ business: toBusinessPublic(b), liveDeals });
}

export async function getMyRedemptions(): Promise<Redemption[]> {
  const mine = redemptions
    .filter((r) => r.student_id === mockStudent.id)
    .sort((a, b) => b.redeemed_at.localeCompare(a.redeemed_at));
  return delay(mine.map(toRedemption));
}

export async function getBusinessStats(input: {
  businessId: string;
  from: string;
  to: string;
}): Promise<BusinessStats> {
  if (input.businessId !== "biz-opt") return delay({ perDeal: [], perHour: [], total: 0 });
  const days = (new Date(input.to).getTime() - new Date(input.from).getTime()) / 86_400_000;
  const src = days > 7 ? orangePeelStats.last30 : orangePeelStats.last7;
  const perDeal = src.perDeal.map(([deal_id, count]) => ({
    deal_id,
    title: deals.find((d) => d.id === deal_id)?.title ?? "",
    count,
  }));
  const perHour = src.perHour.map(([hour, count]) => ({ hour, count }));
  return delay({ perDeal, perHour, total: perDeal.reduce((sum, d) => sum + d.count, 0) });
}

export async function getMyDeals(input: { businessId: string }): Promise<MyDeal[]> {
  const counts = new Map<string, number>(
    input.businessId === "biz-opt" ? orangePeelStats.last30.perDeal.map(([id, n]) => [id, n]) : [],
  );
  const mine = deals
    .filter((d) => d.business_id === input.businessId)
    .map((d) => ({ ...toDeal(d), redemption_count: counts.get(d.id) ?? 0 }))
    .sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  return delay(mine);
}

// ---------- Edge Functions ----------

export async function redeem(input: {
  deal_id: string;
  qr_slug: string;
  lat: number | null;
  lng: number | null;
}): Promise<RedeemResult> {
  const d = deals.find((x) => x.id === input.deal_id);
  if (!d) return delay({ ok: false, error: "DEAL_NOT_LIVE" });
  const b = businessById(d.business_id);
  if (b.qr_slug !== input.qr_slug) return delay({ ok: false, error: "WRONG_BUSINESS" });
  if (dealStatus(d.starts_at, d.ends_at) !== "live") return delay({ ok: false, error: "DEAL_NOT_LIVE" });
  if (input.lat === null || input.lng === null) return delay({ ok: false, error: "LOCATION_REQUIRED" });
  if (distanceM(input.lat, input.lng, b.lat, b.lng) > REDEEM_RADIUS_M) return delay({ ok: false, error: "TOO_FAR" });
  if (redeemedToday(d.id)) return delay({ ok: false, error: "ALREADY_REDEEMED_TODAY" });
  return delay({ ok: true, redemption: record(d, "sticker") });
}

export async function redeemPin(input: { deal_id: string; business_id: string; pin: string }): Promise<RedeemResult> {
  const d = deals.find((x) => x.id === input.deal_id && x.business_id === input.business_id);
  if (!d || dealStatus(d.starts_at, d.ends_at) !== "live") return delay({ ok: false, error: "DEAL_NOT_LIVE" });
  if (businessById(d.business_id).staff_pin !== input.pin) return delay({ ok: false, error: "BAD_PIN" });
  if (redeemedToday(d.id)) return delay({ ok: false, error: "ALREADY_REDEEMED_TODAY" });
  return delay({ ok: true, redemption: record(d, "pin") });
}

const codes = new Map<string, { deal_id: string; expires: number }>();

export async function issueCode(input: { deal_id: string }): Promise<IssueCodeResult> {
  const d = deals.find((x) => x.id === input.deal_id);
  if (!d || dealStatus(d.starts_at, d.ends_at) !== "live") return delay({ ok: false, error: "DEAL_NOT_LIVE" });
  if (redeemedToday(d.id)) return delay({ ok: false, error: "ALREADY_REDEEMED_TODAY" });
  const token = `mock-${Math.random().toString(36).slice(2, 12)}`;
  const expires = Date.now() + CODE_TTL_MS;
  codes.set(token, { deal_id: d.id, expires });
  return delay({ ok: true, token, expires_at: new Date(expires).toISOString() });
}

export async function staffRedeem(input: { token: string }): Promise<StaffRedeemResult> {
  const code = codes.get(input.token);
  if (!code || code.expires < Date.now()) return delay({ ok: false, error: "CODE_EXPIRED" });
  const d = deals.find((x) => x.id === code.deal_id);
  if (!d) return delay({ ok: false, error: "CODE_EXPIRED" });
  if (d.business_id !== mockStaff.business_id) return delay({ ok: false, error: "NOT_STAFF" });
  if (dealStatus(d.starts_at, d.ends_at) !== "live") return delay({ ok: false, error: "DEAL_NOT_LIVE" });
  if (redeemedToday(d.id)) return delay({ ok: false, error: "ALREADY_REDEEMED_TODAY" });
  codes.delete(input.token); // single use
  return delay({ ok: true, redemption: record(d, "staff_scan"), deal_title: d.title });
}

export async function notifyDeal(input: { deal_id: string }): Promise<NotifyDealResult> {
  const d = deals.find((x) => x.id === input.deal_id);
  if (!d || dealStatus(d.starts_at, d.ends_at) !== "live") return delay({ ok: false, error: "DEAL_NOT_LIVE" });
  return delay({ ok: true, sent: 12 });
}
