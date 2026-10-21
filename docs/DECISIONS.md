# Decisions

Every decision that changes what we build or how, **grouped by who made it**. Team decisions (agreed together, e.g. at a sync) go under **Team**. Newest first within each section.

Never delete an entry. If a decision is reversed, add a new one and mark the old one **Superseded**.

## How this keeps us accountable
- **Affects** lists the people the decision changes work for.
- **Acknowledged** shows who has seen it. Each person's Claude checks this file at the start of every session. If someone made a decision that affects you and you haven't acknowledged it, Claude tells you (for example: "Celso decided yesterday that PINs lock after 5 tries. Do you want to follow the same rule, or push back?"). Then it records your answer:
  - ✅ `Name` — agreed / will follow
  - ❓ `Name` — has a question (add it under **Responses**)
  - ❌ `Name` — disagrees (add why under **Responses**; raise it at the next sync)
- **Status:** `Proposed` (affects others; waiting on them), `Accepted` (everyone affected has ✅), or `Superseded`.

### Template
```
### YYYY-MM-DD — Title
- **What:**
- **Why:**
- **Affects:** Name, Name (or "Everyone", or "Only me")
- **Status:** Proposed
- **Acknowledged:** ✅ Me
- **Responses:**
```

---

## Team

### 2026-10-19 — Everyone codes and everyone does business work
- **What:** Five engineering roles and five business roles, one of each per person. Everyone does 1–2 customer interviews.
- **Why:** The class grades effort in separate Eng and Biz columns that each total 100. A non-coding role would leave one person at zero engineering.
- **Affects:** Everyone
- **Status:** Proposed
- **Acknowledged:** ✅ Moses
- **Responses:**

### 2026-10-19 — Team roles
- **What:** Moses: backend and redemption engine / pitch and demo. Celso: security and auth / competitor analysis. Edward: student app / student survey. Adolfo: business dashboard / pilot outreach. Hikaru: maps and notifications / Lean Canvas and pricing.
- **Why:** Celso wants security work. Hikaru took maps and push to balance Moses's and Edward's loads.
- **Affects:** Everyone
- **Status:** Proposed
- **Acknowledged:** ✅ Moses
- **Responses:**

### 2026-10-19 — Build against shared mocks
- **What:** Moses writes `mocks/` by Oct 21 matching `API_CONTRACT.md`. Frontend builds on mocks, then swaps to real queries.
- **Why:** Nobody waits on the database; only connecting to live data waits about a week.
- **Affects:** Everyone
- **Status:** Proposed
- **Acknowledged:** ✅ Moses
- **Responses:**

### 2026-10-12 — Two redemption modes, sticker first
- **What:** Sticker mode is the default and is built first. Staff-scan mode is built second as an option each business can turn on. A 4-digit store PIN is the backup for both.
- **Why:** Sticker mode needs no staff device or training. Staff scan gives owners who want it the strongest proof.
- **Affects:** Everyone
- **Status:** Accepted
- **Acknowledged:** Team
- **Responses:**

### 2026-10-12 — Permanent counter sticker for redemption
- **What:** Each business gets one permanent QR sticker (`grove.app/b/<qr_slug>`). Students scan it; the server checks business, live deal, location within ~150 m, and the daily limit. The phone shows an animated Redeemed screen for the cashier.
- **Why:** Staff scanning a student code slows down a busy counter. The sticker also works as advertising when scanned with a normal camera.
- **Affects:** Everyone
- **Status:** Accepted. Supersedes "student shows a one-time code, staff scan it" as the default.
- **Acknowledged:** Team
- **Responses:**

### 2026-10 — Tech stack
- **What:** Next.js + TypeScript PWA on Vercel; Supabase (Postgres + PostGIS, Auth, Storage, Edge Functions, Realtime); Mapbox; Web Push; Tailwind + shadcn/ui.
- **Why:** One backend service for everything, no per-user auth fees, standard Postgres so no lock-in. A PWA avoids App Store review for the MVP.
- **Affects:** Everyone
- **Status:** Accepted
- **Acknowledged:** Team
- **Responses:**

### 2026-10 — MVP scope: six core features
- **What:** Deal posting, deal feed and map, .edu verification, scan-to-redeem, business dashboard, push notifications. Rewards points and Instagram posting are cut. Club fundraisers, squad deals, leaderboards, menu import, dish search, and POS links wait until after the MVP.
- **Affects:** Everyone
- **Status:** Accepted
- **Acknowledged:** Team
- **Responses:**

### 2026-10-08 — Reframe: campus marketing platform
- **What:** Grove is a marketing company. Paying customers are locally owned restaurants and food trucks near college campuses; students are users. Launch at UCR, then expand campus by campus.
- **Why:** Professor's feedback: the problem isn't UCR-specific.
- **Affects:** Everyone
- **Status:** Accepted
- **Acknowledged:** Team
- **Responses:**

### Open (no decision yet)
- **Name:** "Grove" may be trademarked. Alternatives: Grov, Grovr, Roost. Needs a USPTO search plus App Store, domain, and Instagram handle checks.
- **Pricing:** pay per verified redemption (~$0.50–1, monthly cap) at launch, flat monthly plan (~$49–99) later. Must be validated in interviews.

---

## Moses

### 2026-10-20 — Dev setup: keys via Vercel, Node 22, review rules
- **What:** No password manager: Moses invites everyone to the Vercel and Supabase projects, and each person runs `vercel env pull .env.local` to get keys. Node 22 is pinned (`.nvmrc`, `package.json` engines). `main` needs 1 approval from a teammate other than the author, with no bypass for anyone. `CODEOWNERS` requests reviewers, but code-owner review isn't required yet.
- **Why:** The repo is public, so keys come from one place and never pass through chat. One Node version avoids "works on my machine" builds on Vercel. Requiring code-owner review now would block PRs while Celso and Edward haven't accepted their invites.
- **Affects:** Everyone
- **Status:** Proposed
- **Acknowledged:** ✅ Moses
- **Responses:**

### 2026-10-20 — Deal status is computed from start and end times
- **What:** `deals` has no `status` column. A deal is `scheduled` before `starts_at`, `live` until `ends_at`, then `ended`. "End now" sets `ends_at = now()`; cancelling a scheduled deal deletes it. Queries return the computed `status`.
- **Why:** A stored status goes stale unless a job keeps flipping it, and then `redeem` and the feed could disagree about whether a deal is live.
- **Affects:** Celso (RLS on `deals` checks the time window), Adolfo (My deals tabs, End now, Cancel), Hikaru (`deals_nearby` filters on the time window), Edward
- **Status:** Proposed
- **Acknowledged:** ✅ Moses
- **Responses:**

### 2026-10-20 — Deals get a structured discount
- **What:** `deals` gets `discount_type` (`amount_off`, `percent_off`, `free_item`, `bogo`) and `discount_value` (dollars or percent; null for free item and BOGO), matching the four choices on the Post a deal screen.
- **Why:** The post-deal form had a discount field with nowhere to store it.
- **Affects:** Adolfo (post-deal form), Edward (deal card and detail can show it), Hikaru (`deals_nearby` returns it)
- **Status:** Proposed
- **Acknowledged:** ✅ Moses
- **Responses:**

### 2026-10-20 — getDealsNearby also returns businesses with no live deal
- **What:** `DealCard` now has `has_deal`. Each live deal is one row; each nearby business with no live deal is one row with `has_deal: false` and null deal fields. `hasDeals: true` drops those rows. The deal id field is now `deal_id` (was `id`).
- **Why:** The map shows green pins for businesses without deals, and the old shape only returned deals.
- **Affects:** Hikaru (`deals_nearby` SQL and map pins), Edward (feed passes `hasDeals: true`; use `deal_id`)
- **Status:** Proposed
- **Acknowledged:** ✅ Moses
- **Responses:**

## Celso

_No decisions yet._

## Edward

_No decisions yet._

## Adolfo

_No decisions yet._

## Hikaru

_No decisions yet._
