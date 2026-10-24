# Grove

**Where food finds its campus.**

Grove is a marketing company for locally owned restaurants and food trucks near a college campus. Restaurants pay us to bring in students, especially on slow days. The Grove app runs the deals and proves every visit: students redeem in store by scanning the counter sticker. Launching at UC Riverside. Built for CS 175 (Entrepreneurship in Computing), Fall 2026.

**Production:** https://grove-jade.vercel.app

> Working name. "Grove" may be trademarked; see Open decisions in `docs/STATUS.md`.

---

## Getting started

**Requirements:** Node.js 22 (pinned in `.nvmrc`; with [nvm](https://github.com/nvm-sh/nvm), run `nvm install` then `nvm use`), Git, the [Supabase CLI](https://supabase.com/docs/guides/cli), and Docker (only if you run Supabase locally).

**Keys:** Moses shares them through a password manager (Vercel is on the Hobby plan, so teammates can't be added there). Paste them into your own `.env.local`; never send keys in chat, email, or issues.

```bash
git clone git@github.com:MosesfromSinai/Grove.git grove
cd grove
nvm use                      # Node 22
npm install
cp .env.example .env.local   # then paste the values from the password manager; .env.local is git-ignored
npm run dev                  # http://localhost:3000
```

When a key changes, Moses updates the password manager and you update `.env.local`. Before pushing, run `npm run lint`, `npm run typecheck`, and `npm run build`.

**Environment variables:** `.env.example` lists every variable and what it's for, with empty values. Set `NEXT_PUBLIC_SITE_URL=http://localhost:3000` locally.

**Testing on a phone:** camera and location only work over HTTPS. Use the Vercel preview link on your pull request (previews work for everyone), or run `npx ngrok http 3000`.

---

## Docs

| File | What's in it |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Rules, scope, team and ownership, week plan, redemption rules, stack, design reference. Claude Code reads it automatically |
| [`docs/STATUS.md`](docs/STATUS.md) | Where the project is right now: phase, focus, blockers, open decisions |
| [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) | Tables, queries, functions, and error codes; `mocks/` match it |
| [`docs/LOG.md`](docs/LOG.md) | What each person did, plus decisions that affect others |
| `docs/team/<name>.md` | Each person's tasks, notes, and session log |
| `/theme` | Live preview of the design tokens (run the app and open `/theme`) |
