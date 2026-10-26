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
- **Moses:** `mocks/`, real tables (end of week 1), Realtime on `redemptions` (week 2), `club_nights` and `getClubNights` (week 2, for your week 3 club night screens), `set-pin` (week 2), `staff-redeem`, `getBusinessStats`, `add-staff`, and `getStaff` (week 3).
- **Celso:** business sign-in routing; `business_members` access for staff.
- **Edward:** the deal page at `/deals/<id>`, which your deal link and QR open. (The theme is done; see `/theme`.)
- **Hikaru:** the "I'm here now" button component (week 3), which you place on the dashboard for food trucks.

## Others depend on you
- **Everyone:** real businesses for the week-4 pilot.

---

## Tasks

### Week 1 — Foundation (Oct 19–25)
- [x] Dashboard layout (desktop sidebar, phone and tablet friendly) (#69) — accepted, committed and pushed as `51dfd63` on `adolfo/dashboard-foundation`
- [x] Business onboarding: name, address (sets `location`), hours, logo upload, food-truck toggle; first PIN via `setPin()` (#70) — reviewed and tested on mocks
- [x] Post-deal form: title, description, discount, start/end, photo, "UCR students only" (#71) — pushed in `62534d1`
- [x] My deals list: active, scheduled, expired, with redemption counts; End now and Cancel (mocks) (#72) — pushed in `62534d1`

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

## Notes and decisions
_Record things only you need to remember. Decisions that affect others go in `docs/LOG.md` as **Decision** lines._

- Sprint 1 review order: #69, #71, #72, then #70. Stop after each stage; commits and publishing require Adolfo's explicit approval.
- Keep logs focused on technical outcomes and decisions; do not quote conversation or record approval dialogue.
- Commit messages: 3–7 words, all lowercase, simple wording, and no co-author trailer.
- Publication scope includes the reviewed Sprint 1 work for #69/#70/#71/#72 on the feature branch. No PR, merge, deployment, or next-stage implementation is authorized.
- #69 preview lives at `/dashboard` on `adolfo/dashboard-foundation`. Post a deal, My deals, and Business setup are implemented on mocks; Stats and QR sticker & PIN remain placeholders. Overview metrics and visit feed belong to #75. The sample business is not an authenticated business session.
- #69 preview: `http://127.0.0.1:3000/dashboard`; resize to phone/tablet/desktop, follow navigation links, and test the skip link.
- Checks passed on Node 22.23.4: `npm run lint`, `npm run typecheck`, and `npm run build`. Browser checks passed at 320, 390, 768, 1024, and 1440px (no horizontal overflow; navigation targets at least 44px), all navigation destinations and return links, skip-link focus, and navigation without JavaScript. WCAG A/AA scans at 390 and 1440px reported no violations; no browser page errors. Desktop, tablet, and phone screenshots were inspected.
- The initial sandboxed build failed downloading the existing Google Fonts in `app/layout.tsx`; the network-enabled build passed. No source-code check failures remain. The temporary browser harness and screenshots are outside the repository at `D:/CS175/.tools/dashboard-check/`; no test dependencies or lockfile changes were added to Grove.
- Preview restart (PowerShell from the repo): add `D:/CS175/.tools/node-v22.23.4-win-x64` to this shell's PATH if Node 22 is unavailable, then `npm run start -- --hostname 127.0.0.1`. Rebuild first after code edits.
- The design artifact content could not be retrieved (web access failed; direct content request was challenged). Existing Grove tokens and documented screen descriptions guide the layout. Adolfo accepted the preview; exact canvas matching was not independently verified.
- The business adapter now includes profile/setup, deal management, and PIN operations backed by the existing mocks. Shared types and the contract match the wrappers. These files, validation, the test script, and `package.json` are Moses's area and need his review. #70 configures the demo owner's existing record; real business/member provisioning remains #73.
- #71 photos stay as raster data URLs in mock memory, reset on reload, and are never written to the repository. #73 must upload photos to Storage. Scheduling uses UC Riverside time, including when the device timezone differs; ambiguous/nonexistent daylight-saving times are rejected.
- #71 review: `http://127.0.0.1:3000/dashboard/deals/new`. Try all four discount types; use Start now or schedule a future window, choose an end after the start, optionally upload a JPG/PNG/WebP up to 5 MB, change the eligibility toggle, and save. Check the confirmation, Post another deal, invalid-field feedback, and Cancel (which discards the draft).
- #71 validation passed: full lint, typecheck, production build, and `npm run test:business` (five regression-test groups covering campus time/DST, invalid input, all discounts, shared mock queries, generated fields, and unauthorized writes). Browser checks at 320/390/768/1024/1440px passed with no horizontal overflow or page errors; photo type/size/decode checks, preview, eligibility, Tokyo-device/LA-campus scheduling, duplicate submits, save failure/retry, Cancel/reset, and keyboard focus all passed. Phone error-state, desktop form, and success-state WCAG A/AA scans reported no violations. Screenshots were visually inspected.
- The browser checks found and fixed a #71 bug where Next.js preserved a canceled draft, plus stale field errors after edits. No pre-existing source failures were found. The local #71 browser harness/screenshots are in `D:/CS175/.tools/dashboard-check/`, outside the repo. The reproducible wrapper tests live at `tests/business-post-deal.test.mjs`; no new dependencies or lockfile changes.
- #72 review: `http://127.0.0.1:3000/dashboard/deals`. Check Active/Scheduled/Expired and their counts, End now (keeps history under Expired), Cancel on a scheduled deal with no visits (removes it), Keep deal/Escape in confirmations, and posting a new deal then View my deals. Full reload resets the demo.
- #72 checks passed: full lint, typecheck, production build, and all 12 `npm run test:business` groups. Guards cover ownership, missing/foreign deals, stale status, new redemptions, historical counts, repeat windows, duplicate requests, and club-night references. The initial render-time clock lint failure was caused by the new list and fixed by capturing time during refresh; no pre-existing source failures were found.
- #72 browser checks passed at 320/390/768/1024/1440px with no overflow or page errors: tab counts, link-only rows, keyboard tabs, confirmations/Escape, End now with preserved counts, Cancel/empty state, duplicate actions, load/mutation failure and retry, posting integration across cached navigation, and reload reset. WCAG A/AA scans of desktop/phone lists, confirmation, and empty state found no violations. Desktop/tablet/phone screenshots were inspected. Temporary harness: `D:/CS175/.tools/dashboard-check/my-deals-check.cjs`.
- Sanity audit: checked #69/#71/#72 against their GitHub criteria, local guidance, fresh `origin/main` guidance/migrations/CI, ownership, API shapes, design tokens, ignore rules, and scope. UI accesses data only through `lib/supabase/`; statuses stay computed; the existing theme/components and teammate files are unchanged. No research results or real-business metrics were added.
- Audit corrections: write validation now requires explicit ISO timestamps with valid calendar dates and checks the exact decoded photo size, including base64 padding. Added regression cases that reproduced both defects before the fix. Clarified that business-write contract additions are proposals, not finalized backend APIs, and recorded Moses's shared-file review dependency in STATUS.
- Audit verification passed: lint, typecheck, production build, all 14 regression-test groups, and both post-deal/My-deals browser suites (320–1440px, accessibility, retry, duplicate actions, cached navigation, and mock persistence/reset). No unresolved source check failures remain; CI itself has not run for these uncommitted changes.
- Upstream sync pending: `origin/main` is now `d999191`, 16 commits beyond the checkout's main base. Moses delivered migrations, seed, and required CI; real reads remain blocked until RLS/typed queries land. The project status moved to Phase 2. Those commits have been inspected but not merged; reconcile shared STATUS/LOG and guidance before integration. Continue using mocks until real access and branch integration are ready.
- #70 review: `http://127.0.0.1:3000/dashboard/onboarding` (Business setup). Edit name, select a sample address to fill coordinates, set weekly hours/closed days, upload a logo, and toggle food truck. Save, note the first staff PIN, acknowledge it, then check the sidebar/overview/post-deal identity. Editing the address clears coordinates; arbitrary addresses require manual coordinates. Real geocoding is not implemented.
- #70 PIN flow: profile save and `setPin()` are separate. A PIN failure leaves the profile saved and offers PIN-only retry. Profile reads contain only a readiness flag, never the code. The code clears on acknowledgement or cached navigation; profile edits keep the existing PIN. No PIN values are recorded in logs, screenshots, URL parameters, or browser storage.
- #70 checks passed: lint, typecheck, production build, all 21 regression groups, and all three browser suites. Responsive checks at 320/390/768/1024/1440px and WCAG A/AA scans passed with no overflow or page errors. Covered profile/location/hours/logo/truck persistence, invalid input, overnight/closed hours, duplicate save prevention, profile/PIN failure and retry, PIN hiding, shared identity, Cancel, and reload reset. Desktop/tablet/phone screenshots were inspected after hiding PINs.
- The new integration initially exposed an apostrophe lint error, an optional-id closure type error, and a post-deal confirmation focus-timing regression. All were fixed; the final checks are clean. Shared image validation now serves logos and photos without changing deal upload limits. Temporary browser harness: `D:/CS175/.tools/dashboard-check/business-setup-check.cjs`.

---

## Session log
_Newest at the top. One entry per session._

### 2026-10-26
- **Did:** Completed and reviewed #70's mock business form, profile context and save/lookup wrappers, weekly hours, logo upload, food-truck toggle, and first-PIN flow. Profile changes reach the sidebar, overview, and posting form. Fixed focus timing discovered by regression checks. Lint, typecheck, build, 21 regression groups, and onboarding/posting/My-deals browser suites passed; preview is running.
- **Next:** Resolve shared API review and upstream synchronization before integration. Any PR, merge, deployment, or later-stage implementation needs explicit approval. Future commit messages remain simple, lowercase, 3–7 words, with no co-author trailer.
- **Blockers/limitations:** Sample-address lookup only; arbitrary addresses need entered coordinates. Real provisioning/auth/RLS/geocoding/Storage remain #73. Shared API review (Moses), upstream synchronization, and exact canvas comparison remain pending. Mock state resets on full reload.

### 2026-10-25
- **Did:** Implemented and tested #69's layout, #71's post-deal form, and #72's My deals list on `adolfo/dashboard-foundation`. Added matching mock wrappers, types, contract documentation, and regression tests. Updated my team file, my LOG section, and the Adolfo status entry; removed conversational quotes and approval-dialogue entries from the logs.
- **Stage 1 publication:** Committed and pushed #69 as `51dfd63` (`Add dashboard layout`) to `origin/adolfo/dashboard-foundation`; no PR, merge, deployment, or remote issue mutation.
- **Stage 2 progress:** Implemented the #71 post-deal form, photo/offer preview, campus-time schedule, validation, and save confirmation; added a mock-backed write adapter and matching contract/types. Lint, typecheck, production build, all five regression-test groups, responsive/behavioral browser checks, and accessibility scans passed. Fixed canceled drafts surviving navigation and stale field feedback. Left the local production preview running; #71 remains uncommitted/unpushed.
- **Stage 3 progress:** Implemented My deals tabs/counts, End now and Cancel with confirmation and friendly failures, automatic refresh, and the post-to-list link. The shared wrappers preserve redemption history, reject stale/unauthorized changes, and protect club-night references. Lint, typecheck, build, all 12 regression groups, browser checks, and accessibility scans passed. Preview remains running; #71/#72 are uncommitted/unpushed.
- **Sanity audit:** Fixed ISO timestamp/calendar validation and the precise photo byte limit; all 14 regression groups and both browser suites passed with lint/typecheck/build. Inspected newer upstream migrations/guidance/CI without merging. Flagged shared-file review and branch synchronization; exact canvas matching remains unverified.
- **Stage 2/3 publication:** Committed and pushed #71/#72 and audit fixes as `62534d1` (`add deal posting and management`), using a lowercase five-word message without co-author trailers.
- **Stage 4 progress:** #70 profile form and mock save/lookup helpers implemented. Business context updates existing screens; `setPin()` generates a first PIN after profile save without exposing it through reads. All 21 regression groups passed. Initial lint/typecheck found an unescaped apostrophe and optional-id closure narrowing in the new integration; both corrected. Final checks pending.
- **Next:** Finish #70 checks and stop for review. Upstream synchronization and Moses's shared-file review remain integration dependencies; no merge is authorized. #70 commits/pushes require explicit approval.
- **Blockers/limitations:** Exact canvas matching was not independently verified because artifact content access failed. Mock writes reset on full reload; real data/auth/storage remain #73. Moses should review the shared wrapper, validation, types, contract, package script, and tests. The old repo-creation blocker is resolved.

### 2026-10-19
- **Did:** Assigned role.
- **Next:** Dashboard layout once the repo exists; start pilot outreach list.
- **Blockers:** Repo not created yet.
