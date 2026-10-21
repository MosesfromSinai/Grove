// Invented sample data, matching the design canvas. Times are relative to page load
// so countdowns and live/scheduled/ended states always look right.

import type { DiscountType, Hours, RedemptionMethod, RedemptionMode } from "../lib/supabase/types";

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const now = Date.now();
const at = (offsetMs: number) => new Date(now + offsetMs).toISOString();

const everyDay = (open: string, close: string): Hours => ({
  mon: [[open, close]],
  tue: [[open, close]],
  wed: [[open, close]],
  thu: [[open, close]],
  fri: [[open, close]],
  sat: [[open, close]],
  sun: [[open, close]],
});

export const UCR_CENTER = { lat: 33.9737, lng: -117.3281 };

export const campuses = [
  { id: "campus-ucr", name: "UC Riverside", email_domain: "ucr.edu", ...UCR_CENTER },
];

export type MockBusiness = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  hours: Hours;
  logo_url: string | null;
  is_truck: boolean;
  open_now: boolean; // fixed in mocks so screens are predictable; computed from hours for real
  redemption_mode: RedemptionMode;
  qr_slug: string;
  staff_pin: string; // plain text in mocks only; hashed in the database
};

export const businesses: MockBusiness[] = [
  { id: "biz-opt", name: "Orange Peel Tacos", address: "Iowa Ave & University Ave", lat: 33.9762, lng: -117.3254, hours: everyDay("11:00", "21:00"), logo_url: null, is_truck: true, open_now: true, redemption_mode: "sticker", qr_slug: "orange-peel-tacos", staff_pin: "1234" },
  { id: "biz-saf", name: "Saffron Street Halal", address: "Canyon Crest Dr & Blaine St", lat: 33.9768, lng: -117.3318, hours: everyDay("11:00", "20:00"), logo_url: null, is_truck: true, open_now: true, redemption_mode: "sticker", qr_slug: "saffron-street-halal", staff_pin: "1234" },
  { id: "biz-owl", name: "Night Owl Noodles", address: "University Ave & Chicago Ave", lat: 33.9770, lng: -117.3210, hours: everyDay("11:00", "01:00"), logo_url: null, is_truck: false, open_now: true, redemption_mode: "staff_scan", qr_slug: "night-owl-noodles", staff_pin: "1234" },
  { id: "biz-pep", name: "Pepper Tree Pizza Co.", address: "University Ave & Park Ave", lat: 33.9810, lng: -117.3360, hours: everyDay("11:00", "23:00"), logo_url: null, is_truck: false, open_now: true, redemption_mode: "sticker", qr_slug: "pepper-tree-pizza", staff_pin: "1234" },
  { id: "biz-bob", name: "Boba Bungalow", address: "Canyon Crest Dr & Central Ave", lat: 33.9640, lng: -117.3380, hours: everyDay("11:00", "22:00"), logo_url: null, is_truck: false, open_now: true, redemption_mode: "sticker", qr_slug: "boba-bungalow", staff_pin: "1234" },
  { id: "biz-ver", name: "Verde Bowl", address: "Blaine St & Iowa Ave", lat: 33.9680, lng: -117.3220, hours: everyDay("10:00", "20:00"), logo_url: null, is_truck: false, open_now: true, redemption_mode: "sticker", qr_slug: "verde-bowl", staff_pin: "1234" },
  { id: "biz-tia", name: "Tía Rosa’s Tamales", address: "Linden St & Canyon Crest Dr", lat: 33.9775, lng: -117.3300, hours: everyDay("08:00", "19:00"), logo_url: null, is_truck: true, open_now: true, redemption_mode: "sticker", qr_slug: "tia-rosas-tamales", staff_pin: "1234" },
  { id: "biz-bun", name: "Big Bun Burgers", address: "Iowa Ave & Martin Luther King Blvd", lat: 33.9700, lng: -117.3360, hours: everyDay("17:00", "23:00"), logo_url: null, is_truck: false, open_now: false, redemption_mode: "sticker", qr_slug: "big-bun-burgers", staff_pin: "1234" },
];

export type MockDeal = {
  id: string;
  business_id: string;
  title: string;
  description: string;
  discount_type: DiscountType;
  discount_value: number | null;
  photo_url: string | null;
  starts_at: string;
  ends_at: string;
  students_only: boolean;
  created_at: string;
};

const deal = (d: Omit<MockDeal, "photo_url" | "created_at"> & { photo_url?: string | null }): MockDeal => ({
  photo_url: null,
  created_at: at(new Date(d.starts_at).getTime() - now - DAY),
  ...d,
});

export const deals: MockDeal[] = [
  // Live now
  deal({ id: "deal-opt-burrito", business_id: "biz-opt", title: "$2 off any burrito", description: "Any burrito on the menu, $2 off. One per student per day.", discount_type: "amount_off", discount_value: 2, starts_at: at(-2 * HOUR), ends_at: at(139 * MIN), students_only: true }),
  deal({ id: "deal-opt-horchata", business_id: "biz-opt", title: "Free horchata with any combo", description: "Any combo plate comes with a free horchata, Monday to Thursday.", discount_type: "free_item", discount_value: null, starts_at: at(-6 * DAY), ends_at: at(9 * DAY), students_only: false }),
  deal({ id: "deal-saf-drink", business_id: "biz-saf", title: "Free drink with any platter", description: "Pick any canned drink with a platter.", discount_type: "free_item", discount_value: null, starts_at: at(-2 * HOUR), ends_at: at(139 * MIN), students_only: true }),
  deal({ id: "deal-owl-gyoza", business_id: "biz-owl", title: "Half-off gyoza with any ramen", description: "Order any ramen and get a side of gyoza at half price.", discount_type: "percent_off", discount_value: 50, starts_at: at(-3 * HOUR), ends_at: at(80 * MIN), students_only: false }),
  deal({ id: "deal-pep-slice", business_id: "biz-pep", title: "$5 slice + drink", description: "Any slice plus a fountain drink for $5.", discount_type: "amount_off", discount_value: 3, starts_at: at(-1 * HOUR), ends_at: at(200 * MIN), students_only: false }),
  deal({ id: "deal-bob-milktea", business_id: "biz-bob", title: "Buy one milk tea, 2nd half off", description: "Second milk tea of equal or lesser price is half off.", discount_type: "percent_off", discount_value: 50, starts_at: at(-1 * HOUR), ends_at: at(260 * MIN), students_only: true }),
  // Scheduled
  deal({ id: "deal-opt-latenight", business_id: "biz-opt", title: "Late-night BOGO tacos", description: "Buy one taco, get one free, 8 to 11 PM.", discount_type: "bogo", discount_value: null, starts_at: at(3 * DAY), ends_at: at(3 * DAY + 3 * HOUR), students_only: true }),
  // Ended
  deal({ id: "deal-opt-pastor", business_id: "biz-opt", title: "BOGO al pastor tacos", description: "Buy one al pastor taco, get one free.", discount_type: "bogo", discount_value: null, starts_at: at(-4 * DAY - 3 * HOUR), ends_at: at(-4 * DAY), students_only: true }),
  deal({ id: "deal-opt-quesadilla", business_id: "biz-opt", title: "$1 off quesadillas", description: "$1 off any quesadilla.", discount_type: "amount_off", discount_value: 1, starts_at: at(-8 * DAY), ends_at: at(-6 * DAY), students_only: false }),
  deal({ id: "deal-opt-chips", business_id: "biz-opt", title: "Free chips and salsa", description: "Free chips and salsa with any order.", discount_type: "free_item", discount_value: null, starts_at: at(-14 * DAY - 4 * HOUR), ends_at: at(-14 * DAY), students_only: false }),
  deal({ id: "deal-owl-gyoza-old", business_id: "biz-owl", title: "Half-off gyoza with ramen", description: "Half-off gyoza with any ramen.", discount_type: "percent_off", discount_value: 50, starts_at: at(-4 * DAY - 4 * HOUR), ends_at: at(-4 * DAY), students_only: false }),
  deal({ id: "deal-bob-milktea-old", business_id: "biz-bob", title: "Milk tea, 2nd half off", description: "Second milk tea half off.", discount_type: "percent_off", discount_value: 50, starts_at: at(-6 * DAY - 4 * HOUR), ends_at: at(-6 * DAY), students_only: true }),
  deal({ id: "deal-saf-drink-old", business_id: "biz-saf", title: "Free drink with platter", description: "Free canned drink with any platter.", discount_type: "free_item", discount_value: null, starts_at: at(-11 * DAY - 4 * HOUR), ends_at: at(-11 * DAY), students_only: true }),
  deal({ id: "deal-pep-slice-old", business_id: "biz-pep", title: "$5 slice + drink", description: "Any slice plus a fountain drink for $5.", discount_type: "amount_off", discount_value: 3, starts_at: at(-14 * DAY - 4 * HOUR), ends_at: at(-14 * DAY), students_only: false }),
];

// The signed-in student in every mock call.
export const mockStudent = {
  id: "student-jordan",
  full_name: "Jordan Reyes",
  email: "jordan.r@ucr.edu",
  campus_id: "campus-ucr",
  verified_student: true,
};

// The signed-in staff account for staff-scan mocks: staff at Orange Peel Tacos.
export const mockStaff = { id: "staff-marisol", business_id: "biz-opt" };

export type MockRedemption = {
  id: string;
  deal_id: string;
  business_id: string;
  student_id: string;
  redeemed_at: string;
  method: RedemptionMethod;
};

export const redemptions: MockRedemption[] = [
  { id: "red-1", deal_id: "deal-opt-burrito", business_id: "biz-opt", student_id: mockStudent.id, redeemed_at: at(-40 * MIN), method: "sticker" },
  { id: "red-2", deal_id: "deal-owl-gyoza-old", business_id: "biz-owl", student_id: mockStudent.id, redeemed_at: at(-4 * DAY - 2 * HOUR), method: "staff_scan" },
  { id: "red-3", deal_id: "deal-bob-milktea-old", business_id: "biz-bob", student_id: mockStudent.id, redeemed_at: at(-6 * DAY - 2 * HOUR), method: "sticker" },
  { id: "red-4", deal_id: "deal-saf-drink-old", business_id: "biz-saf", student_id: mockStudent.id, redeemed_at: at(-11 * DAY - 2 * HOUR), method: "pin" },
  { id: "red-5", deal_id: "deal-pep-slice-old", business_id: "biz-pep", student_id: mockStudent.id, redeemed_at: at(-14 * DAY - 2 * HOUR), method: "sticker" },
];

// Canned dashboard numbers for Orange Peel Tacos, matching the Stats and My deals screens.
export const orangePeelStats = {
  last7: {
    perDeal: [["deal-opt-burrito", 86], ["deal-opt-horchata", 64], ["deal-opt-pastor", 41], ["deal-opt-quesadilla", 9]] as const,
    perHour: [[11, 12], [12, 38], [13, 34], [14, 19], [15, 8], [16, 6], [17, 14], [18, 22], [19, 25], [20, 18]] as const,
  },
  last30: {
    perDeal: [["deal-opt-burrito", 86], ["deal-opt-horchata", 64], ["deal-opt-pastor", 41], ["deal-opt-quesadilla", 29], ["deal-opt-chips", 18]] as const,
    perHour: [[11, 15], [12, 46], [13, 41], [14, 22], [15, 9], [16, 7], [17, 17], [18, 26], [19, 30], [20, 21]] as const,
  },
};
