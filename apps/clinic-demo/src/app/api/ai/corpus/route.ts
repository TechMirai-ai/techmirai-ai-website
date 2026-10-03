import { type NextRequest, NextResponse } from 'next/server'
import { compileAiCorpus } from '@techmirai/cms-core/reception/ai'
import { getCachedPayload } from '@/lib/payload'
import siteConfig from '../../../../../site.config'

/**
 * Bearer-token corpus dump for an external consumer.
 *
 * The compilation logic this route used to hold now lives in
 * `compileAiCorpus` (cms-core), because the in-app reception AI needs the same
 * content without an HTTP hop or a secret. This route is the external door
 * onto that one function — auth, locale validation, and an envelope.
 *
 * It therefore inherits the AI-scope decisions in `CORPUS_SOURCES`: blog and
 * news are no longer part of the corpus this returns.
 */
export async function GET(request: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const authHeader = request.headers.get('authorization')
  const expectedToken = process.env['AI_CORPUS_SECRET']

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // ── Locale ──────────────────────────────────────────────────────────────────
  const url = new URL(request.url)
  const requestedLocale = url.searchParams.get('locale') ?? siteConfig.locales.default
  const locale = siteConfig.locales.enabled.includes(requestedLocale)
    ? requestedLocale
    : siteConfig.locales.default

  try {
    const payload = await getCachedPayload()
    const documents = await compileAiCorpus({ payload, siteConfig, locale })

    return NextResponse.json({
      success: true,
      data: {
        locale,
        documents,
        totalDocuments: documents.length,
      },
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Corpus compilation failed' },
      { status: 500 },
    )
  }
}
