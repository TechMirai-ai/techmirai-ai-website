import type { CSSProperties, ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { MotionConfig } from 'framer-motion'
import { Inter, Noto_Sans_JP } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { buildCssVariables } from '@techmirai/cms-core/tokens'
import { ReceptionWidget } from '@techmirai/cms-core/reception/ui'
import siteConfig from '../../../../site.config'
import { Header } from './_components/Header'
import { resolveHeaderData } from './_components/resolveHeaderData'
import { Footer } from './_components/Footer'
import { HtmlLangSetter } from './_components/HtmlLangSetter'
import { FloatingCTAs } from '@techmirai/cms-core/components/ui' 
// Import the new wrapper
import { LayoutWrapper } from './_components/LayoutWrapper'


const interFont = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-latin', display: 'swap', preload: false })
const notoSansJP = Noto_Sans_JP({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-ja', display: 'swap', preload: false })

const skipLabel: Record<string, string> = {
  en: 'Skip to main content',
  ja: 'メインコンテンツへスキップ',
}

const localeFontConfig: Record<string, { variableClass: string; cssVar: string }> = {
  en: { variableClass: interFont.variable, cssVar: '--font-latin' },
  ja: { variableClass: notoSansJP.variable, cssVar: '--font-ja' },
}

export function generateStaticParams() {
  return siteConfig.locales.enabled.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!siteConfig.locales.enabled.includes(locale)) {
    notFound()
  }

  setRequestLocale(locale)
  const messages = await getMessages()
  const { lineButton } = await resolveHeaderData(locale)

  // The chat's text is static (techmirai-chat-content.ts). Only per-client
  // URLs come from config, and only an http(s) one is a real link: the demo
  // URL is still a bracketed CONFIRM placeholder, so its button stays hidden
  // (docs/PLACEHOLDER-REGISTER.md, K1-03). The widget sits here, not in the
  // root layout, so BookingFlow inside it has NextIntlClientProvider above it.
  const hostLinks = {
    ...(siteConfig.reception.staffLineUrl ? { line: siteConfig.reception.staffLineUrl } : {}),
    ...(siteConfig.integrations.demoUrl ? { demo: siteConfig.integrations.demoUrl } : {}),
  }

  const dir = (siteConfig.locales.direction[locale] ?? 'ltr') as 'ltr' | 'rtl'
  const brandVars = buildCssVariables(siteConfig)

  const activeFontConfig = localeFontConfig[locale]
  const activeFontVar = activeFontConfig ? `var(${activeFontConfig.cssVar})` : `var(--font-ja)`

  const wrapperStyle: CSSProperties = {
    ...brandVars,
    '--font-sans': `${activeFontVar}, system-ui, sans-serif`,
    fontFamily: 'var(--font-sans)',
    color: 'var(--color-text)',
    backgroundColor: 'var(--color-background)',
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
  } as CSSProperties

  const fontClasses = [interFont.variable, notoSansJP.variable].join(' ')

  return (
    <NextIntlClientProvider messages={messages}>
      {/* Respects prefers-reduced-motion: reduce for every framer-motion component
          app-wide (blocks, header, mobile menu, etc.) without touching each file. */}
      <MotionConfig reducedMotion="user">
      <HtmlLangSetter locale={locale} dir={dir} />
      <div className={fontClasses} style={wrapperStyle}>
        <a
          href="#main-content"
          className="absolute -top-full left-4 z-50 rounded bg-primary px-4 py-2 text-sm font-medium text-white transition-all focus:top-4"
        >
          {skipLabel[locale] ?? skipLabel['en']}
        </a>
        <Header locale={locale} />
        
        {/* Wrapping children in LayoutWrapper prevents the jumpy behavior */}
        <main id="main-content" className="flex-1">
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </main>
        
        <Footer locale={locale} />
        <FloatingCTAs lineUrl={lineButton?.href} />
        {siteConfig.reception.enabled && (
          <ReceptionWidget
            enabled={siteConfig.reception.enabled}
            greeting={siteConfig.reception.greeting}
            openDelayMs={siteConfig.reception.openDelayMs}
            locales={siteConfig.reception.locales}
            locale={locale}
            clinicPhone={siteConfig.reception.clinicPhone}
            hostLinks={hostLinks}
            clinicName={siteConfig.site.name}
            accentColor={siteConfig.brand.colors.primary}
          />
        )}
      </div>
      </MotionConfig>
    </NextIntlClientProvider>
  )
}