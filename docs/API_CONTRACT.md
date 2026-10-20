# API Contract

The shapes everyone builds against. Frontend work uses `mocks/` that match this file exactly, then swaps in real queries once the tables and functions exist.

**Owner:** Moses. **Status:** DRAFT. Moses finalizes by day 3 of week 1 (Oct 21) so mocks can match it.
**Rule:** any change here goes in a pull request reviewed by the people it affects, plus a line in `docs/LOG.md`.

_Last updated: 2026-10-19_

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
| students_only | boolean | Default true |
| status | text | `scheduled`, `live`, `ended` |
| created_at | timestamptz | |

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
| `getDealsNearby` | `{ lat, lng, radiusM, openNow?, hasDeals? }` | `DealCard[]` (calls Hikaru's `deals_nearby` SQL function) | Edward, Hikaru |
| `getDeal` | `{ id }` | `DealDetail` | Edward |
| `getBusinessBySlug` | `{ slug }` | `{ business, liveDeals[] }` | Edward (sticker landing) |
| `getMyRedemptions` | none | `Redemption[]` | Edward |
| `getBusinessStats` | `{ businessId, from, to }` | `{ perDeal[], perHour[], total }` | Adolfo |
| `getMyDeals` | `{ businessId }` | `Deal[]` | Adolfo |

```ts
type DealCard = {
  id: string;
  title: string;
  business_id: string;
  business_name: string;
  lat: number;
  lng: number;
  distance_m: number;
  ends_at: string;      // ISO timestamp
  students_only: boolean;
  photo_url: string | null;
  open_now: boolean;
};
```

---

## Edge Functions

All return either `{ ok: true, ... }` or `{ ok: false, error: ErrorCode }`.

| Function | Input | Success returns | Owner |
|---|---|---|---|
| `redeem` (sticker) | `{ deal_id, qr_slug, lat, lng }` | `{ redemption }` | Moses |
| `redeem-pin` | `{ deal_id, business_id, pin }` | `{ redemption }` | Moses |
| `issue-code` (staff mode) | `{ deal_id }` | `{ token, expires_at }` | Moses |
| `staff-redeem` | `{ token }` | `{ redemption, deal_title }` | Moses |
| `notify-deal` | `{ deal_id }`, called when a deal goes live | `{ sent: number }` | Hikaru |

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

## Open questions
- Staff-scan tokens: signed tokens with no table, or a short-lived `redemption_codes` table? (Moses + Celso)
- PIN attempts: how many tries before lockout? (Celso)
- Push targeting: everyone at the campus, or only students within X km of the business? (Hikaru)
