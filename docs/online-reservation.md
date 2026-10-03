# Online Reservation

The in-house booking system: how a visitor books a real appointment slot,
how that reservation is stored safely under concurrent load, and how staff
see it. This doc is a standalone deep-dive — read it start to finish and you
should be able to trace a booking request through the code without asking
anyone.

For LINE/LIFF-specific booking details (the LIFF webview, rich-menu button,
LINE-linked returning-patient shortcut), see
[docs/line-reservation.md](line-reservation.md) — this doc covers the engine
and the plain-web flow; that one covers the LINE-specific wrapping around it.
For deployment/Postgres provisioning steps, see
[docs/DEPLOY-NEW-CLIENT.md](DEPLOY-NEW-CLIENT.md) §4 — not repeated here.

---

## 1. What it is

**From a visitor's perspective:** you land on `/[locale]/booking`, pick
whether you're a first-time or returning patient, pick a service, pick an
open slot on a calendar, fill in your name (kanji and kana) and phone
number, review, and confirm. You get a confirmation screen with a code, and
a confirmation email. If your plans change, a link in that email takes you
to a self-service page where you can cancel or reschedule without calling
the clinic. All of this happens on one page — there's no multi-page
click-through, just one component swapping its content as you progress.

**From a developer's perspective:** it's a small, deliberately isolated
subsystem living almost entirely under `packages/cms-core/src/booking/`,
built on top of Payload's Postgres-backed collections but bypassing
Payload's normal `create()` call for the one operation that actually needs
to be safe under concurrency — reserving a slot. A thin API layer
(`packages/cms-core/src/booking/api/`) exposes it as versioned REST
endpoints, consumed both by a React wizard (`packages/cms-core/src/booking/ui/`)
mounted at `/[locale]/booking` and, separately, by a LIFF webview inside LINE
(see the companion doc).

---

## 2. Why it was built this way

### A single mounted component, not a multi-page route

`BookingFlow.tsx` documents its own constraint directly in a header
comment: it takes "no page-level dependencies" and confirmed (as of the
original build audit) zero imports of `next/navigation`, `useRouter`,
`useSearchParams`, or `useParams` anywhere under `booking/ui/`. All API
calls go through a single relative-path client
(`booking/api/client.ts`, `BASE_PATH = '/api/v1/booking'`) using plain
`fetch()` — same-origin only.

This wasn't an accident — it was a deliberate bet that paid off: the same
component was later mounted, completely unmodified, inside a LIFF webview
for LINE-based booking (see `docs/line-reservation.md`). A route-coupled
multi-page wizard would have needed a rewrite to work inside LINE's webview
sandbox; this one needed a thin page shell around it instead.

### Atomic reservation instead of Payload's normal `create()`

The core risk in any slot-booking system is two people reserving the last
open spot at the same instant. `create-booking.ts` doesn't let Payload's
ORM layer handle this — it opens an explicit database transaction and runs
a conditional `UPDATE`:

```sql
UPDATE slots SET booked_count = booked_count + 1
WHERE id = $slotId AND booked_count < capacity AND status = 'open'
```

If this updates zero rows, the slot was already full (or closed) and the
transaction rolls back with a `SlotUnavailableError` — no appointment row is
ever created for a slot that wasn't actually available. This is why booking
**requires Postgres, not SQLite**, even in local dev — SQLite doesn't give
this system real transactions (see `apps/clinic-demo/src/seed/booking.ts`'s
own doc comment, and `docs/DEPLOY-NEW-CLIENT.md` §4).

**Idempotency** is enforced the same way, not with an in-memory check: a
`UNIQUE` constraint on `appointments.idempotency_key` means that if a
client's request is retried (a flaky connection, a double-tap), a second
insert attempt fails the constraint rather than creating a duplicate
booking — the handler catches that specific failure and returns the
original confirmation instead of erroring.

### Kana fields are mandatory, not optional

The contact form requires `family_name`/`given_name` (kanji) **and**
`family_name_kana`/`given_name_kana` — four name fields, not two. This
reflects a real Japanese clinic operations requirement (patient records and
insurance paperwork are indexed by kana reading, not just the written
name) — it is not a UI choice that can be simplified away without a
business-side decision. It is, however, the single biggest source of
completion friction in the flow — see §5.

### Returning-patient identity: phone alone was deliberately rejected

An early build-state audit flagged "no returning-patient lookup" as a real
UX gap — the obvious fix looks like "if we've seen this phone number
before, skip the contact form." **That specific approach was built, then
deliberately rejected**, and the rejection is documented directly in
`reserve.ts`'s `resolveCustomer()` — worth reading in full if you're ever
tempted to reintroduce it. The short version: a phone number typed into a
web form is not a verified credential. Reusing an existing customer row
based on a bare phone match would let anyone claiming to be a returning
patient (correctly or not) attach a **real appointment** to a stranger's
existing patient record — a "booking injection" attack, independent of
whether LINE is involved at all. The code's own comment states the
philosophy plainly: an accepted duplicate contact record (mergeable by
staff via `/admin`) is the deliberately safer failure mode versus
misattributing a real appointment.

What **was** built instead, and does ship: a returning-patient shortcut
gated on a cryptographically verified identity — a LINE user ID confirmed
server-side via `verifyLineIdToken`. If a booking's `verifiedLineUserId` is
already linked to a customer row, that row is reused directly regardless of
what phone number was submitted; a bare phone match with no linked LINE
identity never reuses a row. See `docs/line-reservation.md` for how that
identity gets verified in the first place. This is a case where the
original audit's diagnosis was right but its proposed fix was wrong — the
actual solution needed a stronger identity signal than the web form alone
could offer.

---

## 3. How it works — tracing a request end to end

### Entry points

- **Direct:** `/[locale]/booking` (`apps/clinic-demo/src/app/(frontend)/[locale]/booking/page.tsx`) mounts `BookingFlow` with no `initialVisitType`/`initialCustomer` — the full 6-step flow.
- **From LINE:** `apps/clinic-demo/src/app/(liff)/[locale]/line/booking/` mounts the same `BookingFlow`, sometimes pre-seeded with an identity-verified customer (see the companion doc).
- **The homepage CTA is currently broken — see §5.** There is no working "book now" link from the homepage as of this writing.

### The 6 steps (`packages/cms-core/src/booking/ui/`)

One component (`BookingFlow.tsx`), driven by a reducer
(`flow/useBookingFlow.ts`, `flow/reducer.ts`), swapping between:

1. **`VisitTypeStep.tsx`** — first-time (初診) or returning (再診). One tap.
2. **`ServiceStep.tsx`** — which service/treatment. One tap.
3. **`CalendarStep.tsx`** — a week-at-a-time grid (`calendar/CalendarGrid.tsx`, `calendar/WeekNav.tsx`), each cell showing availability via a 5-symbol legend (`calendar/availability-symbol.ts`: ◎/○/△/×/−, dual-coded with color, not color alone). Tap a cell, tap Continue.
4. **`ContactFormStep.tsx`** — the 6-field form: `family_name`, `given_name`, `family_name_kana`, `given_name_kana`, `phone` (all required), `email` (optional). Fully client-side Zod validation (`api/schemas.ts`) — no server round-trip needed just to catch a typo.
5. **`ConfirmationStep.tsx`** — a review screen; nothing submitted yet.
6. **`SuccessStep.tsx`** — the confirmation code and a 診察券 (patient-card)-styled summary.

All step transitions happen in-memory — there is exactly one URL for the
whole flow.

### What happens on submit

`ConfirmationStep`'s confirm action calls `POST /api/v1/booking/reserve`
(`apps/clinic-demo/src/app/api/v1/booking/reserve/route.ts` →
`packages/cms-core/src/booking/api/reserve.ts`):

1. **Validate** the request against `schemas.ts`'s Zod schema.
2. **Rate-limit and honeypot-check** (`api/rate-limit.ts`).
3. **Resolve the customer row** — `resolveCustomer()` (see §2's identity
   discussion): reuse-by-verified-LINE-identity, reject-only phone-match, or
   create new.
4. **Reserve the slot atomically** — `create-booking.ts`'s transaction
   (§2). A full slot returns a typed `SlotUnavailableError`, surfaced to the
   UI as "please pick another time," not a generic failure.
5. **Create the appointment row**, tagged with the resolved customer,
   service, slot, and the request's `idempotencyKey`.
6. **Dispatch notifications** — `packages/cms-core/src/notifications/` queues
   a confirmation email via the `EmailResendChannel`; a reminder is sent
   later by a scheduled batch job
   (`apps/clinic-demo/src/app/api/cron/notifications/route.ts`), not at
   booking time.
7. Returns a `confirmationCode` to the client, which the UI shows on
   `SuccessStep`.

### Where staff see it

Every collection this system touches — `customers`, `appointments`,
`slots`, `resources`, `bookable-services`
(`packages/cms-core/src/payload/collections/booking/`) — is a normal
Payload collection, so staff see and manage bookings the ordinary way,
through `/admin`. `slots.bookedCount` is deliberately write-locked in the
Payload admin (`access.create`/`access.update` both return `false`) — it
can only change through the atomic reservation path above, never by a
staff member editing the field directly, which would bypass the
capacity guarantee.

### Self-service cancel/reschedule

`/[locale]/booking/manage` (`ManagePageClient.tsx`,
`ManageAppointmentView.tsx`, `flow/manageReducer.ts`) is reached via a
token-based link (not a login) sent in the confirmation/reminder email.
Cancel calls `cancel-booking.ts` directly. Reschedule
(`api/reschedule.ts`) reserves the new slot **before** cancelling the old
one, in that order, and uses a transient `rescheduling` appointment status
to guard against a concurrent double-reschedule attempt on the same
appointment. A cutoff window (`api/cutoff.ts`) blocks changes too close to
the appointment time, enforced server-side (not just hidden in the UI).

---

## 4. How to work on it

**Change slot capacity / add a service / add a resource:** edit content
through `/admin` (the `bookable-services`, `resources`, `slots`
collections) — this is data, not code, for a running site. For seeding
initial demo data:

```bash
pnpm seed:booking
```

Seeds bookable services/resources/slots. Refuses to run against SQLite —
the booking engine's atomic-transaction guarantee doesn't exist there, so
seeding booking data onto SQLite would silently misrepresent what
production behaves like. Safe to re-run (idempotent).

**After provisioning a fresh Postgres database,** run:

```bash
pnpm db:apply-indexes
```

This applies composite indexes and `CHECK` constraints (like the
booked-count-within-capacity guarantee) that Payload's own field config
can't express — see `docs/DEPLOY-NEW-CLIENT.md` §4 for the full
provisioning sequence. Skipping this step on a fresh database doesn't break
the atomic `UPDATE` itself, but does silently drop the extra integrity
guarantees around it.

**Run the tests:**

```bash
pnpm e2e:install   # once, installs the Playwright browser
pnpm e2e           # apps/clinic-demo/e2e/booking-journey.spec.ts + manage-appointment.spec.ts
```

The booking engine also has extensive integration tests under
`packages/cms-core/src/booking/*.integration.test.ts` and
`booking/api/*.integration.test.ts`, run against a **real, disposable
Postgres instance** (`booking/test/global-setup.ts`) rather than mocks or
SQLite — this is deliberate, given the whole point of the engine is
transaction behavior that a mock can't faithfully represent.

**Change validation rules (required fields, phone format, etc.):** edit
`packages/cms-core/src/booking/api/schemas.ts` — it's the single source of
truth, shared by both client-side (pre-submit) and server-side
(authoritative) validation.

---

## 5. Known issues / gotchas

- **The homepage has no working "book now" link, right now.** This is a
  real, currently-verified bug, not a historical note. `HeroBlock`'s
  reservation button (`hero/component.tsx`) falls back to a hardcoded
  default of `{ label: 'Online Reservation', href: '#' }` whenever the
  seeded content doesn't supply a `reservationButton` — and the current
  homepage seed (`apps/clinic-demo/src/seed/demo/pages/home.ts`) doesn't
  set one. Separately, the `booking-cta` block (which *does* correctly wire
  itself to `siteConfig.integrations.bookingProviderUrl` — still a
  placeholder value, `https://example.com/book-placeholder`) isn't seeded
  onto the homepage at all anymore. Net effect: there is currently no
  path from the homepage to `/booking` for a real visitor to find. Fixing
  this needs either the hero seed to set a real `reservationButton.href`
  of `/booking`, or a `booking-cta` block to be added back to the homepage
  layout with `enabled: true` and a real provider URL — a decision, not
  just a bug fix, since both mechanisms exist in the code today.
- **Kana-field entry is the most likely single point of abandonment.**
  Of the 6 typed fields on the contact step, 4 are name-related, and the 2
  kana fields require an IME mode switch mid-form on a phone keyboard —
  the highest-friction interaction in the flow, and mandatory (§2), not
  optional. No analytics or session recording exists in this codebase to
  confirm this empirically; it's a reasoned estimate from the flow's
  structure, not a measurement. Anyone adding real usage analytics to this
  flow should treat this as the first hypothesis to test.
- **A "book in under 90 seconds" target is not verified as met.** A rough,
  explicitly-reasoned-not-measured estimate: best case (no errors, no
  fully-booked week) is roughly 50 seconds; a realistic case with one
  validation error or calendar re-navigation runs 75-100+ seconds. Confirm
  this with real timing data (a Playwright trace with realistic typing
  speeds, or production analytics) before treating either number as fact.
- **Returning-patient convenience only works for LINE-linked customers.**
  A returning patient booking anonymously on the plain web form always
  gets treated as a new customer row (§2) — this is intentional, not a
  bug, but it means the plain-web UX gap the original audit flagged is
  only half-closed. A genuinely anonymous "remember me" web flow would
  need a different identity mechanism (e.g., a signed cookie/token) to be
  built safely; nothing like that exists today.
- **`db:apply-indexes` is a manual step, not automatic.** Forgetting it on
  a fresh Postgres database doesn't break bookings outright (the core
  atomic `UPDATE` doesn't depend on it), but silently drops constraints
  this system was designed to have — treat it as a mandatory, not optional,
  part of provisioning any new environment.

---

## 6. History

This system was originally built as a sequence of **numbered "work orders"**
(WO-1 through WO-6), a convention that shows up throughout code comments
(e.g. `reserve.ts`'s "STEP 2 Part 2 item 5", `create-booking.ts`'s
transaction comments) and in a later audit document. Reconstructed mapping,
from what's directly evidenced in code and the recovered audit
(`docs/STEP2-AUDIT.md`'s §1.1, retrievable from git history at
`git show 46648b0:docs/STEP2-AUDIT.md` — it was deleted from the working
tree in a later commit but still exists in git history):

- **WO-1** — the data model: `customers`/`appointments`/`slots`/
  `resources`/`bookable-services` collections.
- **WO-2** — the booking API: availability/reserve/cancel/lookup endpoints.
- **WO-3** — the booking UI: the 6-step `BookingFlow` wizard, built with the
  explicit "no page-level dependencies" constraint from day one (§2).
- **WO-4** — notifications: the channel-agnostic dispatcher and the
  cron-driven reminder batch.
- **WO-5** — self-service manage/cancel/reschedule.
- **WO-6** — integrating the reception chat widget with booking (mounting
  `BookingFlow` inline inside the chat panel — see
  `docs/ai-receptionist.md`).

**A dedicated read-only audit** (`docs/STEP2-AUDIT.md`, dated 2026-08-20 on
a branch called `wo-1-booking-engine`) was later commissioned specifically
to check what WO-1 through WO-6 actually delivered versus what they
claimed, ahead of starting LINE integration work. It's the direct ancestor
of most of the "why" content in §2 and the gotchas in §5 — several of its
findings (the dead homepage CTA, no returning-patient lookup) have since
been partially addressed by later work (the LINE-linked returning-patient
shortcut exists now; the homepage CTA is still broken, just via a
different mechanism than the one the audit originally found). This doc's
§5 reflects the *current*, re-verified state, not the audit's original
findings — where they differ, that's noted explicitly rather than repeating
stale claims.

**What isn't recoverable:** the audit and code comments explain *what* was
built and, in places, *why* a specific safeguard exists (e.g., the
returning-patient identity rejection in §2). They do not explain, beyond
what's in code comments, why Postgres's transaction + conditional-`UPDATE`
approach was chosen over an alternative concurrency strategy (e.g.,
row-level `SELECT ... FOR UPDATE` locking, or an application-level queue) —
if there was a deliberate comparison made, it isn't recorded anywhere this
doc's author could find. Treat the current approach as the working,
tested solution, not as proof no alternative was considered.
