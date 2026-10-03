# TechMirai Website — Clone Work Order

**Clone `clinic-demo-standalone` into a new, separate repository. Then load the TechMirai content (English and Japanese) into it.**

| | |
|---|---|
| Version | v1.1, split into 4 packs, Windows commands, 2 Oct 2026 |
| For | The new developer. She runs every step. |
| Owner | Jamal: decisions, secrets, review, deployment |
| Content source | *TechMirai Website — Full Content Spec (EN/JA)*, 113 pages, dated 1 Oct 2026. Called **the Spec** below. |
| Process source | *Clinic Demo: From Inside Sadiatec to a GitHub Template*. Called **the clone summary** below. |

---

## Start here: how the files fit together

This work order is now five files. **Do not paste any of them whole into ECC.**

| File | What it is | Where it lives |
|---|---|---|
| `WORK-ORDER-00-RULEBOOK.md` (this file) | The rules: protocol, gates, standing rules, decisions, placeholder policy, launch-scan rules, Spec-to-step map. ECC reads parts of it when a step says so. | `docs/WORK-ORDER.md` in the new repo |
| `PACK-1-CLONE.md` | B0 to B8 (clone on Windows, by hand in PowerShell) and C1 (recon plan) | `docs/packs/` |
| `PACK-2-FOUNDATION.md` | D1 to F3: rename, brand, navigation, footer, content model, seeds | `docs/packs/` |
| `PACK-3-PAGES.md` | G1 to I4: homepage, product, industry, business pages, FAQ, blog | `docs/packs/` |
| `PACK-4-FORMS-CHAT-LAUNCH.md` | J1 to O3: forms, booking, chat, SEO, legal, images, final checks | `docs/packs/` |

Order: Pack 1, then 2, 3, 4. Each pack starts with its own short checklist of what Jamal must have ready.

**The laptop setup (installing tools and ECC, running the clinic demo once) is already done, so it is not part of any pack.** The developer's laptop runs **Windows**. The commands in Pack 1 are **PowerShell**.

**What the developer pastes into ECC:** one step block at a time, from a pack, after the session opener. The step blocks are the text boxes. Everything else in the packs is for the human.

---

## 0. Read this first

**Goal.** Build a new git repository for the TechMirai company website (techmirai-ai.com) by cloning the clinic demo. This repeats what was done when the clinic demo was extracted from the Sadiatec project: copy only what the app needs, start fresh git history, use a separate database, verify it stands alone. Then load the Spec's content so the site runs locally with all 20 public pages and 3 legal pages, in Japanese and English.

**Missing information.** Where the Spec has a fact in `[square brackets]`, keep it in brackets. Where the Spec has nothing, use a labelled placeholder (rules in section 5). Nothing is invented.

**Not the goal.** Going live. The Spec says nothing goes live until every CONFIRM item in its Section 1 is closed. Deployment, DNS, the email domain and the LINE account are Jamal's (section 9).

**Who does what**

| Person | Job |
|---|---|
| Developer | All steps in this document |
| Jamal | Section 2 decisions, secrets, CONFIRM items, review at each ★ checkpoint, deployment |
| Haruka (native Japanese speaker) | Reads every Japanese line before publishing and fixes anything unnatural |
| Director | Signs off homepage, positioning and pricing (Spec Sections 2, 5, 9) |

**The one rule: Plan first. Get permission. Then run in auto mode. Then verify.** Section 1 explains it. Every step in this document follows it.

**How each step is written.** Goal, what to read in the Spec, a paste-ready ECC prompt (the text box), then what you check yourself. Do not skip the checks.

**Names in this document that come from project notes.** Folder, script and file names such as `apps/clinic-demo`, `packages/cms-core`, `packages/reception-engine`, `pnpm db:bootstrap`, `pnpm seed:demo`, `createLocalizedDoc()` and the preflight script were recorded in earlier project notes, not read from the repo today. If one is different in your copy, the repo is right and this document is wrong. Tell Jamal.

**The whole job at a glance**

| Pack | Steps | What happens | Checkpoints to Jamal |
|---|---|---|---|
| 1 | B0 to B8, C1 | Record the source commit, clone on Windows into a separate repo, own database, guardrails, push; then the recon and master plan (plan only) | ★ 1, ★ 2, ★ 3 |
| 2 | D1 to D2, E1 to E2, F1 to F3 | Rename app, locales, fonts, brand, constants, indexing guard; header, mobile bar, footer, labels, badges; placeholder register and launch gate, schema changes, seed scaffolding | ★ 4 |
| 3 | G1 to G4, H1 to H3, I1 to I4 | Homepage; AI Reception page, industry pages, How It Works, Integrations; Pricing, Security, About, Technology, case study, FAQ, blog, contact, thanks | ★ 5, ★ 6 |
| 4 | J1 to J2, K1 to K2, L1 to L2, M1, N1, O1 to O3 | Assessment form, consultation booking; reception chat; SEO and GEO; legal pages (headings and placeholders only); images and alt text; whole-site sweep, tests, handoff | ★ 7, ★ 8 |

---

## 1. Working protocol: plan first, permission, then auto mode

This section follows the current Claude Code documentation on permission modes and the ECC README (checked 2 Oct 2026). Both can change, so check what your installed version shows.

### 1.1 The loop (repeat for every step)

1. **Start the step in plan mode.** Plan mode lets ECC read the repo and propose changes, but it cannot edit your files.
   - Start the session with `claude --permission-mode plan`, or press **Shift+Tab** until the status bar says `plan mode on`, or start your prompt with `/plan`.
   - Newer Claude Code versions (v2.1.283 or later) start in **auto mode** by default. Never assume you are in plan mode. Look at the status bar before you paste a prompt.
   - Pack 1, step B6 sets plan mode as this project's default for terminal sessions.
2. **Paste the step prompt.** ECC's planning command is `/ecc:plan` when ECC is installed as a plugin (or `/plan` for a manual install). Type `/` to see which one you have. Either way, ECC must produce a written plan and make no edits.
3. **Review the plan** against the checklist in 1.2. If anything is missing or wrong, answer "No, keep planning" and say what to change. Questions about facts or decisions go to Jamal. Do not let ECC guess.
4. **Give permission.** When the plan is good, choose **"Yes, and use auto mode"** on the approval prompt. If your account does not have auto mode, the option reads "Yes, auto-accept edits". Use that. Never choose bypass permissions on your laptop. You can press **Ctrl+G** to edit the plan in your editor before you approve it.
5. **Let it run in auto mode.** ECC now carries out the whole approved plan without asking again. If auto mode pauses and shows a prompt (this happens after 3 blocked actions in a row, or 20 in total), approve it only if it matches the plan. If it does not match, stop and ask Jamal.
6. **Verify.** ECC runs the checks in the prompt. Then you check the "Done when" list yourself, in the browser for anything visual. A report saying "done" is not evidence. An earlier ECC pass reported work done that had not been built.
7. **Commit.** You commit, not ECC. Message format: `<step id>: <what changed>`, for example `D1: rename app and drop Bengali locale`.
8. **Go back to plan mode** for the next step. At steps marked **★**, send Jamal a short report: commit hash, a screenshot or two, and any open questions.

### 1.2 Plan checklist: do not approve a plan that lacks these

- [ ] States the goal and what is out of scope.
- [ ] Lists every file it will create, change or delete, with paths.
- [ ] Names the Spec sections and page numbers it will read.
- [ ] Explains any database or schema change. It must be additive: new columns or tables, and no change to existing rows.
- [ ] Says how each "Done when" item will be proven (the command, or the page to open).
- [ ] Lists every placeholder it will create, so it can go in the register.
- [ ] Lists its questions and doubts. It does not guess past them.
- [ ] Does not touch the original clinic folder, secrets or git history.

### 1.3 Common gates (apply to every build step)

| Gate | Check |
|---|---|
| Gate 1 | `pnpm typecheck` passes. |
| Gate 2 | The repo's tests pass (commands are in the README). When content intentionally changes, update the test's expectation and say so in the plan. **Never delete or weaken a test to make it pass.** |
| Gate 3 | `pnpm dev` boots. Every page the step touched returns 200 in `/ja/...` and `/en/...` with no console errors. Clear `.next` and restart before judging anything visual (a stale cache has caused false readings before). |
| Gate 4 | No Japanese text on English pages and no English-only text on Japanese pages, except proper names and the language-switch label. (Payload silently falls back to Japanese when an English field is empty.) |
| Gate 5 | `git status` shows no `.env*` files other than `.env.example`, and nothing outside the plan. |
| Gate 6 | Every placeholder the step created is in `docs/PLACEHOLDER-REGISTER.md`. |

### 1.4 Stop and ask Jamal (in any step)

- The Spec contradicts itself, or contradicts how the engine works.
- A step needs a secret, a paid account, or a new external service.
- A schema change would touch existing rows or cannot be written as additive.
- The plan needs more than a handful of files outside what the step names.
- A fact is missing and the Spec gives no bracketed placeholder for it.
- ECC wants to delete or rewrite a test.

### 1.5 Standing rules for ECC

Pack 1, step B6 puts this block into `CLAUDE.md` in the new repo, so ECC reads it in every session. (Merge it with any existing `CLAUDE.md`. Do not overwrite.)

```text
# Standing rules for this repo (TechMirai website)

1. PLAN FIRST. Never edit anything until I have approved a written plan. After approval,
   carry out the whole plan without asking again, but stop at any stop-and-ask trigger in
   docs/WORK-ORDER.md section 1.4.
2. Work only inside this repo. Never read from or write to the original
   clinic-demo-standalone folder.
3. Never run git commit, git push or any GitHub command. The developer commits.
4. Never print, copy or commit secrets. .env.local stays untracked. Use only this repo's own
   database. The clinic demo's database must never be used.
5. Do not invent facts. A fact that is not in the Content Spec becomes [TBD: what is missing]
   and an entry in docs/PLACEHOLDER-REGISTER.md. Facts the Spec shows in [brackets] stay in
   brackets.
6. Japanese text is copied exactly from the Spec. Read it from page images or from a Markdown
   export. Do not copy from raw PDF text extraction: it breaks Japanese words with stray
   spaces and line breaks. Never machine-translate or "improve" Japanese. If the Spec has no
   Japanese for a string, write [JA TODO] and add it to the register.
7. Never write legal, tax, medical or subsidy text. Legal pages get the Spec's headings and a
   clearly marked placeholder body.
8. Never use AI-generated pictures of people. Placeholder images are labelled and neutral.
9. Seed localized documents with createLocalizedDoc() (packages/cms-core/src/seed/utils.ts).
   Never leave an English field empty.
10. Brand colours live in two places (site config and the global stylesheet). Change both.
11. Generic engine bug fixes are separate, small changes, and are logged in docs/ENGINE-FIXES.md.
12. "Done" needs evidence: command output or a screenshot for every "Done when" item. Never
    report done for something you did not verify.
13. Do only what the approved plan says. Log anything else you notice in docs/FINDINGS.md.
14. Never delete or weaken a test to make it pass.
```

---


## 2. Before day 1: inputs and decisions (Jamal)

### 2.1 Files and access the developer needs

Put every file in this table that is a file (the Spec, its Markdown export, the brochure, the logo, the clone summary, this rulebook and the four packs) in **one folder named `_techmirai_inputs` inside the clinic-demo folder**, not loose in its root. Pack 1 explains why and how it is carried into the new repo.

| What | Why | Needed by |
|---|---|---|
| The Spec (PDF) | Content source. Step B2 in Pack 1 copies it from `_techmirai_inputs` into the new repo's `docs/_inputs/` folder. | B2 |
| **A Markdown export of the Spec (recommended)** | The PDF's tables and Japanese text come out broken in plain text extraction (stray spaces, split lines). ECC can read PDF pages as images, but that is slower and a Markdown export is safer. If Jamal can export the source document to Markdown, add it next to the PDF. | B2 |
| `TECHMIRAI_BROCHURE.html` | The Spec says to take exact colour values from it. | D2 |
| Current TechMirai logo (SVG) and a square favicon source | Spec Section 19: keep the current logo. | D2 |
| Access to the clinic template repo, the exact branch and commit to clone | Decision 4. | B0 |
| A new, separate Neon Postgres database for the TechMirai site | Decision 3. | B5 |
| Secrets for `.env.local`, through a password manager (never chat or git) | The list is in the clinic template's `.env.example`. | B5 |
| This rulebook and the four packs | The standing rules refer to the rulebook. Step B2 places the rulebook at `docs/WORK-ORDER.md` and the packs in `docs/packs/`. | B2 |

### 2.2 Decisions, with the default this document uses

| # | Decision | Default used here | Needed by |
|---|---|---|---|
| 1 | Folder and repo name | `techmirai-ai-website` | B1 |
| 2 | GitHub owner and visibility | Private repo under Jamal's account; developer added as collaborator | B7 |
| 3 | Database | A new Neon Postgres database, used only by this site | B5 |
| 4 | Which clinic commit to clone | Jamal names the branch and commit. The clinic folder must have no uncommitted changes. | B0 |
| 5 | Founder visibility (Spec §1 item 4) | Build one switch. Seed as visible for local review only. Jamal decides before any public deploy. See 2.3. | F2 |
| 6 | TechMirai LINE Official Account | Does not exist yet. LINE buttons use the Spec placeholder `[LINE Official Account URL]`. The LINE booking code stays switched off. | E1 |
| 7 | Live demo address | Placeholder `[demo.techmirai-ai.com]`, as in the Spec | G2 |
| 8 | The Spec file in git | Not committed. `docs/_inputs/` is git-ignored, because the Spec's Section 1 contains private notes about Jamal. | B2 |
| 9 | Deployment | Out of scope. Jamal deploys after review. | none |
| 10 | AI provider for the chat fallback | Whatever the clinic template uses today. Project notes say Groq on its free tier for development. Production provider and plan are Jamal's decision. | K2 |

### 2.3 The founder switch must cover every place the founder appears

The Spec says the founder card "can be hidden with one CMS switch". The Spec also names Jamal in more places than the card:

- Homepage team cards (5.11) and About founder message and team (10.2, 10.4)
- Company profile "Representative" row (10.6)
- Organization structured data `founder` (17.3)
- The canonical company-facts sentence used on About, in schema and in the chatbot (17.4)
- The chatbot answer to "Who founded TechMirai?" (F23) and other FAQ answers
- Blog bylines, photos and alt text

One switch on the card alone would leak his name through the rest. Step F2 must create one source of truth for founder fields so one switch removes all of them. Note also that Spec §18 says the privacy policy and legal notice must show the representative's name. Hiding the founder everywhere may conflict with that. That is for Jamal and the legal professional to decide. It is not the developer's call.

---


## 3 and 4. Laptop setup and cloning

Laptop setup is already done. Cloning into a separate repository is Pack 1, steps B0 to B8.

---

## 5. Placeholder and dummy-data policy

The goal is a site that is complete enough to review and obviously unfinished where facts are missing.

| Case | What to do |
|---|---|
| The Spec shows a fact in `[brackets]` (phone, prices, hours, address, "[X weeks]") | Keep the brackets in the seeded content, exactly as written. The visible brackets are the reminder. |
| The Spec has no fact for a field | Write `[TBD: what is missing]` in English and `[JA TODO]` for a missing Japanese string. |
| A photo or image is missing | Use a generated, labelled placeholder: grey, text such as `PLACEHOLDER: Jamal portrait 1200×1500`, correct size from Spec §19. For people, use a neutral initials avatar. **Never** a generated face. |
| Booking availability | Dummy slots are fine (weekdays, the Spec's `[9:00–18:00]` window). Mark them as demo. |
| Sample assessment report (Spec §19) | A mock report using demo data, labelled "Sample". |
| Example chats on industry pages | The Spec already puts business details in `[brackets]` and requires the label "Example conversation. Details are illustrative." Keep both. |
| **Never use dummy data for:** legal page bodies, the Sadiatec client quote (stays empty, Spec §13), prices beyond the Spec's starter figures, client counts or results, team facts, certifications, or addresses | Use the bracketed placeholder or leave the field empty with the register entry. |

**Register.** Every placeholder gets a row in `docs/PLACEHOLDER-REGISTER.md`: ID, where it appears (page, field, locale), the placeholder text, the Spec section, the owner, and a status box. Appendix A lists the 21 items from Spec §1 and what is already known to be in later sections.

**Launch gate.** Step F1 extends the repo's existing preflight script with a `launch` check. It fails if any bracket placeholder, leftover clinic wording, banned claim, or placeholder image is still in published content or config. The site cannot ship while it fails. Appendix B lists what it scans for.

---

## 6 and 7. Recon and build steps

The recon plan (C1) is at the end of Pack 1. The build steps D1 to O3 are in Packs 2 to 4.

---

## 8. Definition of done for the whole project

- [ ] All 20 public routes and 3 legal routes render in `/ja` and `/en` with the Spec's content. The footer and header match Spec Section 4.
- [ ] Every Spec section has a tick in the section map in `docs/CLONE-PLAN.md`.
- [ ] Normal preflight passes. Launch preflight fails only on items in the register, each with an owner.
- [ ] `docs/PLACEHOLDER-REGISTER.md` is complete (Appendix A items plus everything found).
- [ ] Typecheck, tests, build and the accessibility check pass.
- [ ] The Technology page's stack table is proven by the repo, or marked `[CONFIRM]`.
- [ ] The founder switch removes the founder everywhere listed in 2.3.
- [ ] The original clinic folder is unchanged (`git status` clean there) and the two sites share no database.
- [ ] No secrets in git, in `.env.example` or in `docs/`.
- [ ] Jamal has reviewed every ★ checkpoint.

---


## 9. What stays with Jamal (not the developer's job)

- Deploying (Vercel or elsewhere), the custom domain and DNS. Resend's sandbox only delivers to the account owner's email until the techmirai-ai.com sending domain is verified, so form and booking emails will not reach real visitors before that.
- Creating the TechMirai LINE Official Account and replacing the placeholder URL.
- Closing every CONFIRM item (Appendix A), with the owners shown.
- Written permissions: Sadiatec (case study, partner wording, office address), and each team member (name and photo).
- Haruka's review of all Japanese copy. Director sign-off on homepage, positioning and pricing.
- Professional review of the privacy policy, terms and legal notice (an administrative scrivener or lawyer), and the accountant's tax wording.
- The founder visibility decision, including the conflict with the legal pages (2.3).
- Trademark search for "AI Reception" and "TechMirai" in J-PlatPat before printing more material.
- The production AI provider and plan for the chat fallback, and the analytics and cookie decision.
- After launch: Google Search Console and Bing Webmaster submissions, Google Business Profile (service-area business if there is no public address), a LinkedIn company page (not a personal profile), a partner link from Sadiatec's site, PageSpeed check on mobile.
- The old site's URL list for redirects.

---


## Appendix A: Placeholder and CONFIRM register (starting list)

Items 1 to 21 are from Spec Section 1 (pp.2-6). The register file holds one row per placeholder; this table is its seed.

| # | Item | Treatment on the site | Owner |
|---|---|---|---|
| 1 | Phone number | `[080-7701-3004]`. The brochure shows 080-7701-300 (10 digits). Reprint the brochure if it is printed. | Jamal |
| 2 | Prices | One starter price: `[from ¥300,000 setup + from ¥30,000/month]`. Old prices removed from site, FAQ, schema and chatbot. | Jamal + Director |
| 3 | Employer named | Name no employer, past or present | Jamal |
| 4 | Founder visibility | One CMS switch (2.3); decided before launch | Jamal |
| 5 | Years in Japan | `[about seven years]` | Jamal |
| 6 | Address and legal form | `[address you may publish]`. Sadiatec's written OK before using their office address. | Jamal + Sanaul Haque |
| 7 | Email | info@techmirai-ai.com everywhere; confirm the inbox works | Jamal |
| 8 | Claims to delete | None may appear (Appendix B) | Developer |
| 9 | "You own the application" | Say clients own their content and customer data; confirm against the contract | Jamal |
| 10 | "90% off" pricing | Never on the website | Everyone |
| 11 | Voice status | "In development — demo available"; confirm demos can run | Jamal |
| 12 | Booking-system integration | Honest wording; the assessment says what connects | Director |
| 13 | Add-on to existing websites | `[Add AI Reception to your current website]`, marked CONFIRM; remove if not ready | Jamal |
| 14 | Case-study permission | Sadiatec's written OK for name, screenshots, description; no prices | Jamal → Sanaul Haque |
| 15 | Team photos | Each person agrees in writing to name and photo being public | Each person |
| 16 | Haruka's name in Japanese | `[藤森 はるか]` (Fujimori Haruka) until she confirms | Haruka |
| 17 | Subsidy | FAQ says TechMirai is not currently a registered provider; update if that changes | Jamal |
| 18 | Client count | No client numbers anywhere | Everyone |
| 19 | Demo address and clinic name | `[demo.techmirai-ai.com]`; demo clinic labelled fictional; one clinic name to choose | Jamal |
| 20 | Consumption-tax wording | `[tax wording from your accountant]` | Jamal + accountant |
| 21 | Hours, reply times, support scope | `[weekdays 9:00–18:00]`, `[reply within 1 business day]`, `[report within 3 business days]`, `[N content updates per month]` | Jamal |

**Found in later sections (not exhaustive; Step C1 builds the full list):**

- Timelines `[X weeks]` (homepage 5.7, How It Works, PoC steps).
- Voice page: the callback sentence matches the current voice build or is removed (6.4).
- Integrations: which external calendars (`[CONFIRM]`); online payment at booking (`[CONFIRM]`).
- Pricing: prices of options, what the monthly fee covers, third-party fees, `[N]` updates per month, minimum contract period, payment method, terms for stopping and data export.
- Security: hosting provider and region, AI provider names (check their data terms before saying anything about training), retention period.
- Founder message is a DRAFT for Jamal to approve (10.2), with an optional personal sentence.
- Team: each person approves bio, photo and name in katakana or kanji; the new-engineer entry; the partner's katakana `[katakana from Mr. Haque]`.
- Partner clarity line and Mr. Haque's exact Japanese title (10.5).
- Company profile: business form (sole proprietorship or company), founding month and year, publishable address, main client (with permission), trade name in katakana (10.6).
- Technology table: Groq and Azure AI Speech rows, and any row the repo does not prove (11.5).
- Booking: in-person consultation area and who visits; meeting tool (12.4).
- Case study: client comment left empty; screenshots need Sadiatec's approval (13).
- FAQ: F19 minimum contract, F20 subsidy status, F24 where development is done, F25 in-person area.
- Blog: bylines for author and reviewer (15).
- Chat answer C09 on AI training: after checking the AI provider's terms (16.3).

---


## Appendix B: Launch-scan rules (from Spec Sections 1, 3 and 17)

The scan flags a hit. Each hit is either fixed or put on the allow-list with a written reason. Example of a correct allow-list entry: the case study's Japanese for "fully custom-coded" contains 完全 (perfect, complete), which is on the avoid list in other uses.

**B1. Leftover template wording (fail anywhere in published content or config)**
`Sakura`, `さくら` (sakura), `sakura-sekkotsu`, `Sakura Osteopathic Clinic`, `さくら整骨院` (Sakura bone-setting clinic), `さくら接骨院` (Sakura bone-setting clinic, alternate spelling), `.example` and `.invalid` addresses, `Demo Blog Post`, `Demo Service Brochure`, `clinic-demo`.
`Sadiatec` is allowed only where the Spec itself names it: homepage 5.8 and 5.11, About, the case study, FAQ and chat answers, structured data. Any other hit fails.

**B2. Old prices and discount framing**
`¥4,900`, `¥19,800`, `¥49,800`, `¥148,000`, `¥4,990,000`, and any "90%" discount wording.

**B3. Numbers and claims**
The Spec says "numbers only when facts we can prove; no percentages of improvement". Flag every `%` and every number that is not in the Spec. Specific claims to delete (Spec §1 item 8): "100% factual accuracy", "+20–30% bookings", "80% of calls handled", "+15% conversion", "sub-second response", "SLA guarantee", "never used to train third-party models", "lives on your infrastructure", "replace your receptionist". Any client count.

**B4. Words to avoid (Spec §3)**

| Avoid (EN) | Avoid (JA) | Scope |
|---|---|---|
| replace employees, cut staff | 人員削減 (staff cuts), 人件費削減 (labour cost cuts) | everywhere |
| 100%, perfect, never wrong | 100%, 完全 (perfect), 絶対 (absolute) | everywhere |
| autonomous agent | 自律型エージェント (autonomous agent) | everywhere |
| revolution, disrupt | 革命 (revolution), 破壊的 (disruptive) | everywhere |
| No.1, best in Japan | 業界No.1 (industry No.1) | everywhere |
| Agentic RAG, vector database, LLM, low-latency | エージェント型RAG (agentic RAG), ベクトルDB (vector database) | homepage only. /technology may use technical terms. |

**B5. Glossary rules (Spec §3)**
"Live demo", never "sample" for the demo. The voice edition is never "available now". Japanese copy never uses "escalation" (the Spec's term is "handoff to your staff"). "SME" never appears in body copy (use "small businesses"). Titles and schema say "TechMirai AI Reception"; body copy says "AI Reception".

**B6. Bracket placeholders**
Any `[...]` left in published text, config or structured data fails. Exception: text inside example-chat blocks keeps its brackets by design (Spec Section 7), and the "[Book] [Hours]" style button markers in the Spec are buttons, stored as separate fields, not text.

**B7. Technical**
Production robots allow indexing; sitemap lists both locales; hreflang and canonical on every page; `/thanks` is noindex; one H1 per page; every image has alt text in both languages; no placeholder image is published; JSON-LD contains no brackets.

---


## Appendix C: Spec section to step

| Spec section | Pages | Built in |
|---|---|---|
| 0 to 3: rules, facts to confirm, strategy, voice and glossary | 1-14 | F1 (register, scans), every copy step |
| 4: sitemap, navigation, footer | 14-19 | E1, E2 |
| 5: homepage | 19-33 | G1 to G4 |
| 6: AI Reception page | 33-37 | H1 |
| 7: industry pages | 37-45 | H2 |
| 8: How It Works, Integrations | 45-51 | H3 |
| 9: Pricing, Security & Support | 51-56 | I1 |
| 10: About | 56-61 | I2 |
| 11: Technology & AI PoC | 61-64 | I3 |
| 12: Free assessment and consultation booking | 64-70 | J1, J2 |
| 13: Case study (Sadiatec) | 70-73 | I3 |
| 14: FAQ | 73-78 | I4 |
| 15: Blog | 78-87 | I4 |
| 16: Reception chat knowledge base | 87-98 | K1, K2 |
| 17: SEO and GEO | 98-107 | L1, L2 |
| 18: Legal pages and compliance | 107-111 | M1 |
| 19: Photo and image brief | 111-113 | F3, N1 |
