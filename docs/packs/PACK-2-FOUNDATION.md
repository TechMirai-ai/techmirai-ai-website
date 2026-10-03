# Pack 2 of 4: Foundation, navigation and content system

Steps **D1 to D2, E1 to E2, F1 to F3**. The rulebook is `docs/WORK-ORDER.md`; do not paste it. Paste **one step block at a time**.

## Before starting (Jamal)

- [ ] Pack 1 is finished and Jamal has signed off Checkpoint 3. His answers to C1 item 9 (risks and questions) are in hand.
- [ ] `TECHMIRAI_BROCHURE.html` and the logo SVG and favicon source are in `docs/_inputs` (copied in B2). Without them D2 uses temporary tokens and a wordmark, each with a register row.
- [ ] Jamal is ready to answer the **header behaviour** question at E1 (with the Director) and to confirm decision 5 (founder visibility default) before F2.

**How to run a pack (every step, every time)**

1. Fresh session for each pack, ideally for each step: type `/clear`, or exit and start `claude` again. (`/clear` should be in the `/` menu; if your version does not list it, exit and restart.) `CLAUDE.md` is re-read each time, so the standing rules are never lost.
2. Check the status bar says `plan mode on`. If it does not, press **Shift+Tab** until it does.
3. Paste the session opener (below) **once per session**.
4. Paste **ONE** step block. Never paste a whole pack.
5. Review the plan with the checklist in section 1.2 of the rulebook. "No, keep planning" if anything is missing.
6. Approve with **"Yes, and use auto mode"** (or "Yes, auto-accept edits" if that is what your account shows). Never bypass permissions.
7. Check every "Done when" item yourself (the browser for anything visual). Then commit by hand: `<step id>: <what changed>`.
8. At every ★, send Jamal: commit hash, a screenshot or two, open questions.

**Session opener** (paste once per session, before the first step block):

```text
Read CLAUDE.md and docs/WORK-ORDER.md sections 1.2, 1.3 and 1.4 (plan checklist, the six common
gates, stop-and-ask triggers). Then wait. I will paste one step at a time. Every step starts in
plan mode: no edits until I approve a written plan. "The six common gates" in a step means
section 1.3.
```

---

**Rules for all build steps** (apart from the common gates in section 1.3 and the standing rules in section 1.5 of `docs/WORK-ORDER.md`):

- Reuse an existing block when it fits. Add a new block only when configuration cannot do the job. New blocks follow the repo's existing block pattern (project notes call it four files: config, types, adapter, component).
- Content comes from the Spec only. Copy English and Japanese exactly. Where a string has brackets, keep them (section 5).
- Japanese copy is never edited by the developer or by ECC. Haruka reviews all of it before launch.
- Each prompt below is the text to paste, **one at a time**, after the plan-mode setup in section 1.1 of `docs/WORK-ORDER.md`. Each already starts with the plan-first line.
- Page numbers refer to the Spec PDF.

---

### Phase D: Foundation

#### D1. Rename the app, set locales and fonts

```text
Plan only. Make no edits until I approve.
STEP D1 — Rename the app, set locales and fonts.
Read: Spec p.1-2 (build rules), README, the app's site config, messages folder, font loading.
Do:
1. Rename apps/clinic-demo to apps/techmirai-web. Update package names, workspace and turbo
   references, scripts, CI files, deploy config paths, README and docs. Afterwards search the
   repo for "clinic-demo"; every remaining hit must be intentional and listed in the report.
2. Locales: Japanese (ja) is the default, English (en) is second. Remove Bengali (bn) completely:
   site config strings, messages/bn.json, the Bengali font load, bn keys in tests.
3. Fonts: Noto Sans JP for Japanese text, body line-height about 1.8. Japanese copy uses the
   Japanese quotation brackets, never English-style quote marks (store them as written in the Spec).
4. Turn off the clinic vertical flag (verticals.clinic) in the site config. Keep recruitment off.
   Do not delete any engine or vertical code. Confirm the app boots with those collections and
   blocks switched off. If it does not, fix the cause as a generic engine fix and log it in
   docs/ENGINE-FIXES.md.
Done when: the six common gates (section 1.3) pass; both searches ("bn" and "clinic-demo") are explained line by line;
/ja and /en load; Japanese text renders in Noto Sans JP; the block picker no longer offers clinic blocks.
```

#### D2. Brand, identity constants and the indexing guard

```text
Plan only. Make no edits until I approve.
STEP D2 — Brand, identity constants, indexing guard.
Read: Spec p.2 (brand rule), p.113 (brand rules), p.11-14 (voice, glossary), p.17-19 (footer and
contact), Section 1 items 1, 5, 6, 7, 21; docs/_inputs/TECHMIRAI_BROCHURE.html; the site config; the global stylesheet.
Do:
1. Brand colours from the brochure file: the brochure's green is primary; navy and orange are
   accents only. Change BOTH places that hold colours: the brand colours in the site config AND
   the hardcoded tokens in the global stylesheet (about 14 files read the second set). If the
   brochure file is missing, use clearly named temporary tokens and add a register row.
2. Logo: use the supplied SVG plus a square favicon (both in docs/_inputs). If missing, use a text wordmark placeholder
   and add a register row.
3. Identity constants in one place (site config): name TechMirai; domain techmirai-ai.com; email
   info@techmirai-ai.com; phone [080-7701-3004]; hours [weekdays 9:00-18:00]; LINE URL [LINE
   Official Account URL]; live demo URL [demo.techmirai-ai.com]; address [address you may publish].
   Components read these. None hardcodes them.
4. If still present, remove the hardcoded Sadiatec email and Tokyo address fallbacks in the footer,
   and the hardcoded "Sadiatec" string in the mobile menu (project notes list both).
5. Indexing guard: an environment setting such as SITE_ENV. In production, serve the robots.txt
   from Spec p.103. In any other environment serve "Disallow: /" and a noindex header, so no
   preview or staging copy is indexed.
Done when: the six common gates (section 1.3) pass; as a test, change one brand colour in one place and show that the whole UI
follows, then revert; grep for the old clinic colour values is empty; /robots.txt differs by
environment as described; the footer shows the constants in both languages.
```

### Phase E: Navigation and global elements

#### E1. Header, navigation and mobile bar

```text
Plan only. Make no edits until I approve.
STEP E1 — Header, navigation, mobile bar.
Read: Spec p.14-19 (Section 4), p.19-20 (hero, for the header decision).
Do:
1. Desktop header, left to right: logo; AI Reception; Solutions dropdown (Clinics & treatment
   rooms, Beauty salons, Auto service & dealers, Hotels & guesthouses); How It Works; Integrations;
   Pricing; About; Technology; language switch (日本語 (Japanese) / EN); button "Free AI Website
   Assessment" linking to /assessment. Labels exactly as in the Spec table on p.17, both languages.
   Navigation data comes from one source that the hero cards will share.
2. Header behaviour. The Spec allows the clinic's "hidden until scroll" header only if the hero
   shows the logo AND these links. The clinic-style hero shows only four nav cards, so by the Spec's
   own rule the header stays visible from the top. Put this in the plan as a decision for Jamal and
   the Director, and wait for the answer.
3. Mobile: same order in the menu, plus a sticky bottom bar with three buttons: Free assessment,
   LINE, Call (Japanese labels: 無料診断 (free assessment), LINE, 電話 (phone)).
4. LINE and Call read the constants from D2. LINE is a plain link to the placeholder URL.
5. Pages that do not exist yet show a small temporary "page coming" stub. List each stub.
Done when: the six common gates (section 1.3) pass; every header link resolves; the bottom bar shows at phone width and not on
desktop; the language switch keeps you on the same page; the header behaviour decision is recorded.
```

#### E2. Footer, global labels and status badges

```text
Plan only. Make no edits until I approve.
STEP E2 — Footer, global labels, status badges, chat widget placement.
Read: Spec p.12-13 (glossary), p.18-19 (footer, global buttons and labels), p.87 (chat disclosure).
Do:
1. Footer columns: brand line; Product; Solutions; Company; Contact (phone, email, hours, LINE QR
   placeholder); Legal (Privacy Policy, Terms of Use, Legal Notice); bottom line. Text exactly as the
   Spec table, both languages.
2. One labels dictionary (EN and JA): primary CTA, demo CTA, LINE, phone, brochure, read more, back
   to top, trust line, and the two status labels "Available now" (提供中 (available now)) and "In
   development" (開発中 (in development)).
3. A reusable status badge using those two labels. The voice edition is only ever "In development".
4. Glossary constants file for the terms on p.12-13, used by components (for example "Live demo",
   never "sample").
5. The reception chat widget shows on every page and is labelled "Automated assistant". Render it
   inside the locale provider so anything it mounts (such as the booking flow) has translation
   context. The clinic template once failed here.
Done when: the six common gates (section 1.3) pass; footer matches the Spec in both languages; both badge states render; the
widget shows on every route, including /thanks.
```

★ **Checkpoint 4** (after E2): screenshots of header, footer and mobile bar in both languages; the header-behaviour decision.

### Phase F: Content system

#### F1. Placeholder register and the launch gate

```text
Plan only. Make no edits until I approve.
STEP F1 — Placeholder register and launch gate.
Read: docs/WORK-ORDER.md section 5 and Appendices A and B; Spec p.2-6 and p.11-14; the repo's
existing preflight script and CI file.
Do:
1. Fill docs/PLACEHOLDER-REGISTER.md from Appendix A, plus anything else found by scanning the
   Spec for "[" and "CONFIRM". Columns: ID, page and field, locale, placeholder text, Spec section,
   owner, status.
2. Add a "launch" mode to the existing preflight script. It fails on every rule in Appendix B and
   reports each hit with file, locale and the rule. Normal preflight keeps its current behaviour.
   Hits that are correct (Appendix B notes) go in a written allow-list, one reason per entry.
3. The launch scan reads seed data and rendered pages in both locales.
Done when: the six common gates (section 1.3) pass; normal preflight passes; launch mode currently FAILS with a readable list
(that is expected: the site still has clinic content); a deliberate banned phrase added to a scratch
file is caught, then removed.
```

#### F2. Content model changes

```text
Plan only. Make no edits until I approve.
STEP F2 — Content model changes. The plan must list each change and its migration.
Read: Spec p.14-16, p.31-32 (team), p.56-61 (About), p.64-70 (assessment, booking), p.73-78 (FAQ),
p.78-87 (blog), p.87-98 (chat content); docs/CLONE-PLAN.md.
Candidates. The plan decides which are really needed after the C1 inventory; do not add anything
the engine already has:
- Founder visibility: one switch and one source of truth for founder fields (work order 2.3).
- Team members: name EN/JA, role EN/JA, bio EN/JA, photo, public-visibility switch per person
  (each person must agree in writing).
- Visibility switch for the Sadiatec case study card and page (written permission pending).
- Status badge field (available / in development) on cards.
- FAQ: stable id F01-F26, one of six categories, matching keywords EN/JA, "show on homepage" flag.
- Chat-only answers C01-C10: id, topic, keywords, answers, next buttons.
- Bookable services: consult-online, demo-walkthrough, voice-demo, visit.
- Customers and appointments: a company field; kana optional when the locale is English.
- Assessment form submissions, if the existing forms pipeline does not already store them.
- Blog posts: named author, reviewer, published and updated dates, "AI may read" flag.
Migrations must be additive. Postgres schema push is off by design in this repo, so follow the
migration and bootstrap pattern the README documents. Run migrations on the NEW database only.
Done when: the six common gates (section 1.3) pass; the new database shows the new columns; existing booking tests still pass;
every migration is described in docs/CLONE-PLAN.md.
```

#### F3. Seed scaffolding and placeholder images

```text
Plan only. Make no edits until I approve.
STEP F3 — Seed scaffolding.
Read: Spec p.111-113 (image brief); the existing seed folder; packages/cms-core/src/seed/utils.ts.
Do:
1. Remove all clinic seed content (doctors, treatments, clinic pages, demo bookings, demo media).
   Keep the mechanism that seeds bookable services, resources and slots.
2. New seed layout: one module per page group (home, product, solutions, how-it-works,
   integrations, pricing, security, about, technology, assessment, case study, faq, blog, contact,
   legal, chat, booking) plus shared helpers. Every module uses createLocalizedDoc(), writes EN and JA
   together, and is idempotent. Media filenames are stable, so reseeding never orphans files.
   (Project notes say reseeding used to orphan media. Check whether that is fixed; if not, fix it as
   an engine fix and log it.)
3. A placeholder-image script: labelled PLACEHOLDER images at the sizes in Spec p.111-113, with the
   slot name written on the image, plus neutral initials avatars for people. Every generated file is
   a register row.
4. The seed refuses to run against anything except the new database (use the existing
   development-environment guard).
Done when: the six common gates (section 1.3) pass; the seed runs twice in a row with identical results and no new orphan media;
the site loads with empty pages (content arrives in Phase G).
```

---

**Pack 2 is finished when Checkpoint 4 (after E2) is signed off and F3 is committed.** Next: Pack 3.
