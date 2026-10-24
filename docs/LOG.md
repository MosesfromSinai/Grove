# Log

What each person got done, **grouped by person**, newest first within each section. Anyone can open this file and see exactly what Celso (or anyone) shipped and when.

**Rules**
- Write only in your own section (or **Team**, for things done together).
- One line per thing shipped, changed, or learned. Link the PR or file.
- Add lines at the end of every session, in the same PR as your code.
- Detail stays in your `team/<name>.md` session log; this file is the summary everyone reads.

**Format:** `- **YYYY-MM-DD:** what happened (PR #, file, or link)`

**Decisions**
- Only decisions that affect someone else are logged, as a line in your own section tagged **Decision** with who it affects: `- **2026-10-20:** **Decision** (affects Hikaru, Edward): getDealsNearby returns businesses with no deal; id is now deal_id.` Decisions made together at a sync go under **Team**.
- If you disagree, raise it with the person who decided or at the weekly sync.

How each session catches up on this file: `CLAUDE.md` → Session protocol, step 3.

---

## Team
- **2026-10-24:** **Decision** (affects everyone): Grove is a marketing company first (restaurants pay to bring in students, especially Mon–Wed). MVP adds repeat days, link-only deals, club nights (no club accounts; giveback paid outside the app), and a shareable deal link and QR (advertising only; redeeming still needs the counter sticker). Push moves to a stretch goal. Weeks 2–3 are front-loaded; feature freeze at the end of Nov 8 (`CLAUDE.md`).
- **2026-10-19:** Assigned engineering and business roles (see `CLAUDE.md` → Team).
- **2026-10-09:** Lean Canvas: Problem, Solution, UVP, Customer Segments filled.
- **2026-10-08:** Professor approved the reframed idea: campus marketing platform for food businesses near campuses.

## Moses
- **2026-10-24:** De-bloat pass: README cut to setup and doc links (156 → 44 lines), week gates moved into `CLAUDE.md`, repeated text trimmed in `CLAUDE.md`, STATUS, the contract, LOG, and team files (every rule, task, and issue number kept); ignored editor and Supabase CLI files; removed scaffold leftovers.
- **2026-10-24:** **Decision** (affects everyone): health check fixes. Moses owns every unlisted file (Celso may edit root routing for onboarding); Hikaru's role is maps and PWA install (push stretch) and he builds the "I'm here now" button Adolfo places; Moses owns the staff-token design (#19, Celso reviews by Nov 1); new `set-pin` (week 2) and `add-staff` (week 3) functions, `deal_by_id()` for link-only deals; Resend moved to stretch; production Supabase moved to week 3; if Celso isn't active by Oct 26, Moses takes #29. Added `.env.example` and a Done-when line on every open issue.
- **2026-10-24:** Split the PWA manifest and app icons out of push (#91) into #119 (Hikaru, week 3), so Grove is installable without push.
- **2026-10-24:** Updated the repo for Activity 2: `CLAUDE.md`, README, STATUS, all five team files, and the API contract (now final: repeat days, `visibility`, `club_nights`, `claim-club-night`), with `mocks/` to match. Synced GitHub issues and the board's week field.
- **2026-10-20:** **Decision** (affects everyone): no password manager; everyone gets keys only by running `vercel env pull .env.local` after Moses invites them to Vercel and Supabase. Node 22 is pinned (`.nvmrc`, `package.json` engines). PRs need 1 teammate approval; `CODEOWNERS` requests reviewers but code-owner review isn't required yet.
- **2026-10-20:** **Decision** (affects Celso, Adolfo, Hikaru, Edward): deal status is computed from `starts_at`/`ends_at`, not stored. "End now" sets `ends_at = now()`; cancelling a scheduled deal deletes it. RLS and `deals_nearby` check the time window.
- **2026-10-20:** **Decision** (affects Adolfo, Edward, Hikaru): deals get `discount_type` (`amount_off`, `percent_off`, `free_item`, `bogo`) and `discount_value` (dollars or percent; null for free item and BOGO), matching the Post a deal form.
- **2026-10-20:** **Decision** (affects Hikaru, Edward): `getDealsNearby` returns businesses with no deal (`has_deal: false`) for the map's green pins; the feed passes `hasDeals: true`; id is now `deal_id`.
- **2026-10-20:** Buttons are at least 44px tall at every size, bold, with dark-green links; `/theme` uses the defaults. Added Tailwind class names to the Design reference in `CLAUDE.md` (`components/ui/button.tsx`, `app/theme/page.tsx`).
- **2026-10-20:** Built the Grove Tailwind theme for Edward's #48: color, radius, and shadow tokens, Bricolage Grotesque + Figtree, shadcn mapped to Grove colors, preview at `/theme` (`app/globals.css`, `app/layout.tsx`, `app/theme/page.tsx`).
- **2026-10-20:** Created the GitHub repo `MosesfromSinai/Grove`, protected `main`, linked the Grove project board; Hikaru and Adolfo accepted invites.
- **2026-10-20:** API contract: defined `Deal`, `DealDetail`, `MyDeal`, `Redemption`, `BusinessPublic`, `BusinessStats`; added structured discount; deal status now computed; `getDealsNearby` returns businesses without deals (`has_deal`) (`docs/API_CONTRACT.md`).
- **2026-10-20:** Added `mocks/` for every contract query and function, with canvas sample data, plus `lib/supabase/types.ts` (`mocks/`, `lib/supabase/`).
- **2026-10-20:** Added the public-repo secrets rule to `CLAUDE.md` Conventions.
- **2026-10-20:** Scaffolded Next.js 16 with TypeScript strict, Tailwind, shadcn/ui, and the README folder layout; pinned Node 22; added `CODEOWNERS` (`moses/scaffold`).
- **2026-10-20:** Keys now come only from `vercel env pull`; updated the secrets and review rules in `CLAUDE.md` and the README setup.
- **2026-10-20:** Created issues #1–#99 for every team-file task, added them to the Grove board, and wrote the numbers into all five team files.
- **2026-10-20:** Fixed the Team table formatting in `README.md`.
- **2026-10-19:** Created project docs: README, CLAUDE.md, STATUS, DECISIONS, LOG, API_CONTRACT, five team files, PR template.
- **2026-10-19:** Wrote Claude Design prompt for the app with both redemption modes.
- **2026-10-12:** Updated the Grove Tech Stack Plan (Claude Docs) for sticker redemption and both modes.

## Celso
_Nothing logged yet._

## Edward
_Nothing logged yet._

## Adolfo
_Nothing logged yet._

## Hikaru
_Nothing logged yet._
