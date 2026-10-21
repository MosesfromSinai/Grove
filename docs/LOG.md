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

At the start of every session, each person's Claude reads the other sections for entries since that person's last session and summarizes them, so everyone stays current and can ask teammates about their work. It also tells that person about every **Decision** line that affects them.

---

## Team
- **2026-10-19:** Assigned engineering and business roles (see `CLAUDE.md` → Team).
- **2026-10-09:** Lean Canvas: Problem, Solution, UVP, Customer Segments filled.
- **2026-10-08:** Professor approved the reframed idea: campus marketing platform for food businesses near campuses.

## Moses
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
