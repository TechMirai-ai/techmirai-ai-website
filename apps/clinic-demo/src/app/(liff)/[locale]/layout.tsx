import type { CSSProperties, ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { Inter, Noto_Sans_JP } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { buildCssVariables } from '@techmirai/cms-core/tokens'
import siteConfig from '../../../../site.config'
import { HtmlLangSetter } from '../../(frontend)/[locale]/_components/HtmlLangSetter'
import { LiffTopBar } from './_components/LiffTopBar'

const interFont = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-latin', display: 'swap', preload: false })
const notoSansJP = Noto_Sans_JP({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-ja', display: 'swap', preload: false })

const localeFontConfig: Record<string, { variableClass: string; cssVar: string }> = {
  en: { variableClass: interFont.variable, cssVar: '--font-latin' },
  ja: { variableClass: notoSansJP.variable, cssVar: '--font-ja' },
}

export function generateStaticParams() {
  return siteConfig.locales.enabled.map((locale) => ({ locale }))
}

/**
 * Thin locale layout for the LIFF route group — provides what BookingFlow
 * needs (NextIntlClientProvider for useTranslations/useLocale, the brand CSS
 * custom properties BookingFlow's className tokens read) plus the compact
 * LiffTopBar (clinic logo + language toggle). Deliberately skips
 * (frontend)/[locale]/layout.tsx's Header/Footer/ReceptionWidget/
 * FloatingCTAs/FAQ pre-fetch — none of that belongs inside a LINE in-app
 * browser webview (STEP 2 Part 2 item 1).
 */
export default async function LiffLocaleLayout({
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
  } as CSSProperties

  const fontClasses = [interFont.variable, notoSansJP.variable].join(' ')

  return (
    <NextIntlClientProvider messages={messages}>
      <HtmlLangSetter locale={locale} dir={dir} />
      <div className={fontClasses} style={wrapperStyle}>
        <LiffTopBar locale={locale} locales={siteConfig.locales.enabled} clinicName={siteConfig.site.name} />
        {children}
      </div>
    </NextIntlClientProvider>
  )
}
