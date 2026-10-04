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
   export. Do not copy from raw PDF text extraction... Never machine-translate or "improve"
   Japanese. If the Spec has no Japanese for a string, write [JA TODO] and add it to the register.
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
