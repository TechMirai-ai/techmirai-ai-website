import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { staticPageMetadata } from '@/lib/seo/build-metadata'
import siteConfig from '../../../../../site.config'
import { FileText } from 'lucide-react'
import { ContactForm, type FormLabels, type InquiryPath } from './_components/ContactForm'
import { JsonLd } from '@/lib/seo/JsonLd'
import { launchBreadcrumbJsonLd } from '@/lib/seo/voice-json-ld'

export const revalidate = 3600

const LOCALES = ['en', 'ja'] as const
type Locale = (typeof LOCALES)[number]

function isLocale(s: string): s is Locale {
  return (LOCALES as readonly string[]).includes(s)
}

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ path?: string }>
}

export async function generateStaticParams() {
  return siteConfig.locales.enabled.map((locale) => ({ locale }))
}

// Voice-pivot (docs/ECC MASTER PROMPT TechMirai Voice Website v2 §9). The two
// inquiry-path labels are the prompt's exact Japanese; all other Japanese is
// DRAFT written at the owner's request (2026-10-21) and needs native review
// (register V1-01).
const RINGI_PDF_HREF = '/downloads/techmirai-ringi-overview.pdf'

const formLabels: Record<Locale, FormLabels> = {
  en: {
    adoptionPath: 'Consult about adopting the AI voice agent',
    partnershipPath: 'Consult about partnership',
    pathLegend: 'What would you like to discuss?',
    name: 'Name',
    company: 'Company',
    role: 'Role',
    email: 'Email',
    phone: 'Phone (optional)',
    optionalHeading: 'Optional details',
    callVolume: 'Call volume range',
    hoursToCover: 'Hours to cover',
    languages: 'Languages',
    goal: 'Goal',
    consent:
      'I agree that TechMirai may use the information I enter to reply to this inquiry. Read the',
    privacyLink: 'privacy policy',
    submit: 'Send inquiry',
    submitting: 'Sending…',
    success: 'Thank you. We have received your inquiry.',
    error: 'Something went wrong. Please try again.',
    required: 'Required',
    consentRequired: 'Please agree before sending.',
  },
  ja: {
    adoptionPath: 'AI音声エージェントの導入を相談する',
    partnershipPath: '協業について相談する',
    pathLegend: 'ご相談内容をお選びください',
    name: 'お名前',
    company: '会社名',
    role: '役職・担当',
    email: 'メールアドレス',
    phone: '電話番号（任意）',
    optionalHeading: '任意項目',
    callVolume: '想定の通話量',
    hoursToCover: '対応したい時間帯',
    languages: '対応言語',
    goal: 'ご相談の目的',
    consent: '入力した情報を、このお問い合わせへの返信のためにTechMiraiが利用することに同意します。詳しくは',
    privacyLink: 'プライバシーポリシー',
    submit: '送信する',
    submitting: '送信中…',
    success: 'ありがとうございます。お問い合わせを受け付けました。',
    error: 'エラーが発生しました。もう一度お試しください。',
    required: '必須',
    consentRequired: '送信前に同意をお願いします。',
  },
}

const copy: Record<Locale, { pill: string; title: string; summary: string; ringiHeading: string; ringiBody: string; ringiLink: string }> = {
  en: {
    pill: 'Consultation',
    title: 'Contact',
    summary:
      'Use this form to consult TechMirai about adopting the AI voice agent or about a white-label partnership. We use your details only to reply. Last updated: [TBD: owner to confirm date]. Responsible company: [TBD: legal company name].',
    ringiHeading: 'Overview for internal approval (ringi)',
    ringiBody:
      'A 1–2 page overview you can share internally: what it is, how it works, the PoC flow, a privacy summary and contact. It contains placeholders the owner must review before sharing.',
    ringiLink: 'Download the overview (PDF)',
  },
  ja: {
    pill: 'ご相談',
    title: 'お問い合わせ',
    summary:
      'AI音声エージェントの導入、またはホワイトラベルでの協業について、TechMiraiにご相談いただくためのフォームです。ご入力いただいた情報は、返信のためにのみ利用します。最終更新日：[TBD：オーナー確認待ち]。責任主体：[TBD：正式な会社名]。',
    ringiHeading: '社内稟議用の概要資料',
    ringiBody:
      '社内で共有できる1〜2ページの概要資料です。サービスの内容、仕組み、PoCの流れ、プライバシーの要点、連絡先をまとめています。共有前に、オーナーが確認すべきプレースホルダーが含まれます。',
    ringiLink: '概要資料をダウンロード（PDF）',
  },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  return staticPageMetadata('/contact', locale)
}

export default async function ContactPage({ params, searchParams }: Props) {
  if (!siteConfig.features.contact) notFound()

  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const { path } = await searchParams
  const initialPath: InquiryPath = path === 'partnership' ? 'partnership' : 'adoption'
  const text = copy[locale]
  const breadcrumb = launchBreadcrumbJsonLd(locale, '/contact')

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-white via-bg-tertiary/60 to-white px-4 pb-16 pt-10 sm:px-6 md:pb-20 md:pt-14 lg:px-8">
      {breadcrumb && <JsonLd data={breadcrumb} />}
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-6 h-80 w-80 rounded-full bg-emerald-100/60 blur-3xl" />
      <div className="relative mx-auto max-w-2xl">
        <span className="inline-block rounded-full border border-emerald-200 bg-white/80 px-4 py-1.5 text-[12px] font-semibold text-brand-primary">
          {text.pill}
        </span>
        <h1 className="mt-4 text-[28px] font-bold leading-[1.35] tracking-tight text-text-primary sm:text-4xl">{text.title}</h1>
        <p className="mt-4 text-[14px] leading-[1.9] text-text-secondary">{text.summary}</p>

        <div className="mt-8 rounded-2xl border border-border-default bg-white p-6 shadow-sm md:p-8">
          <ContactForm locale={locale} labels={formLabels[locale]} apiPath="/api/forms/contact" initialPath={initialPath} />
        </div>

        <div id="ringi" className="mt-6 flex items-start gap-4 rounded-2xl border border-border-default bg-white p-6 shadow-sm">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-bg-tertiary text-brand-primary">
            <FileText aria-hidden="true" size={22} />
          </span>
          <div>
            <h2 className="text-[16px] font-bold text-text-primary">{text.ringiHeading}</h2>
            <p className="mt-1 text-[13px] leading-[1.8] text-text-secondary">{text.ringiBody}</p>
            <a href={RINGI_PDF_HREF} download className="mt-4 inline-flex items-center rounded-full border-2 border-brand-primary px-5 py-2.5 text-[13px] font-semibold text-brand-primary hover:bg-bg-tertiary">
              {text.ringiLink}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
