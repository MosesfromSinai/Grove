# Grove

**Where food finds its campus.**

Grove is a marketing company for locally owned restaurants and food trucks near a college campus. Restaurants pay us to bring in students, especially on slow days (Mon–Wed). We reach students through campus channels (clubs, flyers, tabling) and our app. The app runs the deals and proves every visit: students redeem in store by scanning the counter sticker, so restaurants see exactly which customers Grove brought in.

Pricing (still being validated in interviews): per verified visit (~$0.50–1, monthly cap) plus a flat fee for bigger events like club nights. First deal free for pilot restaurants.

We are launching at UC Riverside. Built for CS 175 (Entrepreneurship in Computing), Fall 2026.

> Working name. "Grove" may be trademarked; see Open decisions in `docs/STATUS.md`.

---

## Team

| Person | Engineering role |
|---|---|
| Moses Avila | Backend and redemption engine |
| Celso Lopez | Security and auth |
| Edward Van | Student app |
| Adolfo Magallanes | Business dashboard |
| Hikaru Shimada | Maps and PWA install (push: stretch) |

---

## MVP features

1. **Deal posting:** businesses post deals from a dashboard. A deal can repeat on chosen days in a daily window (e.g. Mon–Wed, 2–5 PM), and can be public or link-only.
2. **Deal feed and map:** students browse nearby public deals with filters (open now, has deals, distance).
3. **.edu verification:** Google sign-in plus a school email check.
4. **Scan to redeem:** two modes, chosen by each business (below).
5. **Club nights:** a restaurant posts an open club night with a giveback (e.g. "15% back to your club"); a student claims it for their club by typing the club name, and members redeem through the club's link-only deal. The giveback is paid outside the app.
6. **Shareable deal link and QR:** for flyers and group chats. It only opens the deal; redeeming still needs the counter sticker.
7. **Business dashboard:** redemptions per deal and by hour, club night visits, live visit feed.

**Stretch goal (possible future implementation):** push notifications and email.

**Out of scope for the MVP:** club accounts or verified club membership, tracking which channel brought each visit, payments and billing, in-app giveback payouts, rewards points, squad deals, leaderboards, menu import and dish search, Instagram posting, payment-system (Square, Toast) links, native apps.

### Redemption modes

| Mode | How it works | Verified by |
|---|---|---|
| **Sticker** (default, built first) | Each business has one permanent QR sticker at the register. The student opens a deal, taps **Redeem in store**, and scans it. | Location within ~150 m, one redemption per student per deal per day, cashier sees the animated Redeemed screen |
| **Staff scan** (built second) | The student's phone shows a QR code that refreshes about every 30 seconds. Staff scan it from the dashboard. | One-time code, only a logged-in staff account for that business can redeem |

**Backup for both:** staff type the business's 4-digit PIN on the student's phone.

---

## Tech stack

| Layer | Choice |
|---|---|
| App | Next.js 16 (App Router) + React + TypeScript, installable PWA, Node 22 |
| Hosting | Vercel (preview deploy for every pull request) |
| Database, auth, storage, server functions | Supabase (Postgres + PostGIS, Auth, Storage, Edge Functions, Realtime) |
| Map | Mapbox GL JS |
| QR | `qrcode` (generate stickers), `html5-qrcode` (scan in browser) |
| Notifications | Web Push (VAPID), stretch goal |
| Email | Resend, stretch goal (the MVP sends no email) |
| UI | Tailwind CSS + shadcn/ui, Recharts for charts |
| Errors | Sentry |
| Project tracking | GitHub Projects |

---

## Getting started

**Requirements:** Node.js 22 (pinned in `.nvmrc`; with [nvm](https://github.com/nvm-sh/nvm), run `nvm install` then `nvm use`), Git, the [Vercel CLI](https://vercel.com/docs/cli) (`npm i -g vercel`), the [Supabase CLI](https://supabase.com/docs/guides/cli), and Docker (only if you run Supabase locally).

**Accounts:** accept Moses's invites to the Grove project on Vercel and Supabase first. That's how you get keys; nobody sends them in chat.

```bash
git clone git@github.com:MosesfromSinai/Grove.git grove
cd grove
nvm use                      # Node 22
npm install
vercel link                  # pick the Grove project
vercel env pull .env.local   # downloads every key; .env.local is git-ignored
npm run dev                  # http://localhost:3000
```

When a key changes, run `vercel env pull .env.local` again. Before pushing, run `npm run lint`, `npm run typecheck`, and `npm run build`.

### Environment variables

Values live in Vercel and arrive through `vercel env pull`. `.env.example` lists the names with empty values.

| Variable | Where it's used |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser and server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser and server |
| `SUPABASE_SERVICE_ROLE_KEY` | Server and Edge Functions only |
| `NEXT_PUBLIC_SITE_URL` | Deal-link QR codes and the sign-in redirect |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Map |
| `NEXT_PUBLIC_SENTRY_DSN` | Error reporting |
| `SENTRY_AUTH_TOKEN` | Source map upload at build time only |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Push subscription (stretch goal) |
| `VAPID_PRIVATE_KEY` | Sending push (stretch goal) |
| `RESEND_API_KEY` | Email (stretch goal) |

### Testing on a phone

Camera and location only work over HTTPS. Use the Vercel preview link from your pull request, or run `npx ngrok http 3000`. If push (a stretch goal) is built, on iPhone it only works after adding Grove to the home screen (iOS 16.4+).

---

## Folder layout

```
grove/
├── app/
│   ├── (student)/          # Edward: feed, deal page, redeem, profile
│   │   └── map/            # Hikaru: map and filters
│   ├── (business)/         # Adolfo: dashboard, deals, stats, settings, scan
│   ├── (auth)/             # Celso: sign-in, .edu check, onboarding
│   └── b/[slug]/           # Sticker landing page (Edward)
├── components/
│   ├── ui/                 # shadcn components (shared, don't edit casually)
│   ├── student/
│   ├── business/
│   └── map/
├── lib/
│   ├── supabase/           # Moses: clients and typed queries
│   ├── auth/               # Celso
│   ├── geo/                # Hikaru
│   └── push/               # Hikaru (stretch)
├── mocks/                  # Moses: shared fake data, same shape as real tables
├── supabase/
│   ├── migrations/         # Moses (Celso: RLS policies; Hikaru: deals_nearby)
│   ├── functions/          # Moses: redeem, redeem-pin, issue-code, staff-redeem, claim-club-night, set-pin, add-staff; Hikaru: notify-deal (stretch)
│   └── seed.sql            # Sample data for local and dev databases
├── public/
│   ├── manifest.json       # Hikaru: PWA install settings
│   ├── icons/              # Hikaru: app icons
│   └── sw.js               # Hikaru: service worker for push (stretch)
└── docs/                   # Project context and logs (see below)
```

Anything not marked here (root config, `app/layout.tsx`, `app/page.tsx`, `app/theme/`, `components/ui/`, `lib/utils.ts`, `.github/`) belongs to Moses.
---

## Roadmap

| Phase | Gate to pass |
|---|---|
| 1. Foundation (Oct 19–25): sign-in, foundation, database | Students can log in |
| 2. Core loop and data (Oct 26–Nov 1): scan-to-redeem end to end; repeat days, visibility, club nights in the database | First test redemption (one sticker, two phones); a link-only deal stays out of the feed and map |
| 3. Every remaining feature (Nov 2–8): staff scan, club night screens, deal link and QR, stats | Staff-scan redemption works; a club claims a club night and a member redeems from its link |
| 4. Pilot and demo (Nov 9–15): no new features | First real redemption at a business near UCR |

**Feature freeze at the end of Nov 8.** Anything unfinished then goes to the team to decide: finish quickly or move to the stretch goal, so Week 4 stays light.

Demo date: **TBD**. Week dates assume a demo around Nov 16–20; re-date this table and the team files once it's set. Task-level detail is in `docs/team/<name>.md`.
