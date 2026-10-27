# Adolfo Magallanes — Business Dashboard

> Session rules: `CLAUDE.md` → Session protocol. Your next Claude session starts from this file, so keep it current.

_Last updated: 2026-10-26_

---

## Role
- **Engineering:** everything a business owner or staff member sees: onboarding, deal posting, deal list, stats, sticker download, redemption settings, staff scanner, staff list, club nights, deal link and QR.
- **Business:** pilot outreach (sign 2–3 businesses near UCR); 1–2 restaurant interviews and at least one student interview.
- **Design:** screens 10–14 (Overview, Post a deal, My deals, Stats, QR sticker & PIN) on the [design canvas](https://claude.ai/artifact/9gApUhQQWpkU2FWTU27K1d). The staff scanner, redemption mode selector, staff list, post-club-night form, and repeat-days controls aren't drawn yet; build them in the same style. Tokens are in `CLAUDE.md` → Design reference.

## Owns
`app/(business)/`, `components/business/`.

## Depends on
- **Moses:** tables, typed queries, `getClubNights`, and redemption subscriptions are available on main; branch integration waits on #127. Business-write proposals still need review. Real `set-pin` waits on #128's PIN helpers; staff-scan functions and remaining real-data integration follow the week plan.
- **Celso:** business sign-in routing; `business_members` access for staff.
- **Edward:** the deal page at `/deals/<id>`, which your deal link and QR open. (The theme is done; see `/theme`.)
- **Hikaru:** the "I'm here now" button component (week 3), which you place on the dashboard for food trucks.

## Others depend on you
- **Everyone:** real businesses for the week-4 pilot.

---

## Tasks

### Week 1 — Foundation (Oct 19–25)
- [ ] Dashboard layout (desktop sidebar, phone and tablet friendly) (#69) — implemented on mocks; canvas verification pending
- [x] Business onboarding: name, address (sets `location`), hours, logo upload, food-truck toggle; first PIN via `setPin()` (#70) — reviewed and tested on mocks
- [ ] Post-deal form: title, description, discount, start/end, photo, "UCR students only" (#71) — implemented on mocks; canvas verification pending
- [x] My deals list: active, scheduled, expired, with redemption counts; End now and Cancel (mocks) (#72) — implemented on mocks

### Week 2 — Live data, stickers, repeat days (Oct 26–Nov 1)
- [ ] Wire onboarding, posting, and My deals to real tables (#73)
- [ ] Repeat days and visibility on the post-deal form: day checkboxes, daily start/end time, public or link-only (while wiring it to real tables) (#112)
- [ ] Printable sticker: QR of `grove.app/b/<qr_slug>` via `qrcode`, Grove branding, "Scan in the Grove app to redeem," download as PDF or PNG (#74)
- [ ] Overview page: today's and this week's redemptions, active deals, live visit feed via Realtime (#75)

### Week 3 — Stats, settings, staff scanner, club nights (Nov 2–8)
- [ ] Stats: redemptions per deal and busiest hours (Recharts) (#76)
- [ ] Redemption settings: Sticker vs. Staff scan selector; Reset PIN calls `set-pin` and shows the new PIN once (#77)
- [ ] Staff scanner: camera via `html5-qrcode`, calls `staff-redeem`, green "Verified" or red "Not valid" with reason, "Scan next" (#78)
- [ ] Post an open club night: date, time window, giveback text (e.g. "15% back to your club") (#113)
- [ ] Club night results on the dashboard: claimed club name and verified visits per night (#114)
- [ ] Deal link and QR download for flyers and group chats (`/deals/<id>`; it opens the deal only, never redeems) (#115)
- [ ] Staff list in settings: add staff by Google email (`add-staff`), see invited vs. active (`getStaff`), remove staff (#122)

_Feature freeze Nov 8 (see `CLAUDE.md` → Week plan)._

### Week 4 — Pilot, no new features (Nov 9–15)
- [ ] Onboard pilot businesses in person; print and place stickers (#79)
- [ ] Test the dashboard on a phone and a tablet at the counter (#80)
- [ ] Fix or file every issue owners report during the pilot (#81)

### Business
- [ ] Pilot outreach: contact local businesses near UCR, track in the shared Drive folder, aim for 2–3 signed, at least one by Nov 6 for the Week 4 pilot; first deal free for pilot restaurants (#82)
- [ ] 1–2 restaurant interviews (hypotheses 1–4, see `CLAUDE.md` → Business); notes in the shared Drive folder (#83)
- [ ] At least one student interview (hypothesis 5, see `CLAUDE.md` → Business); notes in the shared Drive folder (#116)

---

## Notes and session log

### 2026-10-26
- **Did:** Implemented Sprint 1's mock dashboard, post-deal form, My deals, and business setup (#69-72, PR #126). Prepared review cleanup, 21 isolated tests via `npm test`, and reuse of main's shared `openNow` from merged #131. Lint, typecheck, build, responsive layouts at 320-1440px, posting/onboarding behavioral checks, and WCAG A/AA scans passed. Fresh screenshots were inspected; no source check failures remain.
- **Next:** Merge `origin/main` only after #127 merges, preserving teammates' docs, main's `.gitignore`, and main's contract/types/mocks plus required business writes. Then validate the integrated branch before #73/#112.
- **Blockers/limitations:** #127 remains open; main has not been merged. Canvas access failed, so #69/#71 visual acceptance remains pending. Mocks reset on reload; sample-address lookup supplies coordinates, arbitrary addresses require manual coordinates. Real auth/provisioning, geocoding, Storage, and PIN integration remain #73. Overview metrics (#75), stats, and sticker/PIN settings remain placeholders.
- **Review:** Local preview: `http://127.0.0.1:3001/dashboard`; start with `npm run build` then `npm run start -- --hostname 127.0.0.1 --port 3001`. Check responsive navigation, posting/validation, End now/Cancel confirmations and counts, profile propagation, and one-time PIN visibility. Never record PIN values.
- **Workflow:** Stop before commits or pushes for review. Commit messages use 3-7 lowercase words, simple wording, and no co-author trailer. Keep logs technical and concise.
- **Sanity check:** Ignore rules cover credentials/local state, dependencies, builds, test reports, and Windows metadata; source tests, configuration, and `.env.example` remain trackable. Documentation retains pending canvas/integration work and records no invented research. The requested local ignore additions must be reconciled with Moses's main-version preference during the deferred merge.
