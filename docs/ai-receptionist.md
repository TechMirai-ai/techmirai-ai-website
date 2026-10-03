# The AI Receptionist (Hybrid Reception Widget)

A deep-dive for a new developer on the reception chat widget — the newest and
most complex feature in this codebase. For exact technical mechanics (node
types, exact thresholds, exact guard order), see
[ARCHITECTURE.md §9](../ARCHITECTURE.md#9-reception-system-hybrid-fsm--ai-fallback)
(the system's mechanism), [§10](../ARCHITECTURE.md#10-faq-content-system) (the
FAQ content file), and [§11](../ARCHITECTURE.md#11-seed-safety-mechanism) (the
seed guard, referenced below). This document exists to explain the *why* and
the *history* that a source-code read and ARCHITECTURE.md deliberately don't
cover.

---

## 1. What it is

**From a visitor's perspective:** a chat bubble opens on the site (after a
short delay) with a greeting and a menu of buttons — book an appointment,
ask an FAQ, manage an existing booking. Picking "FAQ" shows six more buttons
(hours, access, parking, prices, what to bring, first visit) that answer
instantly with pre-written text. If none of those fit, there's an "ask
something else" option that opens a free-text box. Type a question there and
one of three things happens: it matches one of the same six canned answers
and shows it, it's answered by a short AI-generated reply grounded in the
clinic's real content, or — if it looks like a medical question or is
off-topic — the visitor gets a fixed message pointing them to call the
clinic or a "talk to staff" link to the clinic's LINE account. Nothing about
the free-text path ever leaves the visitor without a path forward.

**From a developer's perspective:** a three-tier hybrid, each tier a
fallback for the one above it:

1. **Deterministic button flow** — a finite state machine (FSM) walking a
   fixed graph of nodes. Free, instant, cannot be wrong.
2. **Fuzzy static matching** — free-text input is matched against a
   35-entries-wide (10 matchable) FAQ corpus with `fuse.js`. Also free and
   instant; reuses the same canned answers as tier 1.
3. **LLM fallback** — only for text that doesn't match anything in tier 2
   and passes two screening checks: a real network call to Groq, grounded in
   the site's own content, wrapped in guardrails.

The three tiers exist because each one is *cheaper and more reliable* than
the one below it — the design deliberately tries to answer as much as
possible without ever calling an LLM.

---

## 2. Why it was built this way

### The hybrid design itself

The buttons-first structure predates the AI-fallback work entirely — the
menu-driven FAQ flow (`flow.ts`) already existed and was, in fact, built on
an explicit engineering principle carried over from the booking flow: "a
calendar grid beats a conversation for choosing a time, always" (found in
`docs/STEP2-LINE-CATALOGUE.md`'s recovered text, Part 1 — see §6 History for
where that document lives now). The same instinct applies here: a button is
faster, cheaper, and unambiguous compared to typing, so the FSM does as much
of the work as it can before ever falling to free text.

`fuse.js` sitting in the middle wasn't a new dependency pulled in for this —
it was already installed and used for the site's own search box before this
feature existed. Reusing it for FAQ matching meant a whole tier of the
hybrid was free to add, both in dependency cost and design risk.

**The LLM is intentionally the last resort, not the first responder.** It's
the only tier with real latency, real cost, and any chance of an off-brand
answer — everything upstream of it exists specifically to shrink how often
it's ever called.

### The "two-screenshot design concept"

I searched code comments, message catalogs, and the recovered planning docs
(§6) for any trace of an original two-screenshot design brief that might
have shaped this hybrid approach, including the diffs of the commits that
built it. **I found no reference to it anywhere in this codebase or its git
history.** The only hits for the literal word "screenshot" are unrelated UI
copy (`screenshotHint` — a booking-confirmation-card message telling
patients to screenshot their booking card, in `messages/en.json`/`ja.json`).
If such a design concept existed, it lived outside this repository (a chat
thread, a doc elsewhere, a verbal brief) — flagging this rather than
guessing at what it might have shown.

### Proxy vs. direct SDK — a real, resolved decision

Before this feature was built, the app already had two unused routes:
`POST /api/ai/query`, which proxies requests to an external agent
microservice via `AI_AGENT_BASE_URL`, and `GET /api/ai/corpus`, a
bearer-token-gated endpoint that compiles CMS content for an external
consumer. Both still exist in the codebase today, both still unwired to any
frontend.

The build chose **not** to route through that proxy. This is stated
explicitly in the shipped code, not just inferred — `ai/groq.ts`'s header
comment:

> "Deliberately NOT routed through `/api/ai/query -> AI_AGENT_BASE_URL`,
> which proxies to an external agent service that does not exist for this
> deployment."

and the same sentence, near-verbatim, in `apps/clinic-demo/src/app/api/
reception/ai/route.ts`'s own header comment. Instead, `ai/groq.ts` makes a
direct `fetch` POST to Groq's own OpenAI-compatible endpoint — no SDK, no
intermediate service, no dependency on infrastructure that was never stood
up. The `/api/ai/query` and `/api/ai/corpus` routes were left in place,
untouched (see §5 for why that's a risk worth knowing about).

### "Talk to staff" — no lead-saving, and why isn't fully recoverable

Two real options existed for what should happen when a visitor gives up and
clicks "talk to staff": either extend `reception-engine`'s own (at the time,
never-yet-used) `capture`/`handoff` node types to save a lead from inside
the chat state machine itself, or reuse the site's existing, proven contact
pipeline (`POST /api/forms/[type]` → the `form-submissions` collection →
a Resend email hook) that the contact form already uses successfully.

**What actually shipped is neither.** "Talk to staff" is a plain link node
that opens the clinic's LINE URL (`site.config.ts` →
`reception.staffLineUrl`) in a new tab. No record is created anywhere in the
CMS when a visitor takes this path — see §5 for the practical consequence.

I could not find any code comment, commit message, or planning document
explaining *why* the simpler no-lead-saving option was chosen over either of
the two that had actually been scoped out in advance. It may well be a
reasonable call (LINE itself becomes the record — the clinic sees the
conversation directly in their LINE account once the visitor messages them)
— but that reasoning, if it existed, isn't recoverable from what's in this
repository. Flagging this rather than inventing a rationale.

### Guardrails as graph structure, not prompt instructions

The medical-refusal path is a **flow-graph node** (`refusal.medical`), not a
line in a system prompt. This predates the AI-fallback work — the original
menu-only flow already routed an "other" button straight to this same node,
with the flow's own comment (`flow.ts`) noting explicitly that a menu-driven
flow has no free-text path at all, so there was never a way to "smuggle" a
symptom question in as an answer in the first place. When free text was
added, the same principle was extended rather than replaced: `screening.ts`
decides medical-or-not with regex *before* anything reaches an LLM, and the
graph — not the model — enforces where that routes to.

This matters because a purely prompt-based guardrail ("please don't give
medical advice") can be argued around by a sufficiently motivated visitor
crafting their input. A structural guardrail — the code branches to a fixed
node and the LLM is never even called — can't be talked out of its own
behavior, because there's no behavior to talk out of; the decision already
happened before the model saw anything.

---

## 3. How it works

A visitor's free-text question traces through the system like this (see
ARCHITECTURE.md §9 for exhaustive detail on every step — this is the
narrative version):

1. **The widget mounts** client-side. `ui/useReceptionEngine.ts` drives
   `packages/reception-engine`'s pure `start()`/`advance()` functions
   against `flow.ts`'s `clinicReceptionFlow` graph — all of this runs in the
   browser, no network call yet.
2. **Button path:** each tap calls `advance()` with the chosen option;
   the engine returns the next node's message(s). This is the whole
   interaction for most visitors — no server round-trip at all beyond the
   page load.
3. **Free-text path:** typing into "ask something else" reaches
   `faq.ask.triage`, a `triage` node. The engine hands the raw text to a
   host-supplied resolver (`triage.ts`'s `createClinicTriageResolver`) and
   only follows whichever of three graph-declared destinations that
   resolver names back.
4. **Inside the resolver, in order:**
   - `screening.ts`'s medical check runs first. A match short-circuits
     straight to `refusal.medical` — the FAQ matcher and the LLM are never
     reached at all (confirmed directly by `triage.test.ts`: a query that
     mentions parking *and* a medical symptom still refuses, because
     medical is checked before matching is even attempted).
   - Otherwise, `faq-matcher.ts`'s `fuse.js` resolver runs against a
     10-entry subset of `faq-content.ts`. A confident match returns that
     FAQ node's id directly — the visitor sees the exact same text a button
     would have shown them.
   - No confident match → the resolver returns `{ kind: 'ai' }`, and the
     graph routes to `faq.ai`.
5. **The AI-fallback node triggers a real request** to
   `apps/clinic-demo/src/app/api/reception/ai/route.ts` — the only server
   route in this whole system, because it's the only step needing the Groq
   API key kept off the client. `ai/handler.ts` runs, in order: feature
   gate → rate limit (5 req/60s/IP, its own bucket, separate from the
   contact form's) → Zod validation (500-char cap) → off-topic screening
   (a second, separate check from the medical one — a denylist covering
   code requests, trivia, and prompt-injection phrasing) → corpus assembly
   (`ai/corpus.ts`, a token-budgeted, priority-ordered pull from FAQs,
   services, pages, team, and company info) → the actual Groq call.
6. **`ai/groq.ts`** POSTs directly to Groq's chat-completions endpoint. Every
   possible failure — missing key, rate-limited, timeout, malformed
   response — comes back as a typed value, never a thrown exception, so the
   caller always has exactly one thing to do on failure: show the fixed
   "please contact us" message. This means an unconfigured `GROQ_API_KEY`
   degrades identically to a real Groq outage — nothing crashes either way.
7. **The answer (real or fixed) is shown, then the flow returns to the
   menu** via the same `backTo` mechanism the button-driven FAQ nodes
   already used — nothing new had to be invented for "return to buttons
   after answering."

At every point along this trace, a visitor who's still stuck can reach
"talk to staff," which — per §2 — is just a link to LINE, not a captured
lead.

---

## 4. How to work on it

- **Add or edit an FAQ answer:** edit
  `packages/cms-core/src/verticals/clinic/reception/faq-content.ts` directly
  — it's a static TypeScript array, not CMS content. See
  [ARCHITECTURE.md §10](../ARCHITECTURE.md#10-faq-content-system) for the
  full breakdown of which entries feed which of the three consumers (button
  answers / fuzzy matcher / AI grounding) — not every entry does all three.
  Editing the CMS `faqs` collection through `/admin` has **zero effect**
  here; that collection only backs the separate, unrelated public `/faq`
  page.
- **Change what counts as a medical or off-topic question:** edit
  `screening.ts`'s regex/denylist. Both checks run before any Groq call, so
  changes here are free to test locally (no API key needed to exercise
  them).
- **Change the AI's behavior/tone/restrictions:** edit `ai/prompt.ts`'s
  `buildSystemPrompt` (the 8 numbered rules). Changing the *grounding
  corpus* (what content the AI is even allowed to draw from) means editing
  `ai/corpus.ts`'s `CORPUS_SOURCES` allowlist instead.
- **Change the Groq model:** set `GROQ_MODEL` in `.env.local` (defaults to
  `openai/gpt-oss-20b`). No code change needed.
- **Test locally without spending real Groq tokens or needing a key:** every
  test file in `ai/` (`groq.test.ts`, `handler.test.ts`) injects a mock
  `fetchImpl` instead of calling the network — `callGroq` takes
  `fetchImpl` as an explicit dependency exactly so this works. Run the
  existing suite with `pnpm vitest` from `packages/cms-core` (or whatever
  the repo's test runner alias is) rather than manually exercising the
  widget against a real key while developing guardrail or matching logic.
- **See the widget with realistic demo content:** `pnpm seed:demo --confirm`
  populates the FAQ/services/team content the AI grounds on. See
  [ARCHITECTURE.md §11](../ARCHITECTURE.md#11-seed-safety-mechanism) for
  the full guard mechanism — it's destructive, confirm-gated, and blocked
  in CI by design.
- **Change fuzzy-match sensitivity:** `faq-matcher.ts`'s
  `FAQ_MATCH_THRESHOLD` (currently `0.3`). Lowering it makes matches
  stricter (more free text falls through to AI); raising it makes matches
  looser (more risk of a wrong-topic canned answer, see §5).

---

## 5. Known issues / gotchas

### Fuse.js matching has real, documented overlap cases

This isn't a hypothetical risk — `faq-matcher.test.ts` and `triage.test.ts`
document specific ambiguous queries by name, with the reasoning for each
written directly into the test file:

- **"What time do you open?" (English) resolves to the first-visit FAQ, not
  the hours FAQ.** Both FAQ entries share an ordinary word ("time" in the
  idiom "first time" vs. hours' own phrasing containing "open"), score
  nearly identically, and the tie is broken by array order in
  `faq-content.ts`, not topical relevance. The test file calls this "the
  same class of 'ordinary word shared across topics' limitation" previously
  documented for **first-visit/prices** and **credit-card/insurance-card**
  collisions against an earlier, smaller FAQ fixture — i.e., these are the
  project's own named recurring failure mode, not a one-off bug.
- **"クレジットカードは使えますか" (Japanese, "can I use a credit card?")
  now resolves to the prices FAQ**, via a shared trailing phrase
  ("は使えますか," "can [X] be used") with the insurance-card FAQ's
  question text — a real substring overlap between two different
  payment-method questions, called out in the test as "arguably a
  reasonable outcome... but flagged here as a genuine behavior change."
- **The equivalent English query ("Do you accept credit cards?") correctly
  falls through to the AI tier instead** — the English FAQ corpus's
  "what to bring" answer doesn't happen to mention "insurance card" in the
  question text the matcher indexes (only labels + questions are indexed,
  never answer text), so this particular collision doesn't reproduce in
  English.

**The lesson for anyone editing `faq-content.ts`:** adding or rewording a
question can shift which topic an ambiguous free-text query resolves to,
sometimes non-obviously. Run `faq-matcher.test.ts` after any FAQ content
edit, not just after code changes.

### The seed-safety guard's origin

The `--confirm` gate and CI-blocking on `pnpm seed:demo` (full mechanism:
[ARCHITECTURE.md §11](../ARCHITECTURE.md#11-seed-safety-mechanism)) is
sometimes described as existing "because of an incident." **I could not
find evidence of a specific past incident in this repository** — `git log`
on `clear.ts` and `seed/demo/index.ts` shows the `--confirm` gate,
CI-environment blocking, and `DATABASE_ENV=development` check were already
present in this repo's very first commit, and the in-code comments describe
the guards in preventive, hypothetical language ("so that a future
postinstall/CI step *added by accident* can't silently wipe content") —
not as an account of something that already happened. One later commit
(`d4d9bd1`, the same commit that shipped the Groq integration) did harden
`clear.ts` further, making a delete failure (a demo doc still referenced by
a required foreign key elsewhere) log a warning and skip instead of
throwing and aborting the whole clear run mid-way — a real, sourced
hardening, but a resilience fix, not evidence of a data-loss incident. If a
specific incident motivated the original design, it isn't recoverable from
this codebase's history — treat the mechanism itself as the trustworthy
part, and don't repeat a specific incident story you can't source from here.

### Dead code that looks live

`/api/ai/query` and `/api/ai/corpus` (§2) still exist in the routes tree,
still feature-flagged on via `siteConfig.features.aiAgent`, and still fully
functional as *code* — they're just not called by the reception widget or
anything else in the frontend. A future developer grepping for "the AI
route" could reasonably find `/api/ai/query` first and assume it's what
powers the widget. It isn't — `ai/groq.ts`'s own header comment says so
explicitly. Worth deleting or clearly marking dormant if it's never going to
be wired up; left as-is for now.

Similarly, the Payload `inquiries` collection has zero writers anywhere in
the codebase (confirmed by grep) — it's unrelated to reception, likely
leftover recruitment-vertical schema, and not something to assume is
"where leads go."

### "Talk to staff" leaves no CMS trace

Per §2, clicking "talk to staff" opens a LINE link and nothing else. If a
visitor never actually messages the clinic once LINE opens, there's no
record anywhere that they tried. Whether that's an acceptable trade-off is
a product question, not a bug — but it's worth knowing before assuming the
CMS has any visibility into "how many people hit the AI fallback and gave
up."

### The staff LINE link is a placeholder until configured

`site.config.ts`'s `reception.staffLineUrl` ships as a demo placeholder. If
it's ever unset for a real client deployment, the "talk to staff" option
doesn't show a broken link — `withStaffLineAvailability` in
`useReceptionEngine.ts` removes the option from the menu entirely. This is
correct, safe behavior, but it means a misconfigured client site won't
throw an error anywhere — it'll just silently be missing an option. Check
for it manually when deploying a new client (see
[docs/DEPLOY-NEW-CLIENT.md §6b](DEPLOY-NEW-CLIENT.md)).

---

## 6. History

### Where the planning trail actually lives

This project tracked its AI-receptionist build with a "STEP 3" work-order
audit document, `docs/STEP3-AUDIT.md` — but it (along with two related "STEP
2" documents about the booking/LINE track) was deleted from the working tree
in commit `0f3402e` ("delete file"), the same evening this doc was written.
It's still recoverable from git history (`git show 46648b0:docs/
STEP3-AUDIT.md`, the commit immediately before the deletion) and was used
directly as source material for this document. If you need the original
pre-build audit's full text, that's where to find it — it will not appear
by browsing the current `docs/` folder.

### The 6-part build sequence

`STEP3-AUDIT.md`'s Deliverable 3 laid out an explicit 6-part sequence before
any of this was built, each part scoped to "one review cycle." Matching that
plan against what actually shipped:

1. **Foundation** — new flow-graph shape only (an "ask something else" input
   option → static-match check → AI-fallback node → one answer →
   `backTo faq.menu`), no UI, no LLM. Estimated 0.5–1 day, "high confidence"
   since it mirrored a pattern the engine had already proven for the
   button-only flow.
2. **Free-text UI** — the chat panel had never rendered a text-input node
   before this (the engine's type system defined an `InputNode` kind, but
   it was dead code — nothing in `ReceptionPanel.tsx` handled it).
   Estimated 0.5 day.
3. **Static match engine** — wiring `fuse.js` (already installed, previously
   only used for site search) over FAQ content. Estimated 0.5–1 day, "match
   threshold tuning is inherently iterative" flagged as the soft part.
4. **LLM fallback + grounding** — explicitly flagged in the audit as **the
   single biggest unknown and the swing factor in the whole estimate**
   (1.5–3 days depending on which unresolved path was chosen), pending two
   open questions: proxy-vs-direct-SDK, and which provider/model/budget.
   Both were resolved during the build (§2): direct SDK, Groq,
   `openai/gpt-oss-20b` chosen specifically because it's Groq's free-tier
   model and Groq offers an OpenAI-compatible API (no SDK dependency
   needed) — I found no evidence of a broader model bake-off beyond that;
   state it as the plain reason it was, not something more considered.
5. **Back-to-buttons + lead-saved wiring** — the audit flagged "back to
   buttons" as a trivial reuse of an existing mechanism, and explicitly
   posed the lead-saving question as a real design decision (§2's "talk to
   staff" section — resolved as neither of the two options studied).
6. **Testing** — unit tests for new nodes, a match-threshold suite, a mocked
   AI-route test, one Playwright E2E happy path. All of this exists today
   (`faq-matcher.test.ts`, `triage.test.ts`, `screening.test.ts`,
   `handler.test.ts`, `groq.test.ts`, `prompt.test.ts`, `corpus.test.ts`,
   `answer.test.ts`, plus `apps/clinic-demo/e2e/reception-journey.spec.ts`).

### What the commit history actually shows

This repository's commit history is terse — single-word or short-phrase
messages throughout, not detailed change logs — so the build's visible
trace in `git log` is thin by design of how this project was committed, not
because the work itself was thin:

- `d239807` — **"part 3 of step 3"** (2026-08-26) — matches the audit's Part
  3 exactly: it adds `faq-matcher.ts` and its 280-line test file, plus flow
  and engine changes to support triage routing. This is the fuzzy-matching
  tier landing.
- `d4d9bd1` — **"AI hydrid"** (2026-08-27, one day later) — a large commit
  that adds the entire `ai/` directory (Groq client, prompt builder, corpus
  compiler, handler, all with test files), the `/api/reception/ai` route,
  the `reception-journey.spec.ts` E2E test, and the `clear.ts` hardening
  mentioned in §5. This single commit effectively bundles the audit's Parts
  4 and 6 (LLM fallback + testing) together, rather than landing as two
  separate reviewable commits — worth knowing if you're ever trying to
  `git bisect` something in this area.
- Parts 1 and 2 (flow foundation, free-text UI) don't have their own
  clearly separable commits distinct from the above two — they likely
  landed folded into `d239807` or earlier uncommitted local work, not
  cleanly separable from the visible git history alone.

### What was harder than expected

The audit itself flagged Part 4 (LLM fallback + grounding) as the one
truly open-ended estimate in the whole plan — everything else had a close
precedent already built (the booking flow's own component-portability
pattern, the existing `EmailResendChannel`-style channel abstraction, the
existing rate limiter). That flagged uncertainty tracks with what actually
shows up in the code: `ai/corpus.ts` alone is over 400 lines with its own
164-line test file — by far the largest single piece of new logic in the
whole feature, consistent with "grounding the model correctly" being the
genuinely hard part rather than "calling an LLM" being hard in itself.

### What this document could not establish

For a complete accounting, here's everything flagged as unrecoverable
during this write-up, in one place:

- **The "two-screenshot design concept"** — no trace found anywhere in code
  comments, commit messages, or the recovered planning documents.
- **The specific incident (if any) behind the seed-safety gate** — the gate
  predates this repo's earliest commit; no incident account was found.
- **The precise reasoning for "no lead-saving" on "talk to staff"** — two
  real alternatives were scoped in advance; the simpler third option that
  shipped isn't explained anywhere in the codebase.
- **Any model bake-off beyond "Groq's free tier, OpenAI-compatible"** — no
  evidence found of other providers/models being seriously evaluated.
