# Adolfo Magallanes — Business Dashboard

> Session rules: `CLAUDE.md` → Session protocol. Your next Claude session starts from this file, so keep it current.

_Last updated: 2026-11-06_

---

## Role
- **Engineering:** everything a business owner or staff member sees: onboarding, deal posting, deal list, stats, sticker download, redemption settings, staff scanner, staff list, club nights, deal link and QR.
- **Business:** pilot outreach (sign 2–3 businesses near UCR); 1–2 restaurant interviews and at least one student interview.
- **Design:** screens 10–14 (Overview, Post a deal, My deals, Stats, QR sticker & PIN) on the [design canvas](https://claude.ai/artifact/9gApUhQQWpkU2FWTU27K1d). The staff scanner, redemption mode selector, staff list, post-club-night form, and repeat-days controls aren't drawn yet; build them in the same style. Tokens are in `CLAUDE.md` → Design reference.

## Owns
`app/(business)/`, `components/business/`.

## Depends on
- **Moses:** #126/#127/#128/#131/#135/#137 are merged; business-write signatures are final, RLS and `set-pin` are live, and real read/Realtime wrappers exist. `lib/supabase/business.ts` still directly exports mock business writes/profile lookup; #73 must replace these, not just change the environment. Business creation/owner-membership provisioning has no browser insert policy or provisioning function; Storage buckets/policies/upload adapter are absent. Coordinate Grove Test Kitchen membership/access with Moses before hosted tests; never send keys in chat.
- **Celso:** auth routing is merged and the sign-in gate passed. Business updates are owner-only; members can manage deals. Browser profile edits may change only `full_name`, never role or verification. Use provisioned membership; do not self-assign roles.
- **Edward:** the deal page at `/deals/<id>`, which your deal link and QR open. (The theme is done; see `/theme`.)
- **Hikaru:** draft #138 contains the truck-location component and `deals_nearby`; neither is on main yet. Coordinate the dashboard placement after merge.

## Others depend on you
- **Everyone:** real businesses for the week-4 pilot.

---

## Tasks

### Week 1 — Foundation (Oct 19–25)
- [x] Dashboard layout (desktop sidebar, phone and tablet friendly) (#69) — canvas compared and responsive/keyboard checks passed locally; local commit approved, publication pending
- [x] Business onboarding: name, address (sets `location`), hours, logo upload, food-truck toggle; first PIN via `setPin()` (#70) — reviewed and tested on mocks
- [x] Post-deal form: title, description, discount, start/end, photo, "UCR students only" (#71) — canvas compared; mock posting and responsive/keyboard checks passed locally; local commit approved, publication pending
- [x] My deals list: active, scheduled, expired, with redemption counts; End now and Cancel (mocks) (#72) — implemented on mocks

### Week 2 — Live data, stickers, repeat days (Oct 26–Nov 1)
- [ ] Wire onboarding, posting, and My deals to real tables (#73)
- [ ] Repeat days and visibility on the post-deal form: day checkboxes, daily start/end time, public or link-only (while wiring it to real tables) (#112)
- [ ] Printable sticker: QR of the configured app origin + `/b/<qr_slug>` via `qrcode`, Grove branding, "Scan in the Grove app to redeem," download as PDF or PNG (#74)
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

### 2026-11-06
- **Did:** Fast-forwarded clean main to `7daf9ed`; created `adolfo/dashboard-review`, preserving the foundation branch. Read Moses's Nov 4 checklist (general instructions, pp. 5–7), current issues/comments, PRs, and contract. Canvas loaded in Edge. Aligned shell branding/navigation/guidance and screen 11's title counter, discount radios, split schedule, photo browse/drop area, UCR switch, primary action, and preview with existing tokens/components.
- **Verified:** `npm run lint`, `npm run typecheck`, `npm test` (66 passed, 21 DB tests skipped), and `npm run build` passed. Mock browser checks at 320/390/768/1024/1440px; six WCAG A/AA scans; keyboard skip/radios/switch; title limit; photo preview; mock posting and My deals. Inspected desktop/tablet/phone screenshots. Five component regressions cover campus scheduling, invalid-window focus, discounts, failed saves, and preview state. Tests use loopback auth and mocks, not grove-dev; physical devices/hosted integration remain untested.
- **Intentional canvas differences:** keep demo wording and Business setup navigation; no invented owner name, distance, sample photo, or live countdown. Preview shows the selected schedule/duration. Push alerts remain stretch; all redemptions require verified students. Existing WebP/5 MB validation and campus DST rejection remain. Overview totals/feed remain #75, outside this shell check.
- **Shared review:** Moses should review the root `lib/supabase/index.ts` re-export of existing business adapters. Components now use `@/lib/supabase`; writes/profile lookup are still mock-backed. No API shape, mock, migration, policy, or function changes.
- **Next:** Adolfo authorized this local commit; defer pushing until larger chunks are ready. Keep feature checkpoints and branches scoped. Next is #73/#112 together, then #74, #75; Week 3: #77, #113, #114, #115, #76 (#21), #78 (#20), #122 (#121). Recheck dependencies; fetch/merge main and verify checks/CI when publication is authorized.
- **Local files:** keep downloaded tools and review artifacts outside Grove when possible. Use existing ignores or narrow `.git/info/exclude` patterns locally; propose targeted team-wide `.gitignore` changes for review. Before each commit inspect `git status --short` and `git diff --cached --name-only`, stage explicit intended paths, and flag tracked local artifacts before removing them from version control.
- **Integration needs:** provisioned owner membership, authorized Test Kitchen access, Storage buckets/policies/uploads, and real business-write/profile adapters. `qr_slug` is SQL-readable but missing from `BusinessProfile` (#74). SQL permits owner redemption-mode changes, member club-night writes, and owner deletion of staff, but dashboard wrappers are missing. #20/#21/#121 remain open. LOG's original Test Kitchen deal ended Nov 4; coordinate current test data with Moses. Do not deploy migrations/functions or send keys in chat.

### 2026-10-26
- **Did:** Implemented Sprint 1's mock dashboard, post-deal form, My deals, and business setup (#69-72, PR #126). Prepared review cleanup, 21 isolated tests via `npm test`, and reuse of main's shared `openNow` from merged #131. Lint, typecheck, build, responsive layouts at 320-1440px, posting/onboarding behavioral checks, and WCAG A/AA scans passed. Fresh screenshots were inspected; no source check failures remain.
- **Next:** Merge `origin/main` only after #127 merges, preserving teammates' docs, main's `.gitignore`, and main's contract/types/mocks plus required business writes. Then validate the integrated branch before #73/#112.
- **Blockers/limitations:** #127 remains open; main has not been merged. Canvas access failed, so #69/#71 visual acceptance remains pending. Mocks reset on reload; sample-address lookup supplies coordinates, arbitrary addresses require manual coordinates. Real auth/provisioning, geocoding, Storage, and PIN integration remain #73. Overview metrics (#75), stats, and sticker/PIN settings remain placeholders.
- **Review:** Local preview: `http://127.0.0.1:3001/dashboard`; start with `npm run build` then `npm run start -- --hostname 127.0.0.1 --port 3001`. Check responsive navigation, posting/validation, End now/Cancel confirmations and counts, profile propagation, and one-time PIN visibility. Never record PIN values.
- **Workflow:** Stop before commits or pushes for review. Commit messages use 3-7 lowercase words, simple wording, and no co-author trailer. Keep logs technical and concise.
- **Sanity check:** Ignore rules cover credentials/local state, dependencies, builds, test reports, and Windows metadata; source tests, configuration, and `.env.example` remain trackable. Documentation retains pending canvas/integration work and records no invented research. The requested local ignore additions must be reconciled with Moses's main-version preference during the deferred merge.
