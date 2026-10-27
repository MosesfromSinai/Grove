# Hikaru Shimada — Maps and PWA Install

> Session rules: `CLAUDE.md` → Session protocol. Your next Claude session starts from this file, so keep it current.

_Last updated: 2026-10-25_

---

## Role
- **Engineering:** map, location, "deals near me" queries and filters, food-truck locations, PWA install (manifest and icons). Web Push is a stretch goal.
- **Business:** Lean Canvas, pricing, business model; 1–2 restaurant interviews and at least one student interview.
- **Design:** screens 3 (Map) and 2 (Alerts prompt, a stretch goal with push) on the [design canvas](https://claude.ai/artifact/9gApUhQQWpkU2FWTU27K1d). Tokens are in `CLAUDE.md` → Design reference.

## Owns
`app/(student)/map/`, `components/map/`, `lib/geo/`, `public/manifest.json`, `public/icons/`, the `deals_nearby` SQL function (Moses reviews the migration). Stretch goal: `lib/push/`, `public/sw.js`, `supabase/functions/notify-deal`.

## Depends on
- **Moses:** mocks, tables, and `visibility` are on main; real-data wiring waits on `deal_status()` and typed queries.
- **Celso:** RLS policies before browser access to real data.
- **Edward:** deal card component. (The theme is done; the install prompt only matters for push, now a stretch goal.)
- **Adolfo:** places your "I'm here now" button on the dashboard (week 3).

## Others depend on you
- **Edward:** `getDealsNearby` for the feed (distance and open-now come from your query).
- **Adolfo:** the "I'm here now" button component (week 3), which he places on the dashboard.

---

## Tasks

### Week 1 — Foundation (Oct 19–25)
- [ ] Mapbox token, restricted to our domains; send it to Moses by one-time link (onetimesecret.com) so he adds it to Vercel (#84)
- [ ] Map page with mock pins: orange for deals, green for the rest (#85)
- [x] Filter chips: Open now, Has deals, Walking distance (#86)
- [x] Location permission flow; fall back to campus center if denied (#87)

Map code for #85 is implemented on `hikaru/map-foundation` at `/map`, including Mapbox GL JS and a labeled pin preview when tiles are unavailable. Keep #85 open until #84 supplies a restricted token and the actual Mapbox map is checked against canvas screen 3. Local browser checks cover the preview, filters, and synthetic location responses; HTTPS phone testing remains pending.

### Week 2 — Real data and link-only deals (Oct 26–Nov 1)
- [ ] `deals_nearby` PostGIS function (radius, open now from `hours`, has deals; live now via `deal_status()`, so repeating deals show only in their window) (#88)
- [ ] Wire map and filters to real data (#89)
- [ ] Pin tap opens a bottom sheet: name, open/closed, distance, today's deal (#90)
- [ ] Hide link-only deals from `deals_nearby` and the map (`visibility = 'public'` only) (#117)

### Week 3 — Food trucks and PWA install (Nov 2–8)
- [ ] Food-truck "I'm here now": a button component in `components/map/` that updates the business's `location`; Adolfo places it on the dashboard (#94)
- [ ] PWA `manifest.json` and app icons so Grove is installable without push (name, colors from the theme, icons in `public/`) (#119)

_Feature freeze Nov 8 (see `CLAUDE.md` → Week plan)._

### Week 4 — Polish, no new features (Nov 9–15)
- [ ] Map stays smooth with 100 test pins; polish (#96)

### Business
- [ ] Fill the blank Lean Canvas boxes: Key Metrics, Unfair Advantage, Channels, Cost Structure, Revenue Streams, Project Name (#97)
- [ ] Pricing questions for interviews (per verified visit, ~$0.50–1 with a monthly cap, vs. a flat fee for club nights; first deal free for pilots); summarize answers (#98)
- [ ] 1–2 restaurant interviews (hypotheses 1–4, see `CLAUDE.md` → Business); notes in the shared Drive folder (#99)
- [ ] At least one student interview (hypothesis 5, see `CLAUDE.md` → Business); notes in the shared Drive folder (#118)

### Stretch goal (possible future implementation)
- [ ] VAPID keys; `sw.js` service worker for push (#91)
- [ ] Subscription flow saving to `push_subscriptions` (#92)
- [ ] `notify-deal`: when a deal goes live, push to subscribed students near the business (decide the radius, log it as a **Decision** in `LOG.md`) (#93)
- [ ] Test push on iPhone (installed to home screen, iOS 16.4+) and Android (#95)

---

## Notes and decisions
_Record things only you need to remember. Decisions that affect others go in `docs/LOG.md` as **Decision** lines._

- Run locally at `/map`; setup and verification details are in `components/map/README.md`. The page uses the existing contract-compatible `getDealsNearby` mock and groups rows by `business_id`.
- Mapbox token creation and transfer (#84) remain manual: create a domain-restricted token in the Mapbox account, keep it in `.env.local`, and send it to Moses through the agreed one-time link for Vercel. No token is included in this change.

---

## Session log
_Newest at the top. One entry per session._

### 2026-10-25 — publish map foundation
- **Did:** Synced Moses's migrations, seed, and CI from latest main; retained Phase 2 status. Fixed Mapbox marker selection so keyboard focus survives selection. Added component and location regression tests, `npm test`, and CI execution. Publishing the feature branch and PR for team review.
- **Next:** Complete the restricted-token handoff and HTTPS phone/canvas verification, then start the Week 2 query once `deal_status()` and data-access policies land.
- **Blockers:** #84 requires Mapbox account access and Moses's Vercel configuration; #85 remains open for actual map and canvas verification. No production database or provider settings changed.

### 2026-10-25
- **Did:** Built the `/map` Week 1 preview, orange/green grouped pins, combined filters, accessible business list, request-on-tap location, campus fallback, loading/empty/error states, and cleanup for asynchronous requests and map markers. Added four tests for grouping, visibility, combined filters, distant origins, and distance labels. Checked the mobile layout at 390×844 and synthetic location success/denial/unavailable/timeout responses in a local browser.
- **Next:** Supply #84's restricted token, compare the real map to canvas screen 3, and test location on an HTTPS phone preview to finish #85. Week 2 real data waits on Moses's `deal_status()` and typed queries plus Celso's RLS (tables and seed are now on main); the pin bottom sheet waits on Edward's deal card.
- **Blockers:** No Mapbox token in this checkout, no accessible design canvas, no physical-phone or hosted-preview verification yet. The old "repo not created" blocker below is resolved.

### 2026-10-19
- **Did:** Assigned role.
- **Next:** Mapbox map on mock pins once the repo exists.
- **Blockers:** Repo not created yet.
