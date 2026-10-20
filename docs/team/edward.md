# Edward Van — Student App

> **Session reminder.** Full rules are in `CLAUDE.md` → Session protocol. Your next Claude session starts from this file, so keep it current.
> - **Start:** pull `main`; read `CLAUDE.md`, `docs/STATUS.md`, and this file; catch up on teammates in `docs/LOG.md` and `docs/DECISIONS.md`.
> - **During:** tick tasks here as they finish; record decisions in your section of `docs/DECISIONS.md`.
> - **End:** add a dated Session log entry here and a line in your section of `docs/LOG.md`; commit them with your code.

_Last updated: 2026-10-19_

---

## Role
- **Engineering:** every student screen except the map: feed, deal page, both redemption flows, Redeemed screen, profile, install prompt, sticker landing page. Also the shared Tailwind theme.
- **Business:** student survey; 1–2 customer interviews.
- **Design:** screens 4 (Deals feed), 5 (Deal detail), 6 (Scan), 7 (Redeemed), 8a/8b (No deals, Already used), and 9 (Profile) on the [design canvas](https://claude.ai/artifact/9gApUhQQWpkU2FWTU27K1d). The show-your-code screen isn't drawn yet; build it in the same style. Tokens are in `CLAUDE.md` → Design reference.

## Owns
`app/(student)/` (except `map/`), `app/b/[slug]/`, `components/student/`, Tailwind theme config.

## Depends on
- **Moses:** `mocks/` (day 1–3), real queries (end of week 1), `redeem` (week 2), `issue-code` (week 3).
- **Celso:** signed-in student session.
- **Hikaru:** map tab lives in your tab bar; agree on the deal card component so map bottom sheets and the feed match.

## Others depend on you
- **Adolfo and Hikaru:** the theme (colors, type, card styles) in week 1.

---

## Tasks

### Week 1 — Foundation (Oct 19–25)
- [ ] Tailwind theme from the tokens in `CLAUDE.md` → Design reference (colors, Bricolage Grotesque + Figtree, radii, shadow)
- [ ] App shell with bottom tabs: Map, Deals, Profile
- [ ] Deal card component (shared with Hikaru)
- [ ] Deals feed on mocks: photo, business, title, distance, countdown, "UCR students only" tag
- [ ] Deal detail page with the orange "Redeem in store" button

### Week 2 — Sticker redemption (Oct 26–Nov 1)
- [ ] Scanner page with `html5-qrcode` (not the built-in detector; Safari lacks it)
- [ ] Ask for location before scanning; clear message if denied, with the PIN backup link
- [ ] Call `redeem`; show a friendly message for every `ErrorCode`
- [ ] Redeemed screen: big green check, deal and business name, live ticking clock, moving animation
- [ ] Sticker landing page `/b/[slug]`: live deals, or "No deals right now, follow for alerts"
- [ ] PIN entry screen calling `redeem-pin`
- [ ] Swap mocks for real queries

### Week 3 — Staff mode and profile (Nov 2–8)
- [ ] Show-your-code screen: QR from `issue-code`, refreshes every ~30 s with a countdown, screen stays bright
- [ ] Switch to Redeemed screen when the staff scan lands (Realtime)
- [ ] Profile: name, school, notification toggle, past redemptions, sign out
- [ ] "Add to Home Screen" prompt (needed for iPhone push)

### Week 4 — Polish (Nov 9–15)
- [ ] Test on iPhone Safari and Android Chrome over HTTPS
- [ ] Loading, empty, and offline states
- [ ] Accessibility: contrast, tap targets, screen reader labels

### Business
- [ ] Student survey: how students find food deals now, which apps they check, would they use Grove. Results in the shared Drive folder
- [ ] 1–2 customer interviews; notes in the shared Drive folder

---

## Notes and decisions
_Record things only you need to remember. Team-wide decisions go in `docs/DECISIONS.md`._

---

## Session log
_Newest at the top. One entry per session._

### 2026-10-19
- **Did:** Assigned role.
- **Next:** Theme and app shell once the repo exists.
- **Blockers:** Repo not created yet.
