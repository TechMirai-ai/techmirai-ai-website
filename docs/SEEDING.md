# Seeding content: a practical guide

A step-by-step reference for populating this project's database with
content — meant to be followed *while* you're running the commands, not
read once and forgotten. If you're about to run `pnpm seed`, read
section 2 first.

---

## 1. What seeding is

This project's content — the page shells, header/footer nav, booking
services/resources/slots, and so on — isn't typed into `/admin` one field
at a time. It's written once as code (a "seed script": a TypeScript file
that calls Payload's API to create documents) and loaded into the
database by running a command.

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

As of Pack-2/F3, the former clinic-demo seed (`pnpm seed:demo`) has been
retired. `pnpm seed` is now the single real-content entrypoint — it
currently writes empty-but-real page shells and structural placeholders
(not final Spec marketing copy; that arrives in Phase G), rather than a
separate fictional clinic demo.

---

## 2. The golden rule

**`pnpm seed` is DESTRUCTIVE. It deletes leftover legacy content before
writing new content.**

**Never interrupt it once it starts** — no `Ctrl+C`, no closing the
terminal, no killing the process. It clears content first and writes
second; killing it mid-run can leave the site in a broken, half-deleted
state (pages gone, new content never written). If a run does get cut
off, don't try to patch up the partial state by hand — just run the full
command again to completion.

---

## 3. The safety gate

Before touching the database, `pnpm seed` checks five independent
guards, in order:

1. **Build-time no-op** — silently skips during a production build.
2. **CI/auto-trigger blocking** — refuses if `CI`, `VERCEL`,
   `GITHUB_ACTIONS`, or `NETLIFY` is set. This script must never fire as
   a side effect of a deploy or CI run.
3. **`RUN_SEED=true`** — the `pnpm seed` script sets this for you; it
   exists so running `tsx src/seed/index.ts` directly, bypassing the
   pnpm script, still refuses.
4. **Dev-database declaration** — requires `DATABASE_ENV=development` set
   in `apps/techmirai-web/.env.local`. This is a persistent, once-set flag
   distinct from `DATABASE_URI` — it exists specifically so a real
   production connection string (which would never carry this flag) can
   never be seeded into by accident.
5. **Explicit per-run confirmation** — the actual gate you'll hit day to
   day: either the `--confirm` CLI flag or the `SEED_CONFIRM_CLEAR` env
   var, **required on every invocation**. It's deliberately *not*
   something you set once in `.env.local` — it has to be typed each time
   you mean it.

**If you forget the confirmation:** the script refuses safely. It prints
exactly what it *would* delete and exits — nothing is touched.

**The command to actually run it:**

```bash
pnpm seed --confirm
```

Equivalent, if you'd rather use an env var for one invocation:

```bash
SEED_CONFIRM_CLEAR=yes pnpm seed
```

Run either from the repo root — the root `seed` script forwards into
`apps/techmirai-web`.

---

## 4. Step-by-step: seeding for the first time

From a clean checkout:

```bash
pnpm install
cp apps/techmirai-web/.env.example apps/techmirai-web/.env.local
```

Edit `apps/techmirai-web/.env.local` and set, at minimum:

- `DATABASE_URI` — a Postgres connection string for your own dev database.
- `PAYLOAD_SECRET` — any random string (`openssl rand -base64 32`).
- `DATABASE_ENV=development` — **required**, or the seed script will
  refuse to run (guard 4, above).

Then:

```bash
pnpm dev
```

In a second terminal, once the dev server is up:

```bash
pnpm seed --confirm
```

**What success looks like:** the script logs each collection it clears
(nothing on a first-ever run, since there's nothing to clear yet), then
runs quietly while it writes, then ends with:

```
✅ Seed complete.
   Live site: / (home) — also under /en/...
```

If it instead ends with `Seed failed: ...`, nothing after that point was
written — see [Troubleshooting](#8-troubleshooting).

**How to verify it worked:** visit `http://localhost:3000/` and confirm
it loads (header/footer, empty body — real content arrives in Phase G).
Check `/admin`: the `pages` collection should hold one doc per page group
(home, product, solutions, how-it-works, integrations, pricing,
security, about, technology, assessment, faq, privacy, terms,
legal-notice), and `bookable-services`/`resources`/`slots` should be
populated.

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
  below), be aware re-seeding will overwrite those specific documents —
  though every page-group `pages` doc is upserted idempotently (only
  created if missing, never overwritten once it exists), so Phase G
  content entered via `/admin` is safe from a later `pnpm seed` run.

**The safe sequence:**

```bash
# 1. Confirm you're pointed at the right database
echo $DATABASE_URI   # or check apps/techmirai-web/.env.local directly

# 2. If on Neon: open the dashboard and confirm a recent restore
#    point exists, in case you need to roll back

# 3. Run it, and let it finish completely — do not interrupt
pnpm seed --confirm
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

Page shells (the `pages` collection), header/footer nav, and
`bookable-services`/`resources`/`slots` are written by
`apps/techmirai-web/src/seed/*.ts`, orchestrated by `src/seed/index.ts`.
This is what `pnpm seed --confirm` populates and clears. Real page/FAQ/
blog/case-study content is Phase G's job — F3 only built the scaffolding.

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
| Edited via | `/admin`, or reseeded by `seed` | directly editing the `.ts` file |
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

**`pnpm seed --confirm` only clears named legacy collections and exact
page slugs** (see `src/seed/lib/clear.ts`) — Phase G content added via
`/admin` into a `pages` doc that already exists is never touched, since
every page-group module upserts (create-if-missing) rather than
overwrites.

---

## 7. Adding a new client's content

Write real content into the page-group modules under
`apps/techmirai-web/src/seed/pages/` (and `case-studies.ts`/`chat.ts`/
`blog.ts`/`contact.ts` for their respective collections) following the
`upsertBySlug`/`createLocalizedDoc` pattern already there, or enter
content directly via `/admin` — any `pages` doc entered that way survives
future `pnpm seed` runs untouched.

Either way, seeding is only one part of standing up a new client site —
see [docs/DEPLOY-NEW-CLIENT.md](DEPLOY-NEW-CLIENT.md) for the full
deployment checklist (database provisioning, environment variables,
domain, email, LINE, etc.) beyond just this step.

---

## 8. Troubleshooting

**"The homepage/pages are suddenly empty."**
Most likely an interrupted `seed` run — the clear step deleted the old
content but the write step never finished (someone hit Ctrl+C, closed
the terminal, or the process was killed). Recovery: run
`pnpm seed --confirm` again and let it run to completion. It's designed
to be safely re-run — don't try to hand-patch partial state.

**The seed command exits immediately with no changes made.**
Check its own printed error — it's one of the five guards in
[§3](#3-the-safety-gate): missing `--confirm`/env var (prints exactly
what it would have deleted), `RUN_SEED` not set, `DATABASE_ENV` not set
to `development`, or a `CI`/`VERCEL`/`GITHUB_ACTIONS`/`NETLIFY` env var
present in your shell.

**A collection logs "could not delete doc ... (still referenced
elsewhere?), skipping."**
This is expected, handled behavior, not a crash — a document can still
be referenced by a required relationship on another document. The clear
step skips it and warns rather than aborting the whole run; check the
referencing document if the leftover matters. Note: unlike the retired
demo seed, this no longer risks an orphaned duplicate media file on the
next run — `media.ts` reuses an existing file by filename instead of
re-uploading (see docs/ENGINE-FIXES.md's Pack-2/F3 orphan-media entry).

**`pnpm seed:booking` fails.**
It refuses to run against SQLite by design — the booking engine needs
real transactions. Check `DATABASE_URI` points at Postgres; the script's
own error message says so directly.

**Where to look first:** the seed command's own terminal output — it's
intentionally verbose about what it's doing and why it refused, before
checking server/Payload logs elsewhere.
