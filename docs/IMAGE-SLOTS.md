# Image slots (Spec §19, pp.111–113)

Source of truth in code: `apps/techmirai-web/src/lib/image-slots.ts`. `image-slots.test.ts` checks that every slot below is listed, that the alt text exists in both languages (or is marked decorative) and that the Spec p.113 alt text is word for word.

**Status:** `done` = built, nothing more to supply · `generated` = produced by code · `placeholder` = a labelled stand-in that must be replaced before launch · `not-built` = no file yet (register row says who supplies it).

Sizes appear only where the Spec gives one. Everything else is `[TBD: size not in Spec]` (CLAUDE.md rule 5).

## Rendered audit (2026-10-19, dev server, `sitemap.xml`)

40 routes (20 pages × 2 locales), 0 fetch errors, 154 `<img>` tags.

- **No image is missing the `alt` attribute.**
- **Empty alt (decorative):** the QR code on `/` and `/en` (inline `data:` image), and `/hero-placeholder.jpg` on `/blog` and `/en/blog` (clinic template leftover, N1-01).
- **Alt text on team cards** is the person's name only, because the shared `team-grid` block uses `alt={name}`. Spec p.113 wants the role too ("Jamal Shah, founder of TechMirai"). That is an engine change (rule 11), logged in `FINDINGS.md`, not made here.

## Slots

| Slot id | What | Page | Fills it today | Size | Status | Alt EN | Alt JA | Who supplies | Register |
|---|---|---|---|---|---|---|---|---|---|
| `portrait-jamal` | Portrait: Jamal Shah | Homepage 5.11, About 10.4 | `placeholder-team-jamal.png` | 1200×1500 (placeholder is 1200×1200) | placeholder | Jamal Shah, founder of TechMirai | TechMirai代表 ジャマル・シャー | The person (written consent) | N1-08, F1-15 |
| `portrait-maruf` | Portrait: Abdullah Al Maruf | Homepage 5.11, About 10.4 | `placeholder-team-abdullah.png` | 1200×1500 | placeholder | Placeholder portrait text | [JA TODO] | The person (written consent) | N1-09, F1-15 |
| `portrait-haruka` | Portrait: Haruka Fujimori | Homepage 5.11, About 10.4 | `placeholder-team-haruka.png` | 1200×1500 (placeholder is 1200×1200) | placeholder | Haruka Fujimori, sales and client relations | 営業・お客様窓口 [藤森 はるか] | The person (written consent) | N1-08, F1-15, F1-16 |
| `portrait-nahida` | Portrait: Nahida Rahaman | Homepage 5.11, About 10.4 | `placeholder-team-nahida.png` | 1200×1500 | placeholder | Placeholder portrait text | [JA TODO] | The person (written consent) | N1-09, F1-15 |
| `portrait-new-engineer` | Portrait: new engineer | Homepage 5.11, About 10.4 | `placeholder-team-new-engineer.png` | 1200×1500 | placeholder | Placeholder portrait text | [JA TODO] | Jamal (not hired yet) | N1-09, I2-06 |
| `portrait-partner` | Portrait: Md. Sanaul Haque | Homepage 5.11, About 10.5 | `placeholder-partner-sanaul-haque.png` | [TBD: size not in Spec] | placeholder | Placeholder portrait text | [JA TODO] | Sadiatec's approved photo | N1-09 |
| `portrait-generic` | Generic portrait placeholder | not placed | `placeholder-team-portrait.png` | 1200×1500 | placeholder | Placeholder portrait text | [JA TODO] | Developer (remove when unused) | N1-09, F3-16 |
| `team-group` | Team group photo | About hero 10.1 | `placeholder-team-group.png` | 2400×1350 | placeholder | Placeholder team group photo | [JA TODO] | Team (real workplace; never a composite) | N1-09, F3-15 |
| `haruka-at-work` | Haruka on a call or in a meeting | Homepage first-time card, Assessment | none | [TBD: size not in Spec] | not-built | written with the photo | written with the photo | Haruka, with client permission | N1-02 |
| `engineer-at-work` | Engineer with the admin panel on a laptop | Technology | none | [TBD: size not in Spec] | not-built | written with the photo | written with the photo | Engineer (no private data visible) | N1-03 |
| `hero-phone-mockup` | Phone mockup: chat answer, booking, LINE confirmation | Homepage hero 5.1 | `placeholder-hero-phone-mockup.png` | 750×1334 (chosen in G1) | placeholder | AI受付 answering a question and confirming a booking on a smartphone | スマートフォンでAI受付が質問に答え、予約を確定している画面 | Developer, from real demo screenshots | G1-01 |
| `three-step-strip` | Choose a service, pick a time, confirmed | Homepage 5.5 | three text pills (no image) | n/a | done | decorative | decorative | Developer | none |
| `before-after` | Static site vs. site with reception chat | Homepage 5.3 | none | [TBD: size not in Spec] | not-built | written with the image | written with the image | Designer or Jamal | N1-04 |
| `layers-diagram` | Layered answers diagram | How It Works | inline SVG block | vector | done | AI受付 answers with buttons first, then approved answers, then AI, with staff available at every step | AI受付は、ボタン、承認済みの回答、AIの順に答え、どの段階でもスタッフにつながる | Developer | none |
| `admin-screenshot` | Booking list and FAQ editor, demo data | How It Works, Technology | none | [TBD: size not in Spec] | not-built | written with the image | written with the image | Developer (demo data only) | N1-05 |
| `sample-report` | One-page mock report, labelled Sample | Assessment | none | [TBD: size not in Spec] | not-built | written with the image | written with the image | Developer / Jamal | N1-06 |
| `qr-code` | QR code to the live demo | Homepage 5.5, desktop only | generated by `src/lib/qr-code.ts` from `siteConfig.integrations.demoUrl` | 140×140 on page | done | decorative | decorative | Developer | none |
| `industry-images` | Clinic, beauty, automobile, hotel | Industry pages | none | [TBD: size not in Spec] | not-built | written with the image | written with the image | Jamal (stock or brand-green illustrations; never captioned as clients) | N1-07 |
| `logo` | Logo SVG | Header, footer, loader | `public/brand/logo.svg` (text wordmark) | vector | placeholder | TechMirai Logo | TechMirai Logo | Jamal (keep the current logo) | D2-02 |
| `favicon` | Square favicon source and `.ico` | Every page | `public/favicon.ico`, `public/brand/favicon-512.png` (old clinic icon) | square, 512×512 source | placeholder | decorative | decorative | Jamal | D2-02 |
| `blog-hero-background` | Blog index hero background (clinic template leftover) | `/blog`, `/en/blog` | `/hero-placeholder.jpg` | [TBD: size not in Spec] | placeholder | decorative | decorative | Jamal (or remove from the page) | N1-01 |
| `share-images` | Social share image per page | `og:image`, `twitter:image` | generated by `/og?path=&locale=` | 1200×630 | generated | not rendered in the page body | not rendered in the page body | Developer | L2-05 |
| `share-images-seeded` | Seeded `og-*.png` files, superseded and unused | none | `og-*.png` in the media collection | 1200×630 | placeholder | Placeholder social-share image | [JA TODO] | Developer (remove when convenient) | N1-09, F3-01 to F3-14, F3-17 to F3-20 |

## How the launch scan treats images

`checkB7Images` (in `scripts/launch-scan-rules.mjs`, called from `apps/techmirai-web/scripts/launch-scan-pages.ts`):

- a missing `alt` attribute fails;
- an empty `alt` is accepted as decorative;
- a file whose name contains `placeholder` fails with "placeholder image published", including through the `/_next/image?url=…` wrapper;
- inline `data:` images (the QR code) are skipped.

Every `placeholder` row above therefore shows up in the launch scan until a real image replaces it.
