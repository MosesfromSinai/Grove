# Hikaru Shimada — Maps and Notifications

> **Session reminder.** Full rules are in `CLAUDE.md` → Session protocol. Your next Claude session starts from this file, so keep it current.
> - **Start:** pull `main`; read `CLAUDE.md`, `docs/STATUS.md`, and this file; catch up on teammates and their **Decision** lines in `docs/LOG.md`.
> - **During:** tick tasks here as they finish; log decisions that affect others as **Decision** lines in your section of `docs/LOG.md`.
> - **End:** add a dated Session log entry here and a line in your section of `docs/LOG.md`; commit them with your code.

_Last updated: 2026-10-19_

---

## Role
- **Engineering:** map, location, "deals near me" queries and filters, food-truck locations, Web Push from subscription to sending.
- **Business:** Lean Canvas, pricing, business model; 1–2 customer interviews.
- **Design:** screens 2 (Alerts prompt) and 3 (Map) on the [design canvas](https://claude.ai/artifact/9gApUhQQWpkU2FWTU27K1d). Tokens are in `CLAUDE.md` → Design reference.

## Owns
`app/(student)/map/`, `components/map/`, `lib/geo/`, `lib/push/`, `public/sw.js`, `public/manifest.json`, `supabase/functions/notify-deal`, the `deals_nearby` SQL function (Moses reviews the migration).

## Depends on
- **Moses:** `mocks/`, tables (end of week 1).
- **Edward:** deal card component and theme; the install prompt (iPhone push needs it).
- **Adolfo:** where the food-truck location button lives.

## Others depend on you
- **Edward:** `getDealsNearby` for the feed (distance and open-now come from your query).
- **Moses:** `ST_DWithin` pattern for the redemption distance check (share it).

---

## Tasks

### Week 1 — Foundation (Oct 19–25)
- [ ] Mapbox token, restricted to our domains (#84)
- [ ] Map page with mock pins: orange for deals, green for the rest (#85)
- [ ] Filter chips: Open now, Has deals, Walking distance (#86)
- [ ] Location permission flow; fall back to campus center if denied (#87)

### Week 2 — Real data (Oct 26–Nov 1)
- [ ] `deals_nearby` PostGIS function (radius, open now from `hours`, has deals) (#88)
- [ ] Wire map and filters to real data (#89)
- [ ] Pin tap opens a bottom sheet: name, open/closed, distance, today's deal (#90)

### Week 3 — Push and trucks (Nov 2–8)
- [ ] VAPID keys; `manifest.json`; `sw.js` service worker (#91)
- [ ] Subscription flow saving to `push_subscriptions` (#92)
- [ ] `notify-deal`: when a deal goes live, push to subscribed students near the business (decide the radius, log it as a **Decision** in `LOG.md`) (#93)
- [ ] Food-truck location update ("I'm here now") (#94)

### Week 4 — Polish (Nov 9–15)
- [ ] Test push on iPhone (installed to home screen, iOS 16.4+) and Android (#95)
- [ ] Map performance with many pins; polish (#96)

### Business
- [ ] Fill the blank Lean Canvas boxes: Key Metrics, Unfair Advantage, Channels, Cost Structure, Revenue Streams, Project Name (#97)
- [ ] Pricing questions for interviews (per-redemption vs. monthly); summarize answers (#98)
- [ ] 1–2 customer interviews; notes in the shared Drive folder (#99)

---

## Notes and decisions
_Record things only you need to remember. Decisions that affect others go in `docs/LOG.md` as **Decision** lines._

---

## Session log
_Newest at the top. One entry per session._

### 2026-10-19
- **Did:** Assigned role.
- **Next:** Mapbox map on mock pins once the repo exists.
- **Blockers:** Repo not created yet.
