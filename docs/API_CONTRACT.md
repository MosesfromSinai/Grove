# API Contract

The shapes everyone builds against. Frontend work uses `mocks/` that match this file exactly, then swaps in real queries once the tables and functions exist.

**Owner:** Moses. **Status:** Final (2026-10-24), including repeat days, link-only deals, and club nights; business-adapter changes for #73/#112, the sticker read for #74, overview/connection helpers for #75, the mode write for #77, and club-night posting for #113 below are proposed for Moses's review (2026-11-06). Hosted integration remains unverified.
**Rule:** any change here goes in a pull request reviewed by the people it affects, plus a line in `docs/LOG.md`.
**Code copies:** the TypeScript types below live in `lib/supabase/types.ts`; `mocks/index.ts` exports every query and function below with the same name, input, and return type. Change all three together. Screens import from `lib/supabase` (`index.ts`), which serves `mocks/` or the real wrappers in `queries.ts` depending on `NEXT_PUBLIC_DATA_SOURCE`; a compile-time check keeps their signatures identical. The wrappers are browser-only: call them from client components so they run with the signed-in user's session.

_Last updated: 2026-11-07_

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
- **End now** (or turning off a repeating deal, including between daily windows) sets `ends_at = now()`. **Cancel** deletes a scheduled deal only before its first `starts_at`, without redemptions or a club-night reference. After a repeating deal starts, use End now rather than deleting it.
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
- **Review discrepancy (#113):** the existing `claim_club_night` SQL checks only whether the night has ended; it does not enforce the same-date claim restriction stated above. Its Edge wrapper adds no date check. Moses must reconcile the intended rule and hosted behavior; this posting change does not modify claim SQL/functions.

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
| `getBusinessOverview` | `{ businessId }` | `BusinessOverview`: today's/week's exact counts and latest 8 visits; member-only | Adolfo (#75 proposal for Moses review) |
| `getMyDeals` | `{ businessId }` | `MyDeal[]`, newest start first, both visibilities | Adolfo |
| `getOpenClubNights` | none | `OpenClubNight[]`, open nights at the student's campus, soonest first | Edward (claim screen) |
| `getClubNights` | `{ businessId }` | `ClubNight[]` with `visit_count`, newest first | Adolfo (club night results) |
| `getStaff` | `{ businessId }` | `StaffMember[]` (owner and staff, active or invited) | Adolfo (staff list) |
| `subscribeToRedemptions` | `({ businessId }, onRedemption: (r: Redemption) => void, onConnection?: (state: RedemptionConnection) => void)` | `() => void` (unsubscribe). Calls `onRedemption` for new visits at that business; optional connection callback reports connecting/live/reconnecting (#75 proposal). RLS limits it to members, and `student_location` is never sent | Adolfo (live visit feed) |

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

type BusinessOverview = { today: number; week: number; recentVisits: Redemption[]; as_of: string };
type RedemptionConnection = "connecting" | "live" | "reconnecting";

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

## Business reads and writes (#73/#112/#74/#77/#113 proposals for review)

All adapters now follow the shared mock/real switch. The real path uses the signed-in browser session, checks membership, and remains subject to RLS. It never falls back to mocks. Local adapter tests use simulated responses; authorized grove-dev membership and real-database verification are pending acceptance checks for #73.

**Overview (#75 proposal):** `getBusinessOverview` checks signed-in membership and throws `BusinessAccessError` (`NOT_SIGNED_IN`/`NOT_MEMBER`) or a query error; failures never become zero. Counts use exact HEAD queries independent of the returned-row cap, from campus midnight or Monday midnight through one browser-clock `as_of` instant (inclusive). Resolve calendar boundaries separately in `America/Los_Angeles` to handle DST. The initial feed reads the newest 8 visits across all dates, ordered by `redeemed_at` then `id` descending; only explicitly allowed fields and deal/business labels are selected. Mocks count actual fixture visits in the same periods, rather than using canned stats. Overview reads `getMyDeals` separately and computes live windows with shared `dealStatus`. It subscribes before loading, refreshes canonical counts/feed on events and connection recovery, queues an extra refresh for events arriving during a read, and polls every minute/on return to the tab. It never increments totals from event deliveries. Failed refreshes label retained data as old; lost membership clears it. Subscription cleanup suppresses late callbacks. No new tables, migrations, functions, or backend deployment; authorized real counts/RLS/Realtime and browser/database-clock consistency remain acceptance checks.

**Stats screen (#76 proposal):** no signature or type changes. `getBusinessStats` mocks require the sample business membership and aggregate actual fixture redemptions in `[from,to)`, across public/link-only/club deals and all successful methods. Both breakdowns sum to `total`; hours are campus local (0–23), with both occurrences of a DST fold sharing their hour bucket. The screen offers the last 7/30 campus calendar days including today, from the first midnight through the read instant, and confirms totals before displaying charts. Missing hours are zero-filled; failed refreshes label retained snapshots with their original range, and detected lost membership clears them. **Real reporting remains gated:** #21 is open and the legacy real wrapper reads raw rows without member/paging guarantees. The real Stats screen shows unavailable and never calls it or falls back to mocks. Moses must complete/review member-scoped, complete reporting before this guard is removed; hosted RLS/count/date/clock checks remain pending. No SQL/functions/deployment in #76.

| Function | Input | Success returns | Errors |
|---|---|---|---|
| `createDeal` | `CreateDealInput` | `{ ok: true, deal: MyDeal }` | `NOT_SIGNED_IN`, `NOT_OWNER`, `IMAGE_STORAGE_UNAVAILABLE`, `INVALID_DEAL` (`fields: CreateDealErrors`) |
| `endDeal` | `{ business_id, deal_id }` | `{ ok: true, deal: MyDeal }` | `NOT_SIGNED_IN`, `NOT_OWNER`, `DEAL_NOT_FOUND`, `DEAL_NOT_LIVE` |
| `cancelDeal` | `{ business_id, deal_id }` | `{ ok: true, deal_id: string }` | `NOT_SIGNED_IN`, `NOT_OWNER`, `DEAL_NOT_FOUND`, `DEAL_NOT_SCHEDULED`, `DEAL_HAS_REDEMPTIONS`, `DEAL_IN_USE` |
| `getMyBusiness` | none | `BusinessProfile \| null` (no membership) | throws `BusinessAccessError` (`NOT_SIGNED_IN`, `MULTIPLE_BUSINESSES`) or a transport/query error |
| `getBusinessSticker` | `{ businessId }` | `BusinessSticker \| null` (missing business/slug) | throws `BusinessAccessError` (`NOT_SIGNED_IN`, `NOT_MEMBER`) or a transport/query error |
| `getBusinessLocationOptions` | none | `Pick<BusinessPublic, "address" \| "lat" \| "lng">[]`; sample coordinates on mocks, `[]` on real data (no geocoder) | throws on transport failure |
| `saveBusiness` | `SaveBusinessInput` | `{ ok: true, profile: BusinessProfile }` | `NOT_SIGNED_IN`, `NOT_OWNER`, `IMAGE_STORAGE_UNAVAILABLE`, `INVALID_BUSINESS` (`fields: BusinessInputErrors`) |
| `setRedemptionMode` | `SetRedemptionModeInput` | `{ ok: true, redemption_mode }` | `NOT_SIGNED_IN`, `NOT_OWNER`, `INVALID_MODE`, `STAFF_SCAN_UNAVAILABLE`; throws on transport/query or unconfirmed write |
| `createClubNight` | `CreateClubNightInput` | `{ ok: true, club_night: OpenClubNight }` (posting receipt, not a current claim-status snapshot) | `NOT_SIGNED_IN`, `NOT_OWNER` (legacy code for nonmember write), `INVALID_CLUB_NIGHT` (`fields`); throws on query/transport failure |

```ts
type CreateDealInput = Pick<Deal,
  "business_id" | "title" | "description" | "photo_url" | "starts_at" | "students_only"
> & {
  ends_at: string | null;
  active_days?: Weekday[] | null;
  daily_start?: string | null;
  daily_end?: string | null;
  visibility?: DealVisibility;
  discount_type: DiscountType;
  discount_value: number | null;
};
type CreateDealErrors = Partial<Record<keyof CreateDealInput, string>>;
type BusinessProfile = { business: BusinessPublic; membership_role: "owner" | "staff"; pin_ready: boolean | null };
type BusinessSticker = { business_id: string; business_name: string; qr_slug: string };

type SetRedemptionModeInput = { business_id: string; redemption_mode: RedemptionMode };
type SetRedemptionModeResult = { ok: true; redemption_mode: RedemptionMode } |
  { ok: false; error: "NOT_SIGNED_IN" | "NOT_OWNER" | "INVALID_MODE" | "STAFF_SCAN_UNAVAILABLE" };

type CreateClubNightInput = Pick<OpenClubNight, "business_id" | "night_date" | "start_time" | "end_time" | "giveback">;
type CreateClubNightErrors = Partial<Record<keyof CreateClubNightInput, string>>;
type CreateClubNightResult = { ok: true; club_night: OpenClubNight } |
  { ok: false; error: "NOT_SIGNED_IN" | "NOT_OWNER" } |
  { ok: false; error: "INVALID_CLUB_NIGHT"; fields: CreateClubNightErrors };
type SaveBusinessInput = Pick<BusinessPublic,
  "name" | "address" | "lat" | "lng" | "hours" | "logo_url" | "is_truck"
> & { business_id: string };
type BusinessInputErrors = Partial<Record<keyof SaveBusinessInput, string>>;
```

Writes return `Promise` results; errors are `{ ok: false, error, fields? }`. Read helpers return `Promise` values. `setPin` retains its Edge Function signature below.

- Omitted repeat fields become null; omitted visibility becomes `public`. Chosen weekdays are unique, valid, and normalized Monday–Sunday. Repeats require both `HH:MM` daily times with end later than start (no overnight windows). Only repeats can omit an end instant. Starts/end instants and daily windows use campus time in the UI; instants are saved as UTC.
- Business updates remain owner-only. Deal reads/writes allow owner or staff membership; `NOT_OWNER` is the legacy write-permission code for nonmembers. Real `getMyDeals` throws `BusinessAccessError` (`NOT_SIGNED_IN` or `NOT_MEMBER`) instead of presenting another business's public rows as its management data. Multiple memberships are refused until the coordinator resolves the account's business; this MVP has no business selector.
- There is no browser business-creation policy/provisioning function. No membership returns null and an access-needed state; it never loads the sample owner in real mode. Business updates write PostGIS `location` as `SRID=4326;POINT(lng lat)`; generated lat/lng are read-only.
- `pin_ready: null` means unknown on real data: no query reads `staff_pin`. Onboarding preserves existing PINs and never treats unknown as unset. Mocks retain known boolean readiness. Only an explicitly known `false` runs the first-PIN flow; `setPin` still returns a PIN once and it is never logged or persisted.
- **Settings (#77 proposal):** `setRedemptionMode` checks signed-in owner membership, validates the mode and updates only `businesses.redemption_mode`, returning only the confirmed mode. It never reads/writes PINs or slugs. Existing SQL grants/policies support this update. However, #20 remains open and `issue-code`/`staff-redeem` are absent on main: the real helper refuses activating `staff_scan` with `STAFF_SCAN_UNAVAILABLE`, and the real UI disables that option. An existing Staff scan configuration can return to Sticker. Mocks support both modes. Remove the guard/disabled state only after backend readiness is verified; complete live mode-switch acceptance is pending.
- **Reset PIN (#77):** uses the existing `setPin({ business_id })` Edge Function wrapper unchanged, only after explicit owner confirmation. No current PIN read or automatic reset. Only a validated four-digit success response is displayed, held temporarily in component state; manual hide, page/tab exit and a 60-second timeout discard it. It cannot be revealed again. No browser storage, clipboard, logs, or screenshot/report output. Prevent duplicate submission and ignore late responses after navigation; a reset returning while hidden is never revealed later. Transport failures explain that the reset may have completed and require a new explicit confirmation, never an automatic retry. Staff controls are read-only; permission changes lock writes until profile reload. Unknown PIN readiness remains preserved unless a confirmed reset succeeds.
- **Open club-night posting (#113 proposal):** signed-in owner or staff members may insert using existing member RLS. Validation accepts a real campus date (today or future), minute-precision `HH:MM` endpoints with end after start on the same date, and a trimmed 1–500-character giveback (proposed client limit, not a new SQL constraint). The end instant must still be in the future; a same-day night may already be in progress. Resolve endpoints in campus time and reject ambiguous/nonexistent DST endpoints. Insert only the five allowlisted columns; never set claim columns, status, PIN, or deal IDs, and do not create a deal. Return an explicit safe posting receipt. Matching mocks add the unclaimed record to existing club-night queries without mutating deals/PINs.
- `getClubNights` management reads require signed-in membership (`BusinessAccessError` on `NOT_SIGNED_IN`/`NOT_MEMBER`), preventing a former member's student-visible public nights from appearing as management data. Transport or interrupted-post uncertainty locks retry until a fresh list read and an explicit new-draft action; there is no automatic POST retry. There is no schema idempotency key or uniqueness guarantee, so this is manual receipt recovery, not exactly-once insertion. Hosted owner/staff/nonmember RLS, persistence, browser/database clock agreement, and downstream claiming remain acceptance checks; no backend objects are changed.
- **Club-night results (#114 proposal, 2026-11-07):** `getClubNights` reads all nights for the selected business in 500-row pages, ordered by date, start time, then ID descending. `visit_count` is the joined aggregate of successful redemptions of that night's `deal_id`, across all methods and dates; it is not a count of unique club members or an estimate of giveback owed. Missing/invalid claimed-deal aggregates and page errors fail the read rather than invent zero or return partial history. `claimed_by` and student identities are not selected. The dashboard shows 20 nights initially with Show more, student-entered club names as text, counts including genuine zero, and campus wall times. Refresh replaces the snapshot; failures label retained results stale, and detected membership loss clears them. No new signature, table, function, or backend deployment. Actual hosted aggregate/RLS behavior and end-to-end claim/redemption checks remain pending.
- Image Storage buckets/policies/uploads are absent. Real posting requires `photo_url: null`; real business saves may retain the exact existing logo URL or remove it. New images return `IMAGE_STORAGE_UNAVAILABLE` without a write. Mock data URLs remain memory-only. HTTPS URLs permit existing Storage logos to pass shared validation; this is not proof an upload exists.
- Mutations recheck current state and constrain updates/deletes by business and schedule. FK constraints preserve redemptions and club-night references racing deletion. Browser UTC supplies write timestamps as in existing adapters; verify clock and race behavior against the real database before acceptance.
- `getBusinessSticker` (#74) checks the signed-in user's owner/staff membership, then selects only `businesses.id, name, qr_slug`. Existing SQL column grants permit this; no migration, function, or write is needed. `qr_slug` remains excluded from `BusinessPublic`. A missing slug returns null; no slug is invented. The mock returns only the sample owner's sticker and rejects other businesses with `NOT_MEMBER`.
- Counter stickers encode the configured `NEXT_PUBLIC_SITE_URL` origin plus `/b/<qr_slug>`, never a deal or redemption endpoint. The origin must be HTTPS (HTTP is allowed only for loopback previews), without credentials/path/query/fragment. Missing/invalid configuration blocks downloading. PNG exports use the Grove theme/fonts, 3/4/6-inch squares at 300 DPI (900/1200/1800 pixels, with PNG pHYs metadata), an unobstructed QR with four-module quiet zone, and the wording "Scan in the Grove app to redeem." Mock exports are marked DEMO. Actual-size printing/physical scans and the hosted membership/slug read remain acceptance checks; Edward's `/b/[slug]` page still depends on PR #139.

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

`redeem` checks in this order: `NOT_SIGNED_IN`, `NOT_VERIFIED_STUDENT` (every redemption needs a verified student; `students_only` is display-only), `RATE_LIMITED` (more than 10 `redeem` or `redeem-pin` attempts by the student in a minute), then `WRONG_BUSINESS`, `DEAL_NOT_LIVE` (also for an unknown deal), `LOCATION_REQUIRED`, `TOO_FAR` (over 150 m), `ALREADY_REDEEMED_TODAY`. Functions always answer HTTP 200 with `{ ok, ... }`; anything else means a server error, and the wrapper throws.

`redeem-pin` checks in this order: `NOT_SIGNED_IN`, `NOT_VERIFIED_STUDENT`, `RATE_LIMITED` (the same 10-a-minute limit), `DEAL_NOT_LIVE` (unknown deal, another business's deal, or not live now), `RATE_LIMITED` (PIN lockout: 5 bad PINs by that student at that business in 15 minutes; other students aren't affected), `BAD_PIN` (anything but the right 4 digits), `ALREADY_REDEEMED_TODAY`.

`set-pin` and `add-staff` errors: `NOT_SIGNED_IN`, `NOT_OWNER` (only the business's owner; staff get `NOT_OWNER`). A new business's `qr_slug` comes from its name (accents removed, lowercase, dashes), plus a short suffix if taken.

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
