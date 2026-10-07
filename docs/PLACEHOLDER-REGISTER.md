# Placeholder register

Columns: ID | page and field | locale | placeholder text | Spec section | owner | status.

| ID | Page/field | Locale | Placeholder text | Spec section | Owner | Status |
|---|---|---|---|---|---|---|
| D2-01 | `site.config.ts` `brand.colors` (secondary/accent/iconAccent/deepAccent/buttonAccent/buttonAccentHover/priceHighlight); `packages/cms-core/src/styles/globals.css` `--color-brand-dark`/`--color-brand-accent`/`--color-brand-accent-hover` | n/a | Temporary navy `#1B2A45` / orange `#D97706` hex values | Section 0 ("Build rules"), Section 19 ("Brand rules") | Jamal | OPEN — brochure (`TECHMIRAI_BROCHURE.html`) not yet supplied |
| D2-02 | `site.config.ts` `brand.logoFile`/`faviconFile`; `public/brand/logo.svg`; `public/favicon.ico` | en/ja | Text wordmark "TechMirai" in place of a real logo; favicon left as the old clinic icon | Section 0 ("Build rules") | Jamal | OPEN — logo/favicon source not yet supplied |
| D2-03 | `site.config.ts` `reception.staffLineUrl` | n/a | Fake-but-valid placeholder URL `https://line.me/R/ti/p/~techmirai-placeholder` | Section 17.3 (JSON-LD `sameAs`) | Jamal | OPEN — Spec gives only the bracket token `[LINE Official Account URL]`, no real/placeholder-shaped URL |
| E2-01 | `/privacy`, `/terms`, `/legal-notice` pages | en/ja | `[PLACEHOLDER: final legal text to be added.]` | n/a — CLAUDE.md rule 7 | Jamal | OPEN — never write legal text; needs real Privacy Policy / Terms of Use / 特定商取引法 text and legal review. Pack-2/F3: `pages` docs for all three slugs now exist (`apps/techmirai-web/src/seed/pages/plain-pages.ts`), empty `layout`; the frontend routes still render this placeholder text via the `LegalPlaceholder` component, not yet CMS-driven |
| F1-01 | `site.config.ts` `contact.phone` | n/a | `[080-7701-3004]` | Spec p.2-6, item 1 | Jamal | OPEN — brochure shows a 10-digit number (080-7701-300); invoice shows the 11-digit number used here; reprint brochure if printed |
| F1-02 | Pricing page (not yet built) | n/a | `[from ¥300,000 setup + from ¥30,000/month]` | Spec p.2-6, item 2 | Jamal + Director | NOT YET BUILT — registered by the Pack-3/I1 (Pricing) step that builds the field; old prices (¥4,900/¥19,800/¥49,800/¥148,000/¥4,990,000) must not appear anywhere |
| F1-03 | n/a — process/permission item | n/a | n/a — process/permission item | Spec p.2-6, item 3 | Jamal | OPEN — no page may name any past or present employer; enforced by review, not an automated rule |
| F1-04 | Founder card (not yet built) | n/a | n/a — process/permission item | Spec p.2-6, item 4; WORK-ORDER.md decision 5 / §2.3 | Jamal | OPEN — one CMS switch to be built in F2; seeded visible for local review only; Jamal decides before any public deploy |
| F1-05 | About page founder bio (not yet built) | n/a | `[about seven years]` | Spec p.2-6, item 5 | Jamal | NOT YET BUILT — registered by the Pack-3/I2 (About/team) step that builds the field |
| F1-06 | `site.config.ts` `contact.address` | en/ja | Code currently has `[Address you may publish]` (en) / `[掲載可能な住所]` (ja); Spec's literal wording is `[one address you are allowed to publish]` | Spec p.2-6, item 6 | Jamal + Sanaul Haque | OPEN — needs Sadiatec's written OK before using their office address; wording mismatch vs. Spec also flagged, see docs/FINDINGS.md |
| F1-07 | `site.config.ts` `contact.email` / identity constants | n/a | n/a — process/permission item | Spec p.2-6, item 7 | Jamal | OPEN — info@techmirai-ai.com used everywhere per D2; inbox functionality not confirmed |
| F1-08 | n/a — enforced by launch-scan rule B3 | n/a | n/a — process/permission item | Spec p.2-6, item 8 | Developer | ENFORCED by launch-scan rule B3, not a content placeholder — closes automatically once B3 passes with no allow-list entries |
| F1-09 | n/a — contract/copy confirmation | n/a | n/a — process/permission item | Spec p.2-6, item 9 | Jamal | OPEN — copy must say clients own their content and customer data; confirm against the actual contract |
| F1-10 | n/a — enforced by launch-scan rule B2 | n/a | n/a — process/permission item | Spec p.2-6, item 10 | Everyone | ENFORCED by launch-scan rule B2 — never shown on the website |
| F1-11 | Voice product pages (not yet built) | en/ja | "In development — demo available" / 開発中（デモあり） | Spec p.2-6, item 11 | Jamal | NOT YET BUILT — voice edition must never read "available now" |
| F1-12 | Integrations page (not yet built) | n/a | n/a — process/permission item (honest status-table wording) | Spec p.2-6, item 12 | Director | NOT YET BUILT — registered by the Pack-3/I1 step that builds the Integrations page; status table (works now / case by case / not offered) per Spec |
| F1-13 | Homepage or Solutions copy (not yet built in this form) | en/ja | `[Add AI受付 to your current website]`, marked CONFIRM | Spec p.2-6, item 13 | Jamal | NOT YET BUILT — remove if the standalone chat widget isn't ready for non-TechMirai sites; registered by the Pack-3 step that builds this copy |
| F1-14 | Case study page (not yet built) | n/a | n/a — process/permission item | Spec p.2-6, item 14 | Jamal → Sanaul Haque | OPEN — needs Sadiatec's written OK for name, screenshots and description before the case-study page can publish; no prices ever |
| F1-15 | Team/About pages (not yet built) | n/a | n/a — process/permission item | Spec p.2-6, item 15 | Each person (OWNER ACTION) | OPEN — each person must agree in writing to their name and photo being public before publishing |
| F1-16 | Team/About pages (not yet built) | ja | `[藤森 はるか]` (Fujimori Haruka) | Spec p.2-6, item 16 | Haruka | NOT YET BUILT — confirm kanji with Haruka before the Pack-3/I2 step seeds this field |
| F1-17 | FAQ page (not yet built) | en/ja | n/a — process/permission item (plain factual statement) | Spec p.2-6, item 17 | Jamal | NOT YET BUILT — FAQ must say TechMirai is not currently a registered IT-subsidy provider; update if that changes |
| F1-18 | n/a — enforced by launch-scan rule B3 | n/a | n/a — process/permission item | Spec p.2-6, item 18 | Everyone | ENFORCED by launch-scan rule B3 — no client numbers anywhere |
| F1-19 | `site.config.ts` `integrations.demoUrl` | n/a | `[demo.techmirai-ai.com]` | Spec p.2-6, item 19 | Jamal | OPEN — demo clinic must be labelled fictional; one clinic name to be chosen; seeded demo content still uses the real Sakura clinic template name, tracked separately in docs/FINDINGS.md |
| F1-20 | Pricing page (not yet built) | n/a | `[tax wording from your accountant]` | Spec p.2-6, item 20 | Jamal + accountant | NOT YET BUILT — registered by the Pack-3/I1 (Pricing) step that builds the field |
| F1-21 | `site.config.ts` `contact.businessHours.weekdays` (live); reply/report/update-cadence text (not yet built) | n/a | `[Weekdays 9:00–18:00]` (live, flat non-localized string); `[reply within 1 business day]`, `[report within 3 business days]`, `[N content updates per month]` (not yet in repo) | Spec p.2-6, item 21 | Jamal | PARTIAL — hours live in `site.config.ts` but rendered identically on ja/en (flat string, not locale-split — noted in docs/FINDINGS.md); reply/report/update-cadence sub-items not yet built |

| F3-01 | `pages` (`home`) `meta.image` | n/a | `PLACEHOLDER: Home social share 1200×630` | Spec §19 ("Social share images: one per page, 1200×630") | Developer | OPEN — generated by `apps/techmirai-web/src/seed/media.ts`; real image pending Spec art direction |
| F3-02 | `pages` (`product`) `meta.image` | n/a | `PLACEHOLDER: Product social share 1200×630` | Spec §19 | Developer | OPEN — same as F3-01 |
| F3-03 | `pages` (`solutions`) `meta.image` | n/a | `PLACEHOLDER: Solutions social share 1200×630` | Spec §19 | Developer | OPEN — same as F3-01 |
| F3-04 | `pages` (`how-it-works`) `meta.image` | n/a | `PLACEHOLDER: How It Works social share 1200×630` | Spec §19 | Developer | OPEN — same as F3-01 |
| F3-05 | `pages` (`integrations`) `meta.image` | n/a | `PLACEHOLDER: Integrations social share 1200×630` | Spec §19 | Developer | OPEN — same as F3-01 |
| F3-06 | `pages` (`pricing`) `meta.image` | n/a | `PLACEHOLDER: Pricing social share 1200×630` | Spec §19 | Developer | OPEN — same as F3-01 |
| F3-07 | `pages` (`security`) `meta.image` | n/a | `PLACEHOLDER: Security social share 1200×630` | Spec §19 | Developer | OPEN — same as F3-01 |
| F3-08 | `pages` (`about`) `meta.image` | n/a | `PLACEHOLDER: About social share 1200×630` | Spec §19 | Developer | OPEN — same as F3-01 |
| F3-09 | `pages` (`technology`) `meta.image` | n/a | `PLACEHOLDER: Technology social share 1200×630` | Spec §19 | Developer | OPEN — same as F3-01 |
| F3-10 | `pages` (`assessment`) `meta.image` | n/a | `PLACEHOLDER: Free AI Website Assessment social share 1200×630` | Spec §19 | Developer | OPEN — same as F3-01 |
| F3-11 | `pages` (`faq`) `meta.image` | n/a | `PLACEHOLDER: FAQ social share 1200×630` | Spec §19 | Developer | OPEN — same as F3-01 |
| F3-12 | `pages` (`privacy`) `meta.image` | n/a | `PLACEHOLDER: Privacy Policy social share 1200×630` | Spec §19 | Developer | OPEN — same as F3-01 |
| F3-13 | `pages` (`terms`) `meta.image` | n/a | `PLACEHOLDER: Terms of Use social share 1200×630` | Spec §19 | Developer | OPEN — same as F3-01 |
| F3-14 | `pages` (`legal-notice`) `meta.image` | n/a | `PLACEHOLDER: Legal Notice social share 1200×630` | Spec §19 | Developer | OPEN — same as F3-01 |
| F3-15 | Team group photo (not yet placed on a page) | n/a | `PLACEHOLDER: Team group photo 2400×1350` | Spec §19 ("Team group photo... landscape 2400×1350 px") | Developer → each person (consent, F1-15) | OPEN — generated, unassigned; Phase G decides placement once real photo/consent exists |
| F3-16 | Individual portrait placeholder (not yet placed on a page) | n/a | neutral initials avatar, 1200×1500 | Spec §19 ("Individual portraits... 1200×1500 px") | Developer → each person (consent, F1-15) | OPEN — generated, unassigned; never a generated face per CLAUDE.md |

**Note on the phone mockup, admin-panel screenshot, layered-answers diagram, and sample
assessment report visuals (Spec §19):** Pack-2/F3 deliberately did NOT generate placeholders for
these — the Spec gives no explicit pixel size for any of them, and inventing a confident-looking
default size would violate CLAUDE.md's "do not invent facts" rule. Logged as a gap in
`docs/FINDINGS.md` for Phase G to size and register once each visual's actual on-page usage is
known.

**Note on Appendix A's "found in later sections" items** (timelines, integrations detail, pricing detail, security, founder message, team bios beyond #15/#16, company profile detail, technology table, booking, case-study detail beyond #14, FAQ items F19/F20/F24/F25, blog bylines, chat answer C09): these are explicitly out of F1's scope — F1's own Read list names only Spec p.2-6 and p.11-14 (Appendix A's 21 numbered items), and `docs/WORK-ORDER.md` Appendix A itself frames the later-sections bullets as "not exhaustive; Step C1 builds the full list." None of that content exists in the repo yet. Each Pack-3/4 step that builds a page is responsible for adding its own register row(s) when it creates the field, the same way F1-02/05/11/12/13/16/17/20 above are already pre-registered against steps that haven't run yet.
