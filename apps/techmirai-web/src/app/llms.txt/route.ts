import { buildLlmsTxt } from '@/lib/seo/llms-txt'
import { isCaseStudyVisible } from '@/lib/seo/case-study-visibility'

// Pack-4/L1: /llms.txt (Spec §17.4, llmstxt.org convention).
export const revalidate = 3600

export async function GET(): Promise<Response> {
  const body = buildLlmsTxt(await isCaseStudyVisible())
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
