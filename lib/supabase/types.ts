// Shapes from docs/API_CONTRACT.md. Change both in the same PR, and update mocks/.

export type DealStatus = "scheduled" | "live" | "ended";
export type DiscountType = "amount_off" | "percent_off" | "free_item" | "bogo";
export type RedemptionMethod = "sticker" | "pin" | "staff_scan";
export type RedemptionMode = "sticker" | "staff_scan";
export type DealVisibility = "public" | "link_only"; // link_only: hidden from feed, map, and sticker page
export type ClubNightStatus = "open" | "claimed" | "expired";
export type MemberRole = "owner" | "staff";

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
// Local campus time, "HH:MM". A close earlier than the open means past midnight.
export type Hours = Partial<Record<Weekday, [open: string, close: string][]>>;

// A deals row plus its computed status.
export type Deal = {
  id: string;
  business_id: string;
  title: string;
  description: string;
  discount_type: DiscountType | null; // null: no student discount (club night deals)
  discount_value: number | null; // dollars for amount_off, percent for percent_off, null otherwise
  photo_url: string | null;
  starts_at: string; // ISO timestamp
  ends_at: string | null; // ISO timestamp; null only for repeating deals that run until turned off
  active_days: Weekday[] | null; // null: one window from starts_at to ends_at; set: repeats on these days
  daily_start: string | null; // "HH:MM" campus time, set with active_days
  daily_end: string | null; // "HH:MM" campus time, later than daily_start
  visibility: DealVisibility;
  students_only: boolean;
  status: DealStatus; // computed (see deal-status.ts), never stored
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

// Sprint 1 posting supports a single public time window. Repeat days come later.
export type CreateDealInput = Pick<Deal,
  "business_id" | "title" | "description" | "photo_url" | "starts_at" | "students_only"
> & {
  ends_at: string;
  discount_type: DiscountType;
  discount_value: number | null;
};

export type CreateDealErrors = Partial<Record<keyof CreateDealInput, string>>;
export type CreateDealResult =
  | { ok: true; deal: MyDeal }
  | { ok: false; error: "NOT_OWNER" }
  | { ok: false; error: "INVALID_DEAL"; fields: CreateDealErrors };

export type DealMutationInput = { business_id: string; deal_id: string };
export type DealMutationError =
  | "NOT_OWNER"
  | "DEAL_NOT_FOUND"
  | "DEAL_NOT_LIVE"
  | "DEAL_NOT_SCHEDULED"
  | "DEAL_HAS_REDEMPTIONS"
  | "DEAL_IN_USE";
export type EndDealResult = { ok: true; deal: MyDeal } | { ok: false; error: DealMutationError };
export type CancelDealResult = { ok: true; deal_id: string } | { ok: false; error: DealMutationError };

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
      discount_type: DiscountType | null;
      discount_value: number | null;
      ends_at: string | null;
      live_until: string; // when the current live window ends (use for countdowns)
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
      live_until: null;
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

// What a student sees when choosing a club night to claim.
export type OpenClubNight = {
  id: string;
  business_id: string;
  business_name: string;
  night_date: string; // "YYYY-MM-DD", campus time
  start_time: string; // "HH:MM"
  end_time: string; // "HH:MM"
  giveback: string; // e.g. "15% back to your club"; paid outside the app
};

// What the business sees on its dashboard.
export type ClubNight = OpenClubNight & {
  status: ClubNightStatus; // computed, never stored
  claimed_club_name: string | null;
  claimed_at: string | null;
  deal_id: string | null; // the link-only deal created on claim
  visit_count: number; // verified redemptions of deal_id
};

// A business_members row as the owner sees it in settings.
export type StaffMember = {
  business_id: string;
  email: string;
  user_id: string | null; // null until that email signs in for the first time
  role: MemberRole;
  status: "active" | "invited"; // computed: invited while user_id is null
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
  | "RATE_LIMITED"
  | "ALREADY_CLAIMED"
  | "CLUB_NIGHT_EXPIRED"
  | "NOT_OWNER";

export type Failure = { ok: false; error: ErrorCode };
export type RedeemResult = { ok: true; redemption: Redemption } | Failure;
export type IssueCodeResult = { ok: true; token: string; expires_at: string } | Failure;
export type StaffRedeemResult = { ok: true; redemption: Redemption; deal_title: string } | Failure;
export type ClaimClubNightResult = { ok: true; club_night: ClubNight; deal_id: string } | Failure;
export type SetPinResult = { ok: true; pin: string } | Failure; // the only time the PIN is ever returned
export type AddStaffResult = { ok: true; member: StaffMember } | Failure;
export type NotifyDealResult = { ok: true; sent: number } | Failure;
