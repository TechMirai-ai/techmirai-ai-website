# Seeding content: a practical guide

A step-by-step reference for populating this project's database with
content — meant to be followed *while* you're running the commands, not
read once and forgotten. If you're about to run `pnpm seed:demo`, read
section 2 first.

---

## 1. What seeding is

This project's demo/starter content — the homepage, services, team,
doctors, FAQs, news, and so on — isn't typed into `/admin` one field at a
time. It's written once as code (a "seed script": a TypeScript file that
calls Payload's API to create documents) and loaded into the database by
running a command.

Why go through code instead of just clicking around in the CMS:

- **Reproducible.** Anyone on the team (or a fresh clone, or CI) gets the
  exact same content by running the same command.
- **Git-tracked.** Content changes show up in `git diff` and code review,
  the same as any other code change.
- **Recoverable.** If the database is wiped, reset, or a new environment
  is provisioned, the content comes back by re-running the script.
  Content typed only into `/admin` has none of these properties — it
  lives only in that one database, and if that database is lost, so is
  the content.

---

## 2. The golden rule

**`pnpm seed:demo` is DESTRUCTIVE. It deletes existing content before
writing new content.**

**Never interrupt it once it starts** — no `Ctrl+C`, no closing the
terminal, no killing the process. It clears content first and writes
second; killing it mid-run can leave the site in a broken, half-deleted
state (pages gone, new content never written). If a run does get cut
off, don't try to patch up the partial state by hand — just run the full
command again to completion.

This project's own internal history doc
([docs/ai-receptionist.md §5](ai-receptionist.md)) looked for evidence of
a specific past incident behind this guard and **found none** — the
`--confirm` gate and CI-blocking predate this repo's earliest commit, and
the code comments describe the risk in preventive language, not as an
account of something that already happened. So: treat this as a real,
deliberately-designed safety mechanism against a real class of risk
(interrupted destructive runs), not as a story about one specific
incident — the mechanism is what matters, not a fabricated history for
it.

This is why the safety gate below exists.

---

## 3. The safety gate

Before touching the database, `pnpm seed:demo` checks four independent
guards, in order:

1. **Build-time no-op** — silently skips during a production build.
2. **CI/auto-trigger blocking** — refuses if `CI`, `VERCEL`,
   `GITHUB_ACTIONS`, or `NETLIFY` is set. This script must never fire as
   a side effect of a deploy or CI run.
3. **Dev-database declaration** — requires `DATABASE_ENV=development` set
   in `apps/techmirai-web/.env.local`. This is a persistent, once-set flag
   distinct from `DATABASE_URI` — it exists specifically so a real
   production connection string (which would never carry this flag) can
   never be seeded into by accident.
4. **Explicit per-run confirmation** — the actual gate you'll hit day to
   day: either the `--confirm` CLI flag or the `SEED_DEMO_CONFIRM_CLEAR`
   env var, **required on every invocation**. It's deliberately *not*
   something you set once in `.env.local` — it has to be typed each time
   you mean it.

**If you forget the confirmation:** the script refuses safely. It prints
exactly what it *would* delete (which pages, which collections, how it
identifies "demo" content) and exits — nothing is touched.

**The command to actually run it:**

```bash
pnpm seed:demo --confirm
```

Equivalent, if you'd rather use an env var for one invocation:

```bash
SEED_DEMO_CONFIRM_CLEAR=yes pnpm seed:demo
```

Run either from the repo root — the root `seed:demo` script forwards
into `apps/techmirai-web`.

---

## 4. Step-by-step: seeding for the first time

From a clean checkout:

```bash
pnpm install
cp apps/techmirai-web/.env.example apps/techmirai-web/.env.local
```

Edit `apps/techmirai-web/.env.local` and set, at minimum:

- `DATABASE_URI` — `file:../../.data/local.db` works out of the box for
  local dev (SQLite). No setup needed.
- `PAYLOAD_SECRET` — any random string (`openssl rand -base64 32`).
- `DATABASE_ENV=development` — **required**, or the seed script will
  refuse to run (guard 3, above).

Then:

```bash
pnpm dev
```

In a second terminal, once the dev server is up:

```bash
pnpm seed:demo --confirm
```

**What success looks like:** the script logs each collection it clears
(nothing on a first-ever run, since there's nothing to clear yet), then
runs quietly while it writes, then ends with:

```
✅ Seed complete.
   Live site: / (home), /services, /contact, /faq — also under /en/...
   Secondary preview page: /demo-about
```

If it instead ends with `Seed failed: ...`, nothing after that point was
written — see [Troubleshooting](#8-troubleshooting).

**How to verify it worked:** visit the routes the script just printed —
`http://localhost:3000/`, `/services`, `/faq` — and confirm they're
populated (hero content, service cards, team members, FAQ entries) rather
than empty or default placeholder frames. Check `/admin` too: the
`services`, `doctors`, `team`, `faqs`, and `news` collections should each
have several `demo-`-slugged documents.

---

## 5. Step-by-step: re-seeding an existing project

This is the more dangerous case, because there's already content to
lose.

**Before running anything destructive:**

- This project currently has **no automated database backup.** If you're
  on the shared Neon Postgres dev database, the manual fallback is
  Neon's own dashboard — check that a recent restore point exists
  *before* you run the confirm-gated command, not after something goes
  wrong.
- If anyone has made manual edits through `/admin` to content that the
  seed script also manages (see [§6c](#6-where-content-actually-lives)
  below), be aware re-seeding will overwrite those specific documents.
  If those edits matter, capture them (screenshot, copy the text out)
  before proceeding.

**The safe sequence:**

```bash
# 1. Confirm you're pointed at the right database
echo $DATABASE_URI   # or check apps/techmirai-web/.env.local directly

# 2. If on Neon: open the dashboard and confirm a recent restore
#    point exists, in case you need to roll back

# 3. Run it, and let it finish completely — do not interrupt
pnpm seed:demo --confirm
```

Then verify the same way as in section 4.

---

## 6. Where content actually lives

This project has **three different content sources.** Mixing them up
causes real bugs — most commonly, editing something in `/admin` that a
reseed will later silently overwrite, or editing something that looks
like "the FAQ content" but has zero effect on the thing you're trying to
change.

### a. Database-seeded content (via seed scripts)

Homepage, services, team, doctors, news, blog, testimonials, downloads,
and the `faqs` **collection** (which backs the public `/faq` page) are
all written by `apps/techmirai-web/src/seed/demo/*.ts`, orchestrated by
`demo/index.ts`. This is what `pnpm seed:demo --confirm` populates and
clears.

### b. Static code files (not the database at all)

**The reception chat widget's FAQ content** —
`packages/cms-core/src/verticals/clinic/reception/faq-content.ts` — is a
plain TypeScript array, not a database table. It powers the chat
widget's button answers, its fuzzy free-text matching, and what the AI
fallback is allowed to ground answers in. Editing it takes effect
immediately on next reload; no seed command involved.

**This is easy to confuse with (a)'s `faqs` collection**, since both are
called "FAQ content" and both exist in this same project — but they are
completely separate and don't affect each other:

| | `faqs` collection (DB) | `faq-content.ts` (static file) |
|---|---|---|
| Powers | the public `/faq` page | the reception chat widget only |
| Edited via | `/admin`, or reseeded by `seed:demo` | directly editing the `.ts` file |
| Effect of editing the other one | none | none |

See [docs/ai-receptionist.md §4](ai-receptionist.md) for the full
breakdown of how `faq-content.ts` feeds the widget's three tiers.

**Known exception, unrelated to the above:** two spots in
`services-grid/component.tsx` (the symptom cards and the bottom CTA) are
currently hardcoded directly in the component rather than sourced from
either the CMS or a content file — a known gap tracked in
[README.md §7 "Known gaps"](../README.md), not yet wired to a proper CMS
field.

### c. CMS admin-panel edits

Content typed directly into Payload's `/admin` UI lives only in the
database — same storage as (a), but not tracked anywhere in code. This
creates a real drift risk: a seed script's idea of what a document should
contain and what's actually live in the database can quietly diverge the
moment someone edits through `/admin` without also updating the seed
script.

**Reseeding always wins.** `pnpm seed:demo --confirm` clears every
`demo-`-slugged document before rewriting it — any manual `/admin` edit
made to one of those specific documents is gone the next time someone
reseeds, with no warning beyond the confirm prompt itself.

---

## 7. Adding a new client's content

Two different situations use different mechanisms here — worth being
precise about which one applies:

- **Iterating on this template's own demo/placeholder clinic** (e.g.
  improving what a sales demo shows): edit the relevant files under
  `apps/techmirai-web/src/seed/demo/`, then run `pnpm seed:demo --confirm`
  and verify per section 4/5 above.
- **Onboarding an actual new client:** `pnpm seed:demo` is specifically
  the demo/placeholder pathway (fictional clinic content, `demo-`
  prefixed slugs) — reusing it for a real client would seed placeholder
  content, not the client's real content. The documented path for real
  content is `apps/techmirai-web/src/seed/index.ts` (`pnpm seed`), which
  currently ships as a stub meant to be filled in following the pattern
  in `demo/index.ts`, or entering content directly via `/admin`.

Either way, seeding is only one part of standing up a new client site —
see [docs/DEPLOY-NEW-CLIENT.md](DEPLOY-NEW-CLIENT.md) for the full
deployment checklist (database provisioning, environment variables,
domain, email, LINE, etc.) beyond just this step.

---

## 8. Troubleshooting

**"The homepage/services/FAQ page is suddenly empty."**
Most likely an interrupted `seed:demo` run — the clear step deleted the
old content but the write step never finished (someone hit Ctrl+C,
closed the terminal, or the process was killed). Recovery: run
`pnpm seed:demo --confirm` again and let it run to completion. It's
designed to be safely re-run — don't try to hand-patch partial state.

**The seed command exits immediately with no changes made.**
Check its own printed error — it's one of the four guards in
[§3](#3-the-safety-gate): missing `--confirm`/env var (prints exactly
what it would have deleted), `DATABASE_ENV` not set to `development`, or
a `CI`/`VERCEL`/`GITHUB_ACTIONS`/`NETLIFY` env var present in your shell.

**A collection logs "could not delete demo doc ... (still referenced
elsewhere?), skipping."**
This is expected, handled behavior, not a crash — a demo document can
still be referenced by a required relationship on another document (e.g.
a news item's thumbnail). The clear step skips it and warns rather than
aborting the whole run; check the referencing document if the leftover
matters.

**`pnpm seed:booking` fails.**
It refuses to run against SQLite by design — the booking engine needs
real transactions. Check `DATABASE_URI` points at Postgres; the script's
own error message says so directly.

**Where to look first:** the seed command's own terminal output — it's
intentionally verbose about what it's doing and why it refused, before
checking server/Payload logs elsewhere.
