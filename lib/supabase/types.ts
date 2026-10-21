// Shapes from docs/API_CONTRACT.md. Change both in the same PR, and update mocks/.

export type DealStatus = "scheduled" | "live" | "ended";
export type DiscountType = "amount_off" | "percent_off" | "free_item" | "bogo";
export type RedemptionMethod = "sticker" | "pin" | "staff_scan";
export type RedemptionMode = "sticker" | "staff_scan";

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
// Local campus time, "HH:MM". A close earlier than the open means past midnight.
export type Hours = Partial<Record<Weekday, [open: string, close: string][]>>;

// A deals row plus its computed status.
export type Deal = {
  id: string;
  business_id: string;
  title: string;
  description: string;
  discount_type: DiscountType;
  discount_value: number | null; // dollars for amount_off, percent for percent_off, null otherwise
  photo_url: string | null;
  starts_at: string; // ISO timestamp
  ends_at: string; // ISO timestamp
  students_only: boolean;
  status: DealStatus; // computed from starts_at/ends_at, never stored
  created_at: string;
};

// What students can see about a business. Never includes staff_pin or owner_id.
export type BusinessPublic = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  hours: Hours;
  logo_url: string | null;
  is_truck: boolean;
  open_now: boolean;
  redemption_mode: RedemptionMode;
};

export type DealDetail = Deal & {
  business: BusinessPublic;
  redeemed_today: boolean; // signed-in student already used it today
};

export type MyDeal = Deal & {
  redemption_count: number;
};

type NearbyBusiness = {
  business_id: string;
  business_name: string;
  logo_url: string | null;
  is_truck: boolean;
  lat: number;
  lng: number;
  distance_m: number;
  open_now: boolean;
};

// One row per live deal, plus one row per nearby business with no live deal.
export type DealCard =
  | (NearbyBusiness & {
      has_deal: true;
      deal_id: string;
      title: string;
      discount_type: DiscountType;
      discount_value: number | null;
      ends_at: string;
      students_only: boolean;
      photo_url: string | null;
    })
  | (NearbyBusiness & {
      has_deal: false;
      deal_id: null;
      title: null;
      discount_type: null;
      discount_value: null;
      ends_at: null;
      students_only: null;
      photo_url: null;
    });

export type Redemption = {
  id: string;
  deal_id: string;
  business_id: string;
  student_id: string;
  redeemed_at: string; // ISO timestamp
  redeemed_on: string; // local date, "YYYY-MM-DD"
  method: RedemptionMethod;
  deal_title: string;
  business_name: string;
};

export type BusinessStats = {
  perDeal: { deal_id: string; title: string; count: number }[];
  perHour: { hour: number; count: number }[]; // hour 0–23, local time
  total: number;
};

export type ErrorCode =
  | "NOT_SIGNED_IN"
  | "NOT_VERIFIED_STUDENT"
  | "DEAL_NOT_LIVE"
  | "WRONG_BUSINESS"
  | "TOO_FAR"
  | "LOCATION_REQUIRED"
  | "ALREADY_REDEEMED_TODAY"
  | "BAD_PIN"
  | "CODE_EXPIRED"
  | "NOT_STAFF"
  | "RATE_LIMITED";

export type Failure = { ok: false; error: ErrorCode };
export type RedeemResult = { ok: true; redemption: Redemption } | Failure;
export type IssueCodeResult = { ok: true; token: string; expires_at: string } | Failure;
export type StaffRedeemResult = { ok: true; redemption: Redemption; deal_title: string } | Failure;
export type NotifyDealResult = { ok: true; sent: number } | Failure;
