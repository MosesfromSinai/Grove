# Hikaru Shimada — Maps and PWA Install

> Session rules: `CLAUDE.md` → Session protocol. Your next Claude session starts from this file, so keep it current.

_Last updated: 2026-11-12_

---

## Role
- **Engineering:** map, location, "deals near me" queries and filters, food-truck locations, PWA install (manifest and icons). Web Push is a stretch goal.
- **Business:** Lean Canvas, pricing, business model; 1–2 restaurant interviews and at least one student interview.
- **Design:** screens 3 (Map) and 2 (Alerts prompt, a stretch goal with push) on the [design canvas](https://claude.ai/artifact/9gApUhQQWpkU2FWTU27K1d). Tokens are in `CLAUDE.md` → Design reference.

## Owns
`app/(student)/map/`, `components/map/`, `lib/geo/`, `public/manifest.json`, `public/icons/`, the `deals_nearby` SQL function (Moses reviews the migration). Stretch goal: `lib/push/`, `public/sw.js`, `supabase/functions/notify-deal`.

## Depends on
- **Moses:** merged the discovery/truck migration and recorded passing local SQL checks on Nov 9. Hosted migration state still needs confirmation; STATUS has conflicting deployment notes.
- **Edward:** shared student shell/card are on main. #63 is now assigned to Hikaru; the install guide is placed in the student shell in this PR.
- **Adolfo:** dashboard data adapters and truck-button placement are on main.

## Others depend on you
- **Edward:** `getDealsNearby` for the feed (distance and open-now come from your query).
- **Adolfo:** `components/map/truck-location.tsx` is integrated into the dashboard; reuse it while completing #73.

---

## Tasks

### Week 1 — Foundation (Oct 19–25)
- [x] Mapbox token, restricted to our domains; send it to Moses by one-time link (onetimesecret.com) so he adds it to Vercel (#84)
- [x] Map page with mock pins: orange for deals, green for the rest (#85)
- [x] Filter chips: Open now, Has deals, Walking distance (#86)
- [x] Location permission flow; fall back to campus center if denied (#87)

#84 and #85 are closed on GitHub. Moses recorded the canvas-aligned pins on Nov 9. No Mapbox token is stored in this checkout; this session's 100-pin renderer check uses a local blank style, not hosted tiles.

### Week 2 — Real data and link-only deals (Oct 26–Nov 1)
- [x] `deals_nearby` PostGIS function (radius, open now from `hours`, has deals; live now via `deal_status()`, so repeating deals show only in their window) (#88)
- [x] Wire map and filters through the shared mock/real boundary (#89)
- [x] Pin tap opens a bottom sheet: name, open/closed, distance, today's deal using Edward's shared card (#90)
- [x] Hide link-only deals from `deals_nearby` and the map (`visibility = 'public'` only) (#117)

### Week 3 — Food trucks and PWA install (Nov 2–8)

Merged by Moses in #138 and integrated into the dashboard; #94/#119 are closed. Physical installation is tracked separately in #159.
- [x] Food-truck "I'm here now": a button component in `components/map/` that updates the business's `location`; Adolfo places it on the dashboard (#94)
- [x] PWA `manifest.json` and app icons so Grove is installable without push (name, colors from the theme, icons in `public/`) (#119)

_Feature freeze Nov 8 (see `CLAUDE.md` → Week plan)._

### Week 4 — Polish, no new features (Nov 9–15)
- [x] Map stays smooth with 100 test pins; polish (#96). Desktop Chrome/WebGL with local blank style: p95 frame interval 16.8 ms, maximum 16.8 ms over 20 refreshes; zero recreated pins. Reproduce with `npm run test:map-browser`.
- [x] Add to Home Screen guide (#63, reassigned to Hikaru): Safari instructions, browser-provided install action, cancellation/failure fallback, hidden when installed.
- [ ] Complete physical phone installation checks (#159).
  - [x] iPhone: Hikaru reported the PR #162 preview works on their physical iPhone (Nov 12); overall user confirmation, model/iOS and per-step details unspecified.
  - [ ] Android: not tested; still required to finish #159.

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

- `/map` uses `@/lib/supabase` and groups rows by `business_id`. Local default is mocks; Vercel uses `NEXT_PUBLIC_DATA_SOURCE=supabase` per Moses’s Nov 9 log. Setup, test scope, and remaining checks: `components/map/README.md`.
- #84 is closed; preserve the team’s secret-handling rules. No token is included in this change.

---

## Session log

### 2026-11-12 — iPhone follow-up
- **Did:** Recorded Hikaru’s physical-iPhone confirmation in #159 and the sprint docs, on PR #162’s preview. No defect reported; no additional device details or individual checklist results supplied.
- **Next:** Android installation check; #159 stays open until both platforms are covered. Other business and hosted-data follow-ups remain unchanged.


### 2026-11-12
- **Did:** Pulled current main as `hika583`; finished #96 marker reconciliation and accessible marker roles, and #63’s install guide in the shared student shell. Added a separate Vite/Playwright browser fixture, never a production route or auth bypass. Synced stale task ticks to the current GitHub issue states.
- **Verified:** 210 unit tests, 4 browser tests, lint, typecheck and production build pass. Actual Mapbox GL/WebGL renders 100 pins on a locally supplied blank style; 20 center/location refreshes preserve all pin nodes, keyboard focus and current selection callbacks. Desktop p95 frame interval 16.8 ms, max 16.8 ms, max refresh 34 ms. Browser checks cover Safari instructions, install cancellation/rejection, one-shot prompt and installed-mode hiding. The original main renderer failed the keyboard-focus regression in this fixture.
- **Next:** Teammate review/merge; physical iPhone/Android install check #159. Finish business tasks using the shared Drive documents and real interview participants.
- **Blockers:** Physical phone testing is unavailable in this session; no local provider/auth credentials; no Grove/Lean Canvas results in accessible Drive searches. No phone install, hosted database, interviews or hosted tiles verification is claimed. Existing hosted-data notes conflict; Moses should confirm the migration state. Push remains stretch scope. No Codex credits consumed.

### 2026-11-02
- **Did:** Recovered the surviving clean checkout and pulled current main as `hika583`. Built #94’s owner truck-location action plus real owner-profile read, #119’s manifest/PNG/maskable/Apple icons and root metadata, #88’s PostGIS discovery with campus hours and repeat windows, #89’s data-switch wiring, #90’s shared-card bottom sheet, and #117’s explicit public-only join. Added RPC, component, manifest, and pgTAP tests.
- **Verified:** Lint/typecheck and component/data tests; local Chrome fixture confirms bottom-sheet interaction, successful synthetic truck movement and denied-location no-op, refreshed mock map, valid manifest and zero Chrome installability errors. The temporary theme fixture was restored; no auth bypass was committed. SQL/security review fixed an ambiguous coordinate reference and tightened malformed hours.
- **Next:** Moses reviews/applies `20261102000000_nearby_and_truck_location.sql`, runs the pgTAP/DB suites, and regenerates database types. Verify actual map tiles with #84’s restricted token and install on iPhone Safari/Android Chrome over HTTPS.
- **Blockers:** Docker contains active Nanka work; isolated database permission was requested and no database execution is claimed without it. No Supabase credentials or Mapbox token are in this checkout. Real dashboard settings/posting still await Adolfo’s #73; interviews require real participants.
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
