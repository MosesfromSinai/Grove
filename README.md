# Grove

**Where food finds its campus.**

Grove is a campus marketing platform. Locally owned restaurants and food trucks near a college campus post deals, and Grove puts them in front of verified students nearby. Students redeem in store by scanning a QR code, so businesses can see exactly which customers Grove brought in.

We are launching at UC Riverside. Built for CS 175 (Entrepreneurship in Computing), Fall 2026.

> Working name. "Grove" may be trademarked; see `docs/DECISIONS.md`.

---

## Team

| Person | Engineering role |
|---|---|
| Moses Avila | Backend and redemption engine |
| Celso Lopez | Security and auth |
| Edward Van | Student app |
| Adolfo Magallanes | Business dashboard |
| Hikaru Shimada | Maps and notifications |

---

## MVP features

1. **Deal posting:** businesses post deals from a dashboard.
2. **Deal feed and map:** students browse nearby deals with filters (open now, has deals, distance).
3. **.edu verification:** Google sign-in plus a school email check.
4. **Scan to redeem:** two modes, chosen by each business (below).
5. **Business dashboard:** redemptions per deal and by hour, live visit feed.
6. **Push notifications:** students nearby get an alert when a deal is posted.

**Out of scope for the MVP:** rewards points, squad deals, club fundraisers, leaderboards, menu import and dish search, Instagram posting, payment-system (Square, Toast) links, billing, native apps.

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
| App | Next.js (App Router) + React + TypeScript, installable PWA |
| Hosting | Vercel (preview deploy for every pull request) |
| Database, auth, storage, server functions | Supabase (Postgres + PostGIS, Auth, Storage, Edge Functions, Realtime) |
| Map | Mapbox GL JS |
| QR | `qrcode` (generate stickers), `html5-qrcode` (scan in browser) |
| Notifications | Web Push (VAPID) |
| Email | Resend |
| UI | Tailwind CSS + shadcn/ui, Recharts for charts |
| Errors | Sentry |
| Project tracking | GitHub Projects |

---

## Getting started

**Requirements:** Node.js 20+, Git, the [Supabase CLI](https://supabase.com/docs/guides/cli), and Docker (only if you run Supabase locally).

```bash
git clone <repo-url> grove
cd grove
npm install
cp .env.example .env.local   # then fill in the values (ask Moses)
npm run dev                  # http://localhost:3000
```

### Environment variables

| Variable | Where it's used
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser and server 
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser and server 
| `SUPABASE_SERVICE_ROLE_KEY` | Server and Edge Functions only
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Map 
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Push subscription 
| `VAPID_PRIVATE_KEY` | Sending push 
| `RESEND_API_KEY` | Email 

### Testing on a phone

Camera and location only work over HTTPS. Use the Vercel preview link from your pull request, or run `npx ngrok http 3000`. On iPhone, push notifications only work after adding Grove to the home screen (iOS 16.4+).

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
│   └── push/               # Hikaru
├── mocks/                  # Moses: shared fake data, same shape as real tables
├── supabase/
│   ├── migrations/         # Moses (Celso: RLS policies; Hikaru: deals_nearby)
│   ├── functions/          # Moses: redeem, redeem-pin, issue-code, staff-redeem; Hikaru: notify-deal
│   └── seed.sql            # Sample data for local and dev databases
├── public/
│   ├── manifest.json       # Hikaru: PWA install settings
│   └── sw.js               # Hikaru: service worker for push
└── docs/                   # Project context and logs (see below)
```
---

## Roadmap

| Phase | Gate to pass |
|---|---|
| 1. Foundation (Oct 19–25) | Students can log in |
| 2. Core loop (Oct 26–Nov 1) | First test redemption (one sticker, two phones) |
| 3. Staff mode, push, stats (Nov 2–8) | Staff-scan redemption works; test push arrives on iPhone and Android |
| 4. Pilot and polish (Nov 9–15) | First real redemption at a business near UCR |

Demo date: **TBD**. Week dates assume a demo around Nov 16–20; re-date this table and the team files once it's set. Task-level detail is in `docs/team/<name>.md`.
