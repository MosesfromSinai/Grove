// Mock versions of every lib/supabase function in docs/API_CONTRACT.md.
// Same names, inputs, and return types, so swapping to the real ones is an import change.
// State lives in memory and resets on page reload.

import { campusClock, dealStatus, liveUntil, openNow } from "../lib/supabase/deal-status";
import { validateCreateDealInput } from "../lib/supabase/deal-input";
import { copyHours, validateBusinessInput } from "../lib/supabase/business-input";
import type {
  AddStaffResult,
  BusinessPublic,
  BusinessStats,
  BusinessProfile,
  BusinessLocationOption,
  SaveBusinessInput,
  SaveBusinessResult,
  ClaimClubNightResult,
  ClubNight,
  CreateDealInput,
  CreateDealResult,
  DealMutationInput,
  EndDealResult,
  CancelDealResult,
  OpenClubNight,
  Deal,
  DealCard,
  DealDetail,
  IssueCodeResult,
  MyDeal,
  NotifyDealResult,
  RedeemResult,
  Redemption,
  SetPinResult,
  StaffMember,
  StaffRedeemResult,
} from "../lib/supabase/types";
import {
  businessMembers,
  businesses,
  clubNights,
  deals,
  mockOwner,
  mockStaff,
  mockStudent,
  orangePeelStats,
  redemptions,
  type MockBusiness,
  type MockClubNight,
  type MockDeal,
  type MockRedemption,
} from "./data";

export { UCR_CENTER } from "./data";

const REDEEM_RADIUS_M = 150;
const CODE_TTL_MS = 30_000;
// Tracks whether the owner has generated a first PIN in this demo session.
// The PIN itself remains private and is returned only by setPin().
const initializedPins = new Set<string>();

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
  return { ...d, status: dealStatus(d) };
}

function toMyDeal(d: MockDeal): MyDeal {
  const historical = d.business_id === "biz-opt"
    ? orangePeelStats.last30.perDeal.find(([id]) => id === d.id)?.[1]
    : undefined;
  return {
    ...toDeal(d),
    redemption_count: historical ?? redemptions.filter(r => r.deal_id === d.id).length,
  };
}

function toBusinessPublic(b: MockBusiness): BusinessPublic {
  return {
    id: b.id,
    name: b.name,
    address: b.address,
    lat: b.lat,
    lng: b.lng,
    hours: b.hours,
    logo_url: b.logo_url,
    is_truck: b.is_truck,
    open_now: b.open_now,
    redemption_mode: b.redemption_mode,
  };
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
    const live = deals.filter((d) => d.business_id === b.id && d.visibility === "public" && dealStatus(d) === "live");
    for (const d of live) {
      rows.push({
        ...base,
        has_deal: true,
        deal_id: d.id,
        title: d.title,
        discount_type: d.discount_type,
        discount_value: d.discount_value,
        ends_at: d.ends_at,
        live_until: liveUntil(d) ?? "",
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
        live_until: null,
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
    .filter((d) => d.status === "live" && d.visibility === "public");
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
  const mine = deals
    .filter((d) => d.business_id === input.businessId)
    .map(toMyDeal)
    .sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  return delay(mine);
}

// ---------- Business writes ----------

function toBusinessProfile(business: MockBusiness): BusinessProfile {
  return { business: { ...toBusinessPublic(business), hours: copyHours(business.hours) }, pin_ready: initializedPins.has(business.id) };
}

export async function getMyBusiness(): Promise<BusinessProfile> {
  return delay(toBusinessProfile(businessById(mockOwner.business_id)));
}

// Mock-only address lookup. Arbitrary addresses require explicit coordinates;
// no guessed geocoding or live network service is used in Sprint 1.
export async function getBusinessLocationOptions(): Promise<BusinessLocationOption[]> {
  return delay(businesses.map(({ address, lat, lng }) => ({ address, lat, lng })));
}

export async function saveBusiness(input: SaveBusinessInput): Promise<SaveBusinessResult> {
  if (input.business_id !== mockOwner.business_id) return delay({ ok: false, error: "NOT_OWNER" });
  const result = validateBusinessInput(input);
  if (!result.ok) return delay({ ok: false, error: "INVALID_BUSINESS", fields: result.fields });
  const b = businessById(input.business_id);
  const value = result.value;
  Object.assign(b, {
    name: value.name, address: value.address, lat: value.lat, lng: value.lng,
    hours: value.hours, logo_url: value.logo_url, is_truck: value.is_truck,
    open_now: openNow(value.hours),
  });
  return delay({ ok: true, profile: toBusinessProfile(b) });
}

export async function createDeal(input: CreateDealInput): Promise<CreateDealResult> {
  if (input.business_id !== mockOwner.business_id) return delay({ ok: false, error: "NOT_OWNER" });
  const result = validateCreateDealInput(input);
  if (!result.ok) return delay({ ok: false, error: "INVALID_DEAL", fields: result.fields });
  const deal: MockDeal = {
    ...result.value,
    id: crypto.randomUUID(),
    active_days: null,
    daily_start: null,
    daily_end: null,
    visibility: "public",
    created_at: new Date().toISOString(),
  };
  deals.push(deal);
  return delay({ ok: true, deal: { ...toDeal(deal), redemption_count: 0 } });
}

// Re-check the current clock and store at mutation time, not the UI snapshot.
export async function endDeal(input: DealMutationInput): Promise<EndDealResult> {
  if (input.business_id !== mockOwner.business_id) return delay({ ok: false, error: "NOT_OWNER" });
  const deal = deals.find(d => d.id === input.deal_id && d.business_id === input.business_id);
  if (!deal) return delay({ ok: false, error: "DEAL_NOT_FOUND" });
  const now = new Date();
  const status = dealStatus(deal, now);
  const started = new Date(deal.starts_at).getTime() < now.getTime();
  if (!started || status === "ended" || (status !== "live" && !deal.active_days)) {
    return delay({ ok: false, error: "DEAL_NOT_LIVE" });
  }
  deal.ends_at = now.toISOString();
  return delay({ ok: true, deal: toMyDeal(deal) });
}

export async function cancelDeal(input: DealMutationInput): Promise<CancelDealResult> {
  if (input.business_id !== mockOwner.business_id) return delay({ ok: false, error: "NOT_OWNER" });
  const index = deals.findIndex(d => d.id === input.deal_id && d.business_id === input.business_id);
  if (index < 0) return delay({ ok: false, error: "DEAL_NOT_FOUND" });
  const deal = deals[index];
  if (dealStatus(deal) !== "scheduled") return delay({ ok: false, error: "DEAL_NOT_SCHEDULED" });
  if (toMyDeal(deal).redemption_count > 0 || redemptions.some(r => r.deal_id === deal.id)) {
    return delay({ ok: false, error: "DEAL_HAS_REDEMPTIONS" });
  }
  // Preserve the existing club_nights -> deals reference; no cascading cleanup.
  if (clubNights.some(night => night.deal_id === deal.id)) return delay({ ok: false, error: "DEAL_IN_USE" });
  deals.splice(index, 1);
  return delay({ ok: true, deal_id: deal.id });
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
  if (dealStatus(d) !== "live") return delay({ ok: false, error: "DEAL_NOT_LIVE" });
  if (input.lat === null || input.lng === null) return delay({ ok: false, error: "LOCATION_REQUIRED" });
  if (distanceM(input.lat, input.lng, b.lat, b.lng) > REDEEM_RADIUS_M) return delay({ ok: false, error: "TOO_FAR" });
  if (redeemedToday(d.id)) return delay({ ok: false, error: "ALREADY_REDEEMED_TODAY" });
  return delay({ ok: true, redemption: record(d, "sticker") });
}

export async function redeemPin(input: { deal_id: string; business_id: string; pin: string }): Promise<RedeemResult> {
  const d = deals.find((x) => x.id === input.deal_id && x.business_id === input.business_id);
  if (!d || dealStatus(d) !== "live") return delay({ ok: false, error: "DEAL_NOT_LIVE" });
  if (businessById(d.business_id).staff_pin !== input.pin) return delay({ ok: false, error: "BAD_PIN" });
  if (redeemedToday(d.id)) return delay({ ok: false, error: "ALREADY_REDEEMED_TODAY" });
  return delay({ ok: true, redemption: record(d, "pin") });
}

const codes = new Map<string, { deal_id: string; expires: number }>();

export async function issueCode(input: { deal_id: string }): Promise<IssueCodeResult> {
  const d = deals.find((x) => x.id === input.deal_id);
  if (!d || dealStatus(d) !== "live") return delay({ ok: false, error: "DEAL_NOT_LIVE" });
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
  if (dealStatus(d) !== "live") return delay({ ok: false, error: "DEAL_NOT_LIVE" });
  if (redeemedToday(d.id)) return delay({ ok: false, error: "ALREADY_REDEEMED_TODAY" });
  codes.delete(input.token); // single use
  return delay({ ok: true, redemption: record(d, "staff_scan"), deal_title: d.title });
}

export async function notifyDeal(input: { deal_id: string }): Promise<NotifyDealResult> {
  const d = deals.find((x) => x.id === input.deal_id);
  if (!d || dealStatus(d) !== "live") return delay({ ok: false, error: "DEAL_NOT_LIVE" });
  return delay({ ok: true, sent: 12 });
}

// ---------- Club nights ----------

function clubNightStatus(c: MockClubNight): ClubNight["status"] {
  if (c.claimed_club_name) return "claimed";
  return Date.now() >= new Date(c.ends_at).getTime() ? "expired" : "open";
}

function toOpenClubNight(c: MockClubNight): OpenClubNight {
  return {
    id: c.id,
    business_id: c.business_id,
    business_name: businessById(c.business_id).name,
    night_date: c.night_date,
    start_time: c.start_time,
    end_time: c.end_time,
    giveback: c.giveback,
  };
}

function toClubNight(c: MockClubNight): ClubNight {
  return {
    ...toOpenClubNight(c),
    status: clubNightStatus(c),
    claimed_club_name: c.claimed_club_name,
    claimed_at: c.claimed_at,
    deal_id: c.deal_id,
    visit_count: c.deal_id ? redemptions.filter((r) => r.deal_id === c.deal_id).length : 0,
  };
}

// Open club nights students can claim, soonest first.
export async function getOpenClubNights(): Promise<OpenClubNight[]> {
  const open = clubNights
    .filter((c) => clubNightStatus(c) === "open")
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  return delay(open.map(toOpenClubNight));
}

// A business's club nights with verified visits, newest first.
export async function getClubNights(input: { businessId: string }): Promise<ClubNight[]> {
  const mine = clubNights
    .filter((c) => c.business_id === input.businessId)
    .sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  return delay(mine.map(toClubNight));
}

export async function claimClubNight(input: { club_night_id: string; club_name: string }): Promise<ClaimClubNightResult> {
  const c = clubNights.find((x) => x.id === input.club_night_id);
  if (!c || clubNightStatus(c) === "expired") return delay({ ok: false, error: "CLUB_NIGHT_EXPIRED" });
  if (c.claimed_club_name) return delay({ ok: false, error: "ALREADY_CLAIMED" });
  const club = input.club_name.trim();
  const deal_id = `deal-${c.id}-${Date.now()}`;
  deals.push({
    id: deal_id,
    business_id: c.business_id,
    title: `${club} night`,
    description: `${c.giveback} (to ${club}).`,
    discount_type: null,
    discount_value: null,
    photo_url: null,
    starts_at: c.starts_at,
    ends_at: c.ends_at,
    active_days: null,
    daily_start: null,
    daily_end: null,
    visibility: "link_only",
    students_only: true,
    created_at: new Date().toISOString(),
  });
  Object.assign(c, { claimed_club_name: club, claimed_by: mockStudent.id, claimed_at: new Date().toISOString(), deal_id });
  return delay({ ok: true, club_night: toClubNight(c), deal_id });
}

// ---------- Business settings (owner only) ----------

function toStaffMember(m: (typeof businessMembers)[number]): StaffMember {
  return { ...m, status: m.user_id ? "active" : "invited" };
}

// Sets a new random 4-digit PIN and returns it once. The real function stores only the hash.
export async function setPin(input: { business_id: string }): Promise<SetPinResult> {
  if (input.business_id !== mockOwner.business_id) return delay({ ok: false, error: "NOT_OWNER" });
  const pin = String(Math.floor(Math.random() * 10_000)).padStart(4, "0");
  businessById(input.business_id).staff_pin = pin;
  initializedPins.add(input.business_id);
  return delay({ ok: true, pin });
}

// Adds a staff member by Google email; they become active on their first sign-in.
export async function addStaff(input: { business_id: string; email: string }): Promise<AddStaffResult> {
  if (input.business_id !== mockOwner.business_id) return delay({ ok: false, error: "NOT_OWNER" });
  const email = input.email.trim().toLowerCase();
  let m = businessMembers.find((x) => x.business_id === input.business_id && x.email === email);
  if (!m) {
    m = { business_id: input.business_id, user_id: null, email, role: "staff" };
    businessMembers.push(m);
  }
  return delay({ ok: true, member: toStaffMember(m) });
}

export async function getStaff(input: { businessId: string }): Promise<StaffMember[]> {
  return delay(businessMembers.filter((m) => m.business_id === input.businessId).map(toStaffMember));
}

// Campus date and time right now, handy for showing "today" on club night screens.
export const campusNow = () => campusClock(new Date());
