import { notFound } from 'next/navigation'
import siteConfig from '../../../../../../site.config'
import { LiffManageClient } from './LiffManageClient'

type Props = { params: Promise<{ locale: string }> }

export async function generateStaticParams() {
  return siteConfig.locales.enabled.map((locale) => ({ locale }))
}

/**
 * STEP 2 Part 4 item 2 — the LIFF manage URL, registered as its own LIFF
 * app's endpoint in the LINE Developers Console (LIFF apps are one endpoint
 * per app; a subpath appended to a LIFF URL does not change which endpoint
 * loads — verified against LINE's docs this session — so this needs a
 * separate LIFF app/ID from the booking page's, same pattern LINE itself
 * requires for any second distinct LIFF-hosted flow). All actual LIFF/manage
 * logic lives in LiffManageClient ('use client' — liff.init() only runs in
 * the browser); this file is just locale validation + config, matching
 * line/booking/page.tsx's pattern.
 */
export default async function LiffManagePage({ params }: Props) {
  if (!siteConfig.features.bookingWidget) notFound()

  const { locale } = await params
  if (!siteConfig.locales.enabled.includes(locale)) notFound()

  return (
    <LiffManageClient
      locale={locale}
      clinicName={siteConfig.site.name}
      clinicPhone={siteConfig.contact.phone ?? ''}
      cancellationCutoffHours={siteConfig.booking.cancellationCutoffHours}
    />
  )
}
