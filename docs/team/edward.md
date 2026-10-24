# Edward Van — Student App

> **Session reminder.** Full rules are in `CLAUDE.md` → Session protocol. Your next Claude session starts from this file, so keep it current.
> - **Start:** pull `main`; read `CLAUDE.md`, `docs/STATUS.md`, and this file; catch up on teammates and their **Decision** lines in `docs/LOG.md`.
> - **During:** tick tasks here as they finish; log decisions that affect others as **Decision** lines in your section of `docs/LOG.md`.
> - **End:** add a dated Session log entry here and a line in your section of `docs/LOG.md`; commit them with your code.

_Last updated: 2026-10-24_

---

## Role
- **Engineering:** every student screen except the map: feed, deal page, both redemption flows, Redeemed screen, profile, sticker landing page, club night claim screen (the install prompt is a stretch goal). Also the shared Tailwind theme.
- **Business:** student survey; 1–2 restaurant interviews and at least one student interview.
- **Design:** screens 4 (Deals feed), 5 (Deal detail), 6 (Scan), 7 (Redeemed), 8a/8b (No deals, Already used), and 9 (Profile) on the [design canvas](https://claude.ai/artifact/9gApUhQQWpkU2FWTU27K1d). The show-your-code and claim-club-night screens aren't drawn yet; build them in the same style. Tokens are in `CLAUDE.md` → Design reference.

## Owns
`app/(student)/` (except `map/`), `app/b/[slug]/`, `components/student/`, the theme in `app/globals.css`.

## Depends on
- **Moses:** `mocks/` (day 1–3), real queries (end of week 1), `redeem` (week 2), `claim-club-night` and `getOpenClubNights` (week 2, for your week 3 claim screen), `issue-code` (week 3).
- **Celso:** signed-in student session.
- **Hikaru:** map tab lives in your tab bar; agree on the deal card component so map bottom sheets and the feed match.

## Others depend on you
- **Hikaru:** the deal card component, so map bottom sheets and the feed match. (The theme is done; see `/theme`.)
- **Adolfo:** the deal page at `/deals/<id>`, which his deal link and QR download point to.

---

## Tasks

### Week 1 — Foundation (Oct 19–25)
- [x] Tailwind theme from the tokens in `CLAUDE.md` → Design reference (colors, Bricolage Grotesque + Figtree, radii, shadow) (#48) — done by Moses; preview at `/theme`
- [ ] App shell with bottom tabs: Map, Deals, Profile (#49)
- [ ] Deal card component (shared with Hikaru) (#50)
- [ ] Deals feed on mocks: photo, business, title, distance, countdown, "UCR students only" tag (#51)
- [ ] Deal detail page with the orange "Redeem in store" button (#52)

### Week 2 — Sticker redemption and link-only deals (Oct 26–Nov 1)
- [ ] Scanner page with `html5-qrcode` (not the built-in detector; Safari lacks it) (#53)
- [ ] Ask for location before scanning; clear message if denied, with the PIN backup link (#54)
- [ ] Call `redeem`; show a friendly message for every `ErrorCode` (#55)
- [ ] Redeemed screen: big green check, deal and business name, live ticking clock, moving animation (#56)
- [ ] Sticker landing page `/b/[slug]`: live public deals, or "No deals right now" (#57)
- [ ] PIN entry screen calling `redeem-pin` (#58)
- [ ] Swap mocks for real queries (#59)
- [ ] Hide link-only deals from the feed and the sticker landing page (public deals only) (#108)
- [ ] Open link-only deals from their link: `/deals/<id>` works for public and link-only deals (#109)

### Week 3 — Staff mode, club nights, profile (Nov 2–8)
- [ ] Show-your-code screen: QR from `issue-code`, refreshes every ~30 s with a countdown, screen stays bright (#60)
- [ ] Switch to Redeemed screen when the staff scan lands (Realtime) (#61)
- [ ] Profile: name, school, past redemptions, sign out (#62)
- [ ] Claim a club night: list open club nights, type the club name, claim, then show the link and QR to share with members (#110)

_Feature freeze at the end of Nov 8: anything unfinished goes to the team to decide (finish quickly or move to the stretch goal)._

### Week 4 — Polish, no new features (Nov 9–15)
- [ ] Test on iPhone Safari and Android Chrome over HTTPS (#64)
- [ ] Loading, empty, and error messages on every student screen (no new offline features) (#65)
- [ ] Accessibility: contrast, tap targets, screen reader labels (#66)

### Business
- [ ] Student survey: how students find food deals now, which apps they check, would they use Grove. Results in the shared Drive folder (#67)
- [ ] 1–2 restaurant interviews testing hypotheses 1–4 (slow days, per-visit vs. flat fee, hosting club nights, trusting QR check-in); notes in the shared Drive folder (#68)
- [ ] At least one student interview for hypothesis 5 (students try Grove when a deal reaches them through a club or fraternity they're in); notes in the shared Drive folder (#111)

### Stretch goal (possible future implementation)
- [ ] "Add to Home Screen" prompt (needed for iPhone push) (#63)

---

## Notes and decisions
_Record things only you need to remember. Decisions that affect others go in `docs/LOG.md` as **Decision** lines._

---

## Session log
_Newest at the top. One entry per session._

### 2026-10-19
- **Did:** Assigned role.
- **Next:** Theme and app shell once the repo exists.
- **Blockers:** Repo not created yet.
