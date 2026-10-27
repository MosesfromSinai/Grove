# API Contract

The shapes everyone builds against. Frontend work uses `mocks/` that match this file exactly, then swaps in real queries once the tables and functions exist.

**Owner:** Moses. **Status:** Existing table/query contract is final (2026-10-24), including repeat days, link-only deals, and club nights. The Sprint 1 business-write additions below are proposals pending Moses's review. Later changes still follow the rule below.
**Rule:** any change here goes in a pull request reviewed by the people it affects, plus a line in `docs/LOG.md`.
**Code copies:** the TypeScript types below live in `lib/supabase/types.ts`; `mocks/index.ts` exports every query and function below with the same name, input, and return type. Change all three together. Screens import from `lib/supabase` (`index.ts`), which serves `mocks/` or the real wrappers in `queries.ts` depending on `NEXT_PUBLIC_DATA_SOURCE`; a compile-time check keeps their signatures identical.

_Last updated: 2026-10-26_

---

## Tables

### `campuses`
| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| name | text | "UC Riverside" |
| email_domain | text | "ucr.edu" |
| timezone | text | "America/Los_Angeles". Repeat-day windows and club night times use it |
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
| lat, lng | double precision | Generated from `location`; read-only. API reads use these instead of the PostGIS value |
| address | text | |
| hours | jsonb | `{ "mon": [["11:00","22:00"]], ... }` |
| logo_url | text | Supabase Storage |
| qr_slug | text, unique | Permanent sticker link: `/b/<qr_slug>`. Set by the database on insert (from the name, plus a short suffix if taken); never edited |
| staff_pin | text | 4 digits, stored hashed. Set only by `set-pin`; never returned by any query |
| redemption_mode | text | `sticker` (default) or `staff_scan` |
| is_truck | boolean | |

### `business_members`
Links owner and staff accounts to a business. Needed for staff-scan mode and for RLS on business data.
| Column | Type | Notes |
|---|---|---|
| business_id | uuid → businesses | |
| user_id | uuid → profiles | Null while invited; filled when that email signs in for the first time |
| email | text | Google email the owner added (lowercase) |
| role | text | `owner` or `staff` |

The owner's row is created with the business. Staff rows come from `add-staff`. Owners remove staff by deleting the row (RLS: owners of that business only).

### `deals`
| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| business_id | uuid → businesses | |
| title | text | "$2 off any burrito" |
| description | text | |
| photo_url | text | Optional |
| starts_at | timestamptz | |
| ends_at | timestamptz | Null only for a repeating deal that runs until the owner turns it off |
| active_days | text[] | Optional. Days it repeats: subset of `mon`…`sun`. Null = one window from `starts_at` to `ends_at` |
| daily_start | time | Set with `active_days`: start of each day's window, campus time ("14:00") |
| daily_end | time | Set with `active_days`: end of each day's window ("17:00"); later than `daily_start` |
| visibility | text | `public` (default: feed, map, sticker page) or `link_only` (opens only from its link) |
| discount_type | text | `amount_off`, `percent_off`, `free_item`, `bogo` (the four choices on the Post a deal form). Null = no student discount (club night deals) |
| discount_value | numeric | Dollars for `amount_off`, percent for `percent_off`, null for `free_item` and `bogo` |
| students_only | boolean | Default true |
| created_at | timestamptz | |

**Status is computed, not stored:** `scheduled` before `starts_at`, `ended` from `ends_at` on. In between:
- **One-time deal** (`active_days` null): `live`.
- **Repeating deal:** `live` only when today (campus time) is in `active_days` and the time is in `[daily_start, daily_end)`; `scheduled` otherwise. Example: Mon–Wed 2–5 PM is live Monday at 3 PM and `scheduled` Monday at 6 PM or Thursday.

SQL uses one `deal_status(d deals, at_time timestamptz default now())` function returning `scheduled`, `live`, or `ended`; TypeScript uses `dealStatus()` in `lib/supabase/deal-status.ts`. `redeem`, `redeem-pin`, `issue-code`, `staff-redeem`, `deals_nearby`, and RLS all use the same rule.
- **End now** (or turning off a repeating deal) sets `ends_at = now()`. **Cancel** on a scheduled deal with no redemptions deletes it.
- Check constraints: `ends_at > starts_at` when set; `ends_at` null only if `active_days` is set; `active_days`, `daily_start`, `daily_end` all set or all null; `daily_end > daily_start`.
- **Deal link:** every deal opens at `/deals/<id>`, and Adolfo's dashboard offers it as a link and a QR for flyers and group chats. It's advertising only: it opens the deal in Grove and never redeems. Link-only deals rely on the id being unguessable (uuid).
- **Who reads link-only deals:** RLS lets students select only `public` deals from the table, so link-only deals can't be listed. `getDeal` calls a `deal_by_id(id)` SQL function (security definer) that returns the `deals` row of either visibility by id (no rows if it doesn't exist); that's how a link opens.
- **Writes:** businesses insert and update their own deals directly (RLS: members of that business). Status and visibility rules above still apply.

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

### `club_nights`
A restaurant posts an open night; one student claims it for a club by typing the club name (no club accounts).
| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| business_id | uuid → businesses | |
| night_date | date | Campus date |
| start_time | time | Campus time |
| end_time | time | Later than `start_time` |
| giveback | text | Free text, e.g. "15% back to your club" or "$1 per student". Paid outside the app |
| claimed_club_name | text | Null until claimed; trimmed (the claim screen requires a name) |
| claimed_by | uuid → profiles | Student who claimed it; never sent to the browser |
| claimed_at | timestamptz | |
| deal_id | uuid → deals | The link-only deal created on claim |
| created_at | timestamptz | |

**Status is computed:** `claimed` if `claimed_club_name` is set; otherwise `expired` from the night's end time on, else `open`. Claims are allowed the same day, up to the end time.
- Businesses insert and edit their own club nights directly (RLS: members of that business). Only `claim-club-night` sets the claim columns.
- On claim, a deal is created: same business, `starts_at`/`ends_at` = the night's window, `visibility = 'link_only'`, `students_only = true`, no discount, title "<club> night", giveback in the description.

### `push_subscriptions`
Stretch goal (possible future implementation); not built for the MVP.
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

`getDealsNearby` calls `deals_nearby(lat float8, lng float8, radius_m int, open_now boolean default false, has_deals boolean default false)`, which returns `DealCard` rows (columns named exactly as the type, `live_until` from the current window). Hikaru writes it (#88).

| Function | Input | Returns | Used by |
|---|---|---|---|
| `getDealsNearby` | `{ lat, lng, radiusM, openNow?, hasDeals? }` | `DealCard[]`: one row per live **public** deal (link-only deals never appear), plus one row (`has_deal: false`) per business with no live deal; `hasDeals: true` drops those. Sorted by distance. Calls Hikaru's `deals_nearby` SQL function | Edward (feed, `hasDeals: true`), Hikaru (map: group by `business_id`; orange pin if any row has a deal, green otherwise) |
| `getDeal` | `{ id }` | `DealDetail \| null`, public or link-only, via `deal_by_id()` (this is how a deal link opens) | Edward |
| `getBusinessBySlug` | `{ slug }` | `{ business: BusinessPublic, liveDeals: Deal[] } \| null`, live public deals only | Edward (sticker landing) |
| `getMyRedemptions` | none | `Redemption[]`, newest first | Edward |
| `getBusinessStats` | `{ businessId, from, to }` | `BusinessStats` | Adolfo |
| `getMyDeals` | `{ businessId }` | `MyDeal[]`, newest start first, both visibilities | Adolfo |
| `getOpenClubNights` | none | `OpenClubNight[]`, open nights at the student's campus, soonest first | Edward (claim screen) |
| `getClubNights` | `{ businessId }` | `ClubNight[]` with `visit_count`, newest first | Adolfo (club night results) |
| `getStaff` | `{ businessId }` | `StaffMember[]` (owner and staff, active or invited) | Adolfo (staff list) |
| `subscribeToRedemptions` | `({ businessId }, onRedemption: (r: Redemption) => void)` | `() => void` (unsubscribe). Calls `onRedemption` for each new visit at that business within a few seconds (Realtime; RLS limits it to members, and `student_location` is never sent) | Adolfo (live visit feed) |

```ts
type DealStatus = "scheduled" | "live" | "ended";
type DiscountType = "amount_off" | "percent_off" | "free_item" | "bogo";
type RedemptionMethod = "sticker" | "pin" | "staff_scan";
type RedemptionMode = "sticker" | "staff_scan";
type DealVisibility = "public" | "link_only";
type ClubNightStatus = "open" | "claimed" | "expired";
type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
type Hours = Partial<Record<Weekday, [open: string, close: string][]>>; // local "HH:MM"; close < open means past midnight

type Deal = {
  id: string;
  business_id: string;
  title: string;
  description: string;
  discount_type: DiscountType | null;  // null: no student discount (club night deals)
  discount_value: number | null;
  photo_url: string | null;
  starts_at: string;    // ISO timestamp
  ends_at: string | null; // null only for repeating deals that run until turned off
  active_days: Weekday[] | null;
  daily_start: string | null;  // "HH:MM" campus time
  daily_end: string | null;
  visibility: DealVisibility;
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
      discount_type: DiscountType | null;
      discount_value: number | null;
      ends_at: string | null;
      live_until: string;   // end of the current live window; use for countdowns
      students_only: boolean;
      photo_url: string | null;
    })
  | (NearbyBusiness & {
      has_deal: false;
      deal_id: null; title: null; discount_type: null; discount_value: null;
      ends_at: null; live_until: null; students_only: null; photo_url: null;
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

type OpenClubNight = {
  id: string;
  business_id: string;
  business_name: string;
  night_date: string;   // "YYYY-MM-DD", campus time
  start_time: string;   // "HH:MM"
  end_time: string;
  giveback: string;
};

type StaffMember = {
  business_id: string;
  email: string;
  user_id: string | null;
  role: "owner" | "staff";
  status: "active" | "invited";  // computed: invited while user_id is null
};

type ClubNight = OpenClubNight & {
  status: ClubNightStatus;
  claimed_club_name: string | null;
  claimed_at: string | null;
  deal_id: string | null;
  visit_count: number;  // verified redemptions of deal_id
};
```

---

## Business writes (Sprint 1 mock adapter; proposed for Moses review)

| Function | Input | Success returns | Errors |
|---|---|---|---|
| `createDeal` | `CreateDealInput` | `{ ok: true, deal: MyDeal }` | `NOT_OWNER`, `INVALID_DEAL` (`fields: CreateDealErrors`) |
| `endDeal` | `{ business_id, deal_id }` | `{ ok: true, deal: MyDeal }` | `NOT_OWNER`, `DEAL_NOT_FOUND`, `DEAL_NOT_LIVE` |
| `cancelDeal` | `{ business_id, deal_id }` | `{ ok: true, deal_id: string }` | `NOT_OWNER`, `DEAL_NOT_FOUND`, `DEAL_NOT_SCHEDULED`, `DEAL_HAS_REDEMPTIONS`, `DEAL_IN_USE` |
| `getMyBusiness` | none | `BusinessProfile` | none |
| `getBusinessLocationOptions` (mock helper) | none | `Pick<BusinessPublic, "address" \| "lat" \| "lng">[]` | none |
| `saveBusiness` | `SaveBusinessInput` | `{ ok: true, profile: BusinessProfile }` | `NOT_OWNER`, `INVALID_BUSINESS` (`fields: BusinessInputErrors`) |

```ts
type CreateDealInput = Pick<Deal,
  "business_id" | "title" | "description" | "photo_url" | "starts_at" | "students_only"
> & { ends_at: string; discount_type: DiscountType; discount_value: number | null };
type CreateDealErrors = Partial<Record<keyof CreateDealInput, string>>;
type BusinessProfile = { business: BusinessPublic; pin_ready: boolean };
type SaveBusinessInput = Pick<BusinessPublic,
  "name" | "address" | "lat" | "lng" | "hours" | "logo_url" | "is_truck"
> & { business_id: string };
type BusinessInputErrors = Partial<Record<keyof SaveBusinessInput, string>>;
```

Writes return `Promise` results; errors are `{ ok: false, error, fields? }`. Read helpers return `Promise` values. `setPin` retains its Edge Function signature below.

---

## Edge Functions

All return either `{ ok: true, ... }` or `{ ok: false, error: ErrorCode }`. `lib/supabase/` wraps each one; the wrapper name is in the first column.

| Function (wrapper) | Input | Success returns | Owner |
|---|---|---|---|
| `redeem` (sticker) — `redeem()` | `{ deal_id, qr_slug, lat, lng }` (`lat`/`lng` null if location is denied) | `{ redemption: Redemption }` | Moses |
| `redeem-pin` — `redeemPin()` | `{ deal_id, business_id, pin }` | `{ redemption: Redemption }` | Moses |
| `issue-code` (staff mode) — `issueCode()` | `{ deal_id }` | `{ token, expires_at }` | Moses |
| `staff-redeem` — `staffRedeem()` | `{ token }` | `{ redemption: Redemption, deal_title }` | Moses |
| `claim-club-night` — `claimClubNight()` | `{ club_night_id, club_name }` | `{ club_night: ClubNight, deal_id }` (share `/deals/<deal_id>` with members) | Moses |
| `set-pin` — `setPin()` | `{ business_id }` (owner only) | `{ pin }`: a new random 4-digit PIN, returned this once and stored hashed. Used at onboarding and for "Reset PIN" | Moses |
| `add-staff` — `addStaff()` | `{ business_id, email }` (owner only) | `{ member: StaffMember }`; status `invited` until that email signs in | Moses |
| `notify-deal` — `notifyDeal()` | `{ deal_id }`, called when a deal goes live. **Stretch goal** | `{ sent: number }` | Hikaru |

`redeem` checks in this order: `NOT_SIGNED_IN`, `NOT_VERIFIED_STUDENT` (every redemption needs a verified student; `students_only` is display-only), then `WRONG_BUSINESS`, `DEAL_NOT_LIVE` (also for an unknown deal), `LOCATION_REQUIRED`, `TOO_FAR` (over 150 m), `ALREADY_REDEEMED_TODAY`. Functions always answer HTTP 200 with `{ ok, ... }`; anything else means a server error, and the wrapper throws.

`set-pin` and `add-staff` errors: `NOT_SIGNED_IN`, `NOT_OWNER`.

`claim-club-night` errors: `NOT_SIGNED_IN`, `NOT_VERIFIED_STUDENT`, `CLUB_NIGHT_EXPIRED`, `ALREADY_CLAIMED` (one claim per club night; the claim is a single conditional update, so two claims at once can't both win), `RATE_LIMITED` (Celso). An unknown night is `CLUB_NIGHT_EXPIRED`. The club name is trimmed and cut to 60 characters; a blank name is a bad request (HTTP 400, the wrapper throws), so the claim screen requires one.

### Redeem with repeat days and link-only deals
The two-QR rule and the redemption checks are in `CLAUDE.md` → Redemption rules. What that means for the functions:
- **Live now follows repeat days.** `DEAL_NOT_LIVE` uses `deal_status()`, so a Mon–Wed 2–5 PM deal fails outside that window. Same for `redeem-pin`, `issue-code`, and `staff-redeem`.
- **Daily limit is unchanged:** one redemption per student per deal per campus date, so a repeating deal can be redeemed once on each day it runs.
- **No visibility check in `redeem`:** link-only deals go through the same checks as public ones.
- **Club night deals have no discount.** The Redeemed screen shows the deal title (e.g. "Chess Club night") and no discount line; the visit counts for the club.

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
  | "RATE_LIMITED"
  | "ALREADY_CLAIMED"
  | "CLUB_NIGHT_EXPIRED"
  | "NOT_OWNER";
```

Every error code needs a friendly message in the UI (Edward and Adolfo).

---

## Mocks

`mocks/index.ts` runs the same checks as the real functions on in-memory data (resets on reload). Sample data matches the design canvas: eight businesses near UCR (five with live deals, three without), Orange Peel Tacos' full deal history and stats, and Jordan Reyes as the signed-in student.
- Jordan already redeemed "$2 off any burrito" today, so redeeming it returns `ALREADY_REDEEMED_TODAY` (screen 8b). Other live deals succeed.
- Use `MOCK_POSITIONS.atOrangePeelTacos` as the location to pass the 150 m check; your real location will return `TOO_FAR`.
- "$3 off any bowl" at Verde Bowl repeats Mon–Wed 2–5 PM, so it's only in the feed then.
- Club nights: Pepper Tree Pizza Co. has one **open** night (claim it with `claimClubNight()`); Orange Peel Tacos has a **claimed** Chess Club night live right now (link-only deal `deal-opt-chess-night`, opens with `getDeal()`, never in the feed) and a past Film Club night with 18 visits.
- Every mock PIN starts as `1234`; `setPin()` replaces it for Orange Peel Tacos. The mock staff account works at Orange Peel Tacos, so `staffRedeem()` on any other business's code returns `NOT_STAFF`.
- The mock owner owns Orange Peel Tacos: `setPin()` and `addStaff()` for any other business return `NOT_OWNER`. `getStaff()` shows an owner, an active staff member, and an invited one.
- `subscribeToRedemptions()` fires whenever a mock `redeem()`, `redeemPin()`, or `staffRedeem()` records a visit at that business.
- Test helpers (not in the real API): `MOCK_POSITIONS`, `UCR_CENTER`, `campusNow()`.

---

## Open questions
- Staff-scan tokens: signed tokens with no table, or a short-lived `redemption_codes` table? (Moses decides, Celso reviews, by Nov 1)
- PIN attempts: how many tries before lockout? (Celso)
