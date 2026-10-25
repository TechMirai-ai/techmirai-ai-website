// SERVER COMPONENT
import Image from 'next/image'
import { getCachedPayload } from '@/lib/payload'
import { Container, Text } from '@techmirai/cms-core/components/ui'
import siteConfig from '../../../../../site.config'
import { Link } from '@/i18n/routing'
import { Mail, Phone, MessageCircle } from 'lucide-react'

interface FooterLink {
  label?: string
  href: string
}

interface FooterColumn {
  heading?: string
  links?: FooterLink[]
}

interface FooterGlobalData {
  columns?: FooterColumn[]
  copyrightText?: string
  contactEmail?: string
  officeAddress?: string
}

interface FooterProps {
  locale: string
}

// Pack-2/E2: brand line and bottom line (Content Spec §4, "Footer") — kept
// locally since they're footer-specific, not part of the shared global
// labels dictionary.
const footerCopy: Record<string, { brandLine: string; bottomLine: string; legalNotice: string; privacy: string; terms: string; lineQr: string }> = {
  en: {
    brandLine: 'TechMirai — AI voice agent for call centers and phone desks.',
    bottomLine: 'Built by an international engineering team.',
    legalNotice: 'Legal Notice',
    privacy: 'Privacy Policy',
    terms: 'Terms of Use',
    lineQr: 'LINE QR',
  },
  ja: {
    brandLine: 'TechMirai｜コールセンター・電話窓口向け AI音声エージェント',
    bottomLine: '国際的なエンジニアチームが開発しています。',
    legalNotice: '特定商取引法に基づく表記',
    privacy: 'プライバシーポリシー',
    terms: '利用規約',
    lineQr: 'LINE QRコード',
  },
}

export async function Footer({ locale }: FooterProps) {
  const payload = await getCachedPayload()
  const t = footerCopy[locale] ?? footerCopy['en']!

  let footerData: FooterGlobalData = {}
  try {
    const raw = await payload.findGlobal({
      slug: 'footer',
      depth: 1,
      locale: locale as 'en' | 'ja',
    })
    footerData = raw as FooterGlobalData
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.warn('[Footer] CMS unavailable:', err)
  }

  const columns = footerData.columns ?? []
  const currentYear = new Date().getFullYear()
  const copyrightText = footerData.copyrightText ?? `© ${currentYear} ${siteConfig.site.name}. ${t.bottomLine}`

  const dynamicPhone = siteConfig.contact.phone
  const dynamicEmail = footerData.contactEmail || siteConfig.contact.email

  return (
    <footer className="w-full bg-gradient-to-b from-brand-surface via-[var(--color-surface-alt)] to-brand-accent text-slate-800 pt-14 pb-8">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 pb-12">
          {/* Left Column: Brand line + Contact */}
          <div className="lg:col-span-5 flex flex-col space-y-5 text-left pr-0 lg:pr-6">
            <Link href="/" className="inline-block select-none focus:outline-none space-y-2">
              <div className="flex items-center gap-3">
                <div className="relative w-8 h-8 sm:w-10 sm:h-10 shrink-0">
                  <Image
                    src={`/${siteConfig.brand.logoFile}`}
                    alt={siteConfig.site.name}
                    fill
                    className="object-contain object-left"
                    priority
                  />
                </div>
                <span className="text-xl md:text-2xl font-bold tracking-wider uppercase text-slate-900">
                  {siteConfig.site.name}
                </span>
              </div>
            </Link>

            <p className="text-sm text-slate-700 font-medium leading-relaxed max-w-sm">
              {t.brandLine}
            </p>

            <div className="space-y-2.5 pt-2 text-xs sm:text-sm text-slate-800">
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-slate-900 shrink-0" />
                <a href={`tel:${dynamicPhone}`} className="font-semibold text-slate-900 hover:text-emerald-950 transition-colors">
                  {dynamicPhone}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-slate-900 shrink-0" />
                <a href={`mailto:${dynamicEmail}`} className="font-semibold text-slate-900 hover:text-emerald-950 transition-colors">
                  {dynamicEmail}
                </a>
              </div>
              <p className="text-slate-700">{siteConfig.contact.businessHours?.['weekdays'] ?? ''}</p>
              {/* LINE QR: no QR image asset exists yet — text link placeholder. See docs/PLACEHOLDER-REGISTER.md. */}
              <a
                href={siteConfig.reception.staffLineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-semibold text-slate-900 hover:text-emerald-950 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-slate-900 shrink-0" />
                {t.lineQr}
              </a>
            </div>
          </div>

          {/* Right Section: Product / Solutions / Company columns (CMS-driven) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
            {columns.slice(0, 3).map((column, idx) => (
              <div key={idx} className="flex flex-col">
                {column.heading && (
                  <p className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-900/20 pb-2">
                    {column.heading}
                  </p>
                )}
                <ul role="list" className="flex flex-col gap-2.5">
                  {(column.links ?? []).map((link, linkIdx) => (
                    <li key={linkIdx}>
                      {!link.href.startsWith('/') ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-800 hover:text-emerald-950 hover:font-bold font-medium transition-colors group"
                        >
                          <span className="text-slate-900 text-xs transition-transform group-hover:translate-x-0.5">•</span>
                          <span>{link.label ?? link.href}</span>
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-800 hover:text-emerald-950 hover:font-bold font-medium transition-colors group"
                        >
                          <span className="text-slate-900 text-xs transition-transform group-hover:translate-x-0.5">•</span>
                          <span>{link.label ?? link.href}</span>
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Section: Copyright & Legal Links */}
        <div className="border-t border-white/30 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/90">
          <Text as="span" className="font-medium text-slate-900">
            {copyrightText}
          </Text>

          <div className="flex items-center gap-4 text-slate-900 font-medium">
            <Link href="/privacy" className="hover:text-emerald-950 hover:font-bold transition-colors">
              {t.privacy}
            </Link>
            <span>|</span>
            <Link href="/terms" className="hover:text-emerald-950 hover:font-bold transition-colors">
              {t.terms}
            </Link>
            <span>|</span>
            <Link href="/legal-notice" className="hover:text-emerald-950 hover:font-bold transition-colors">
              {t.legalNotice}
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  )
}
