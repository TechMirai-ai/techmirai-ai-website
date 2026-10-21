import { type NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { compileAiCorpus, handleReceptionAiRequest, type CorpusDocument } from '@techmirai/cms-core/reception/ai'
import { redactPii } from '@techmirai/cms-core/payload/lib/redact'
import { getCachedPayload } from '@/lib/payload'
import { checkRateLimit } from '@/lib/rate-limit'
import { extractIp } from '@/lib/request-ip'
import siteConfig from '../../../../../site.config'

/**
 * One grounded AI answer for the reception widget's free-text question node.
 *
 * An adapter, in the same shape as the booking routes: NextRequest in,
 * `handleReceptionAiRequest` decides, NextResponse out. Deliberately NOT
 * routed through /api/ai/query -> AI_AGENT_BASE_URL, which proxies to an
 * external agent microservice that does not exist for this deployment; that
 * route is left untouched and unused.
 */

/**
 * The corpus is the same handful of CMS documents for every visitor asking in
 * a given locale, and re-querying five collections per question would put the
 * database in the request path of every question typed. Cached the same way
 * the search index is, and short enough that a staff edit shows up without a
 * deploy.
 */
const CORPUS_TTL_SECONDS = 300

const getCachedCorpus = unstable_cache(
  async (locale: string): Promise<CorpusDocument[]> => {
    const payload = await getCachedPayload()
    return compileAiCorpus({ payload, siteConfig, locale })
  },
  ['reception-ai-corpus'],
  { revalidate: CORPUS_TTL_SECONDS, tags: ['reception-ai-corpus'] },
)

export async function POST(request: NextRequest) {
  let body: unknown = null
  try {
    body = await request.json()
  } catch {
    // Left null — the handler's schema rejects it as an invalid body.
  }

  const result = await handleReceptionAiRequest(
    { body, ip: extractIp(request) },
    {
      enabled: siteConfig.features.aiAgent && siteConfig.reception.enabled,
      checkRateLimit,
      loadCorpus: getCachedCorpus,
      logError: (message, error) => {
        // Provider errors can echo visitor text: mask emails and phone numbers.
        if (error === undefined) console.error(redactPii(message))
        else console.error(redactPii(message), redactPii(error instanceof Error ? error.message : String(error)))
      },
    },
  )

  return NextResponse.json(result.body, { status: result.status })
}
