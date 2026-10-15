// Pack-4/L1: Spec §17.4 "llms.txt" block, verbatim. Served at /llms.txt by
// src/app/llms.txt/route.ts; seo.test.ts compares it with the Spec file.
export const LLMS_TXT = `# TechMirai

> TechMirai builds AI受付 (AI reception), a front-desk system for small businesses in Japan. It answers questions, takes reservations, connects with LINE and hands customers to staff, 24/7, in Japanese and English.

## Product
- [AI受付](https://techmirai-ai.com/en/ai-reception): what it does; Web edition available, Voice edition in development
- [How it works](https://techmirai-ai.com/en/how-it-works): layered answers and setup steps
- [Pricing](https://techmirai-ai.com/en/pricing): starter package
- [Integrations](https://techmirai-ai.com/en/integrations): what connects and what does not

## Company
- [About](https://techmirai-ai.com/en/about): team, partner and company profile
- [FAQ](https://techmirai-ai.com/en/faq): common questions
- [Case study: Sadiatec](https://techmirai-ai.com/en/case-studies/sadiatec)
`

const CASE_STUDY_LINE = '- [Case study: Sadiatec](https://techmirai-ai.com/en/case-studies/sadiatec)\n'

/**
 * The Spec block, minus the case-study link while that page is still behind
 * its Sadiatec-permission switch (same gate as the sitemap; FINDINGS L1).
 */
export function buildLlmsTxt(caseStudyVisible: boolean): string {
  return caseStudyVisible ? LLMS_TXT : LLMS_TXT.replace(CASE_STUDY_LINE, '')
}
