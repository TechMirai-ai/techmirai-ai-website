# Placeholder register

Columns: ID | page and field | locale | placeholder text | Spec section | owner | status.

| ID | Page/field | Locale | Placeholder text | Spec section | Owner | Status |
|---|---|---|---|---|---|---|
| D2-01 | `site.config.ts` `brand.colors` (secondary/accent/iconAccent/deepAccent/buttonAccent/buttonAccentHover/priceHighlight); `packages/cms-core/src/styles/globals.css` `--color-brand-dark`/`--color-brand-accent`/`--color-brand-accent-hover` | n/a | Temporary navy `#1B2A45` / orange `#D97706` hex values | Section 0 ("Build rules"), Section 19 ("Brand rules") | Jamal | OPEN — brochure (`TECHMIRAI_BROCHURE.html`) not yet supplied |
| D2-02 | `site.config.ts` `brand.logoFile`/`faviconFile`; `public/brand/logo.svg`; `public/favicon.ico` | en/ja | Text wordmark "TechMirai" in place of a real logo; favicon left as the old clinic icon | Section 0 ("Build rules") | Jamal | OPEN — logo/favicon source not yet supplied |
| D2-03 | `site.config.ts` `reception.staffLineUrl` | n/a | Fake-but-valid placeholder URL `https://line.me/R/ti/p/~techmirai-placeholder` | Section 17.3 (JSON-LD `sameAs`) | Jamal | OPEN — Spec gives only the bracket token `[LINE Official Account URL]`, no real/placeholder-shaped URL |
| E2-01 | `/privacy`, `/terms`, `/legal-notice` pages | en/ja | `[PLACEHOLDER: final legal text to be added.]` | n/a — CLAUDE.md rule 7 | Jamal | OPEN — never write legal text; needs real Privacy Policy / Terms of Use / 特定商取引法 text and legal review |
