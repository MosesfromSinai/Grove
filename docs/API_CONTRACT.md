# API Contract

The shapes everyone builds against. Frontend work uses `mocks/` that match this file exactly, then swaps in real queries once the tables and functions exist.

**Owner:** Moses. **Status:** DRAFT. Moses finalizes by day 3 of week 1 (Oct 21) so mocks can match it.
**Rule:** any change here goes in a pull request reviewed by the people it affects, plus a line in `docs/LOG.md`.
**Code copies:** the TypeScript types below live in `lib/supabase/types.ts`; `mocks/index.ts` exports every query and function below with the same name, input, and return type. Change all three together.

_Last updated: 2026-10-20_

---

## Tables

### `campuses`
| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| name | text | "UC Riverside" |
| email_domain | text | "ucr.edu" |
| center | geography(Point) | Default map center |

### `profiles`
One row per signed-in user. Created on first sign-in.
| Column | Type | Notes |
|---|---|---|
| id | uuid | Same as `auth.users.id` |
| role | text | `student` or `business` |
| full_name | text | |
| email | text | |
| campus_id | uuid → campuses | Students only |
| verified_student | boolean | True after the .edu check passes |
| created_at | timestamptz | |

### `businesses`
| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| owner_id | uuid → profiles | |
| name | text | |
| campus_id | uuid → campuses | |
| location | geography(Point) | Food trucks update this daily |
| address | text | |
| hours | jsonb | `{ "mon": [["11:00","22:00"]], ... }` |
| logo_url | text | Supabase Storage |
| qr_slug | text, unique | Permanent sticker link: `/b/<qr_slug>` |
| staff_pin | text | 4 digits, stored hashed |
| redemption_mode | text | `sticker` (default) or `staff_scan` |
| is_truck | boolean | |

### `business_members`
Links owner and staff accounts to a business. Needed for staff-scan mode and for RLS on business data.
| Column | Type | Notes |
|---|---|---|
| business_id | uuid → businesses | |
| user_id | uuid → profiles | |
| role | text | `owner` or `staff` |

### `deals`
| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| business_id | uuid → businesses | |
| title | text | "$2 off any burrito" |
| description | text | |
| photo_url | text | Optional |
| starts_at | timestamptz | |
| ends_at | timestamptz | |
| discount_type | text | `amount_off`, `percent_off`, `free_item`, `bogo` (the four choices on the Post a deal form) |
| discount_value | numeric | Dollars for `amount_off`, percent for `percent_off`, null for `free_item` and `bogo` |
| students_only | boolean | Default true |
| created_at | timestamptz | |

**Status is computed, not stored:** `scheduled` before `starts_at`, `live` while `starts_at <= now() < ends_at`, `ended` from `ends_at` on. SQL uses a `deal_status(starts_at, ends_at)` function; TypeScript uses `dealStatus()` in `lib/supabase/deal-status.ts`. RLS policies and `redeem` check the time window directly.
- **End now** sets `ends_at = now()`. **Cancel** on a scheduled deal deletes it (it can't have redemptions yet).
- Check constraint: `ends_at > starts_at`.

### `redemptions`
The billing record: one row per verified visit.
| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| deal_id | uuid → deals | |
| business_id | uuid → businesses | |
| student_id | uuid → profiles | |
| redeemed_at | timestamptz | |
| redeemed_on | date | Local date, for the daily limit |
| method | text | `sticker`, `pin`, `staff_scan` |
| student_location | geography(Point) | Null for `pin` and `staff_scan` |

**Unique rule:** `(student_id, deal_id, redeemed_on)`

### `push_subscriptions`
| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| user_id | uuid → profiles | |
| endpoint | text, unique | |
| keys | jsonb | `p256dh`, `auth` |
| created_at | timestamptz | |

---

## Queries (in `lib/supabase/`)

Moses owns `lib/supabase/` and writes the wrappers; the owner listed writes the SQL behind it.

| Function | Input | Returns | Used by |
|---|---|---|---|
| `getDealsNearby` | `{ lat, lng, radiusM, openNow?, hasDeals? }` | `DealCard[]`: one row per live deal, plus one row (`has_deal: false`) per business with no live deal; `hasDeals: true` drops those. Sorted by distance. Calls Hikaru's `deals_nearby` SQL function | Edward (feed, `hasDeals: true`), Hikaru (map: group by `business_id`; orange pin if any row has a deal, green otherwise) |
| `getDeal` | `{ id }` | `DealDetail \| null` | Edward |
| `getBusinessBySlug` | `{ slug }` | `{ business: BusinessPublic, liveDeals: Deal[] } \| null` | Edward (sticker landing) |
| `getMyRedemptions` | none | `Redemption[]`, newest first | Edward |
| `getBusinessStats` | `{ businessId, from, to }` | `BusinessStats` | Adolfo |
| `getMyDeals` | `{ businessId }` | `MyDeal[]`, newest start first | Adolfo |

```ts
type DealStatus = "scheduled" | "live" | "ended";
type DiscountType = "amount_off" | "percent_off" | "free_item" | "bogo";
type RedemptionMethod = "sticker" | "pin" | "staff_scan";
type RedemptionMode = "sticker" | "staff_scan";
type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
type Hours = Partial<Record<Weekday, [open: string, close: string][]>>; // local "HH:MM"; close < open means past midnight

type Deal = {
  id: string;
  business_id: string;
  title: string;
  description: string;
  discount_type: DiscountType;
  discount_value: number | null;
  photo_url: string | null;
  starts_at: string;    // ISO timestamp
  ends_at: string;      // ISO timestamp
  students_only: boolean;
  status: DealStatus;   // computed
  created_at: string;
};

// What students can see about a business: never staff_pin, owner_id, or qr_slug.
type BusinessPublic = {
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

type DealDetail = Deal & {
  business: BusinessPublic;
  redeemed_today: boolean;  // signed-in student already used it today (show "Already used")
};

type MyDeal = Deal & { redemption_count: number };

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

type DealCard =
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
      deal_id: null; title: null; discount_type: null; discount_value: null;
      ends_at: null; students_only: null; photo_url: null;
    });

// student_location stays in the table; it's never sent to the browser.
type Redemption = {
  id: string;
  deal_id: string;
  business_id: string;
  student_id: string;
  redeemed_at: string;  // ISO timestamp
  redeemed_on: string;  // local date, "YYYY-MM-DD"
  method: RedemptionMethod;
  deal_title: string;
  business_name: string;
};

type BusinessStats = {
  perDeal: { deal_id: string; title: string; count: number }[];
  perHour: { hour: number; count: number }[];  // hour 0–23, local time
  total: number;
};
```

---

## Edge Functions

All return either `{ ok: true, ... }` or `{ ok: false, error: ErrorCode }`. `lib/supabase/` wraps each one; the wrapper name is in the first column.

| Function (wrapper) | Input | Success returns | Owner |
|---|---|---|---|
| `redeem` (sticker) — `redeem()` | `{ deal_id, qr_slug, lat, lng }` (`lat`/`lng` null if location is denied) | `{ redemption: Redemption }` | Moses |
| `redeem-pin` — `redeemPin()` | `{ deal_id, business_id, pin }` | `{ redemption: Redemption }` | Moses |
| `issue-code` (staff mode) — `issueCode()` | `{ deal_id }` | `{ token, expires_at }` | Moses |
| `staff-redeem` — `staffRedeem()` | `{ token }` | `{ redemption: Redemption, deal_title }` | Moses |
| `notify-deal` — `notifyDeal()` | `{ deal_id }`, called when a deal goes live | `{ sent: number }` | Hikaru |

`redeem` checks in this order: `WRONG_BUSINESS`, `DEAL_NOT_LIVE`, `LOCATION_REQUIRED`, `TOO_FAR` (over 150 m), `ALREADY_REDEEMED_TODAY`.

```ts
type ErrorCode =
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
```

Every error code needs a friendly message in the UI (Edward and Adolfo).

---

## Mocks

`mocks/index.ts` runs the same checks as the real functions on in-memory data (resets on reload). Sample data matches the design canvas: eight businesses near UCR (five with live deals, three without), Orange Peel Tacos' full deal history and stats, and Jordan Reyes as the signed-in student.
- Jordan already redeemed "$2 off any burrito" today, so redeeming it returns `ALREADY_REDEEMED_TODAY` (screen 8b). Other live deals succeed.
- Use `MOCK_POSITIONS.atOrangePeelTacos` as the location to pass the 150 m check; your real location will return `TOO_FAR`.
- Every mock PIN is `1234`. The mock staff account works at Orange Peel Tacos, so `staffRedeem()` on any other business's code returns `NOT_STAFF`.

---

## Open questions
- Staff-scan tokens: signed tokens with no table, or a short-lived `redemption_codes` table? (Moses + Celso)
- PIN attempts: how many tries before lockout? (Celso)
- Push targeting: everyone at the campus, or only students within X km of the business? (Hikaru)
