// SERVER COMPONENT
import Image from 'next/image'
import { getCachedPayload } from '@/lib/payload'
import { Container, Text } from '@techmirai/cms-core/components/ui'
import { lexicalToText } from '@techmirai/cms-core/payload/lib/richtext-to-text'
import { RichText } from '@payloadcms/richtext-lexical/react'
import siteConfig from '../../../../../site.config'
import { Link } from '@/i18n/routing'
import { MapPin, Phone, Calendar, MessageCircle, PhoneCall } from 'lucide-react'

const PLACEHOLDER_MARKER = '[PLACEHOLDER'

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

const labels: Record<
  string,
  {
    address: string
    inquiries: string
    followUs: string
    ctaTitle: string
    ctaSub: string
    reservation: string
    callUs: string
    brandSubtitle: string
    slogan: string
    privacy: string
    terms: string
    sitemap: string
  }
> = {
  en: { 
    address: 'Address', 
    inquiries: 'Inquiries', 
    followUs: 'Follow us',
    ctaTitle: 'Ready to visit Sakura?',
    ctaSub: 'Make an appointment or contact us today.',
    reservation: 'Online Reservation',
    callUs: 'Call Us',
    brandSubtitle: 'OSTEOPATHIC CLINIC',
    slogan: 'Caring for your health, comfort & everyday movement.',
    privacy: 'Privacy Policy',
    terms: 'Terms of Use',
    sitemap: 'Site Map',
  },
  ja: {
    address: '所在地',
    inquiries: 'お問い合わせ',
    followUs: 'フォローする',
    ctaTitle: 'ご予約・お問い合わせ',
    ctaSub: 'お気軽にご相談・ご予約ください。',
    reservation: 'Web予約',
    callUs: 'お電話',
    brandSubtitle: 'さくら整骨院',
    slogan: 'あなたの健康、快適さ、そして毎日の動きをサポートします。',
    privacy: 'プライバシーポリシー',
    terms: '利用規約',
    sitemap: 'サイトマップ',
  },
}

export async function Footer({ locale }: FooterProps) {
  const payload = await getCachedPayload()
  
  const t = (labels[locale] || labels['en']) as typeof labels['en']

  let footerData: FooterGlobalData = {}
  try {
    const raw = await payload.findGlobal({
      slug: 'footer',
      locale: locale as 'en' | 'ja',
    })
    footerData = raw as FooterGlobalData
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.warn('[Footer] CMS unavailable:', err)
  }

  const columns = footerData.columns ?? []
  const currentYear = new Date().getFullYear()
  const copyrightText =
    footerData.copyrightText ?? `© ${currentYear} ${siteConfig.site.name} Osteopathic Clinic`

  const dynamicPhone = siteConfig.contact?.phone || '000-0000-0000'
  const dynamicAddress =
    footerData.officeAddress ||
    siteConfig.contact.address?.[locale] ||
    siteConfig.contact.address?.en ||
    '〒000-0000\nTokyo, Japan'

  type DisclaimerLexicalState = Parameters<typeof RichText>[0]['data']

  // medical-disclaimer is only a registered Payload global when
  // siteConfig.verticals.clinic is on (see config-factory.ts) — fetching it
  // otherwise throws, so it's skipped entirely rather than fetched and caught.
  let disclaimer: DisclaimerLexicalState | undefined
  if (siteConfig.verticals.clinic) {
    try {
      const raw = await payload.findGlobal({
        slug: 'medical-disclaimer',
        locale: locale as 'en' | 'ja',
      })
      disclaimer = (raw as { disclaimer?: DisclaimerLexicalState }).disclaimer
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.warn('[Footer] medical-disclaimer global unavailable:', err)
    }
  }

  return (
    <footer className="w-full bg-gradient-to-b from-brand-surface via-[#eedad5] to-brand-accent text-slate-800 pt-14 pb-8">
      <Container>
        {/* Top Section: Clinic Info & 3-Column Navigation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 pb-12">
          
          {/* Left Column: Brand & Contact Info */}
          <div className="lg:col-span-5 flex flex-col space-y-5 text-left pr-0 lg:pr-6">
            <Link href="/" className="inline-block select-none focus:outline-none space-y-2">
              <div className="flex items-center gap-3">
                <div className="relative w-8 h-8 sm:w-10 sm:h-10 shrink-0">
                  <Image
                    src="/brand/logo3.png"
                    alt="Clinic Logo"
                    fill
                    className="object-contain object-left"
                    priority
                  />
                </div>
                <span className="text-xl md:text-2xl font-bold tracking-wider uppercase text-slate-900">
                  SAKURA
                </span>
              </div>
              <p className="text-xs font-semibold tracking-widest uppercase text-slate-700">
                {t.brandSubtitle}
              </p>
            </Link>

            <p className="text-sm text-slate-700 font-medium leading-relaxed max-w-sm">
              {t.slogan}
            </p>

            <div className="space-y-3 pt-2 text-xs sm:text-sm text-slate-800">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-slate-900 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900 mb-0.5">{t.address}</p>
                  <p className="whitespace-pre-line text-slate-700 leading-snug">{dynamicAddress}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <Phone className="w-4 h-4 text-slate-900 shrink-0" />
                <a
                  href={`tel:${dynamicPhone}`}
                  className="font-semibold text-slate-900 hover:text-emerald-950 transition-colors"
                >
                  {dynamicPhone}
                </a>
              </div>
            </div>
          </div>

          {/* Right Section: 3 Menu Columns */}
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
                      <Link
                        href={link.href}
                        className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-800 hover:text-emerald-950 hover:font-bold font-medium transition-colors group"
                      >
                        <span className="text-slate-900 text-xs transition-transform group-hover:translate-x-0.5">•</span>
                        <span>{link.label ?? link.href}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Middle Banner: Reservation / Contact Call-to-Action */}
        <div className="border border-white/20 pt-8 pb-8 text-center space-y-5 bg-white/30 backdrop-blur-xs rounded-2xl my-2 px-4 shadow-xs">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-wide">
              {t.ctaTitle}
            </h3>
            <p className="text-xs sm:text-sm text-slate-800">
              {t.ctaSub}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-800/20 bg-white/90 hover:bg-slate-900 hover:text-white transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 text-xs sm:text-sm font-semibold text-slate-900 group"
            >
              <Calendar className="w-4 h-4 text-slate-800 group-hover:text-white transition-colors" />
              <span>[{t.reservation}]</span>
            </Link>

            <a
              href="https://line.me/R/ti/p/@470vmlzv"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-emerald-600/30 bg-white/90 hover:bg-emerald-600 hover:text-white transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 text-xs sm:text-sm font-semibold text-slate-900 group"
            >
              <MessageCircle className="w-4 h-4 text-emerald-700 group-hover:text-white transition-colors" />
              <span>[ LINE ]</span>
            </a>

            <a
              href={`tel:${dynamicPhone}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-sky-600/30 bg-white/90 hover:bg-[#EE7A93] hover:text-white transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 text-xs sm:text-sm font-semibold text-slate-900 group"
            >
              <PhoneCall className="w-4 h-4 text-[#EE7A93] group-hover:text-white transition-colors" />
              <span>[{t.callUs}]</span>
            </a>
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
            <Link href="/sitemap" className="hover:text-emerald-950 hover:font-bold transition-colors">
              {t.sitemap}
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  )
}