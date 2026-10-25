import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import siteConfig from '../../../site.config'
import { isCaseStudyVisible } from '@/lib/seo/case-study-visibility'
import { CASE_STUDY_PATH, OG_IMAGE_SIZE, metaRowFor } from '@/lib/seo/og-image'

// Pack-4/L2: one 1200×630 share image per public page, with the page title in
// the page's language (Spec §17.2, §19). Japanese is drawn with the bundled
// Noto Sans JP Bold (SIL OFL 1.1, src/lib/seo/fonts/OFL.txt) — read from disk,
// never fetched at runtime. Only paths with a Spec §17.1/legal row are served.
export const runtime = 'nodejs'

const FONT_PATH = join(process.cwd(), 'src/lib/seo/fonts/NotoSansJP-Bold.otf')
let fontData: Promise<Buffer> | undefined

const GENERIC_CASE_STUDY_TITLE = { en: 'Case study', ja: '導入事例' } as const

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path') ?? ''
  const locale = searchParams.get('locale')
  if (locale !== 'en' && locale !== 'ja') return new Response('Unknown locale', { status: 404 })
  const row = metaRowFor(path)
  if (!row) return new Response('Unknown page', { status: 404 })

  // Same Sadiatec-permission gate as the page itself: the Spec title names
  // Sadiatec, so the hidden page's image keeps the generic stub title.
  const title =
    path === CASE_STUDY_PATH && !(await isCaseStudyVisible()) ? GENERIC_CASE_STUDY_TITLE[locale] : row[locale].title

  fontData ??= readFile(FONT_PATH)
  let font: Buffer
  try {
    font = await fontData
  } catch (error: unknown) {
    fontData = undefined
    console.error('[og] font file could not be read', error)
    return new Response('Share image unavailable', { status: 500 })
  }

  const { primary, secondary } = siteConfig.brand.colors
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          backgroundColor: primary,
          color: secondary,
          fontFamily: 'Noto Sans JP',
        }}
      >
        <div style={{ display: 'flex', fontSize: 64, lineHeight: 1.3, fontWeight: 700 }}>{title}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 30, opacity: 0.9 }}>
          <span>{siteConfig.site.name}</span>
          <span>{siteConfig.site.domain}</span>
        </div>
      </div>
    ),
    {
      ...OG_IMAGE_SIZE,
      fonts: [{ name: 'Noto Sans JP', data: font, weight: 700, style: 'normal' }],
      headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' },
    },
  )
}
