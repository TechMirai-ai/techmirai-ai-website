import type { Metadata } from 'next'
import { staticPageMetadata } from '@/lib/seo/build-metadata'
import { Container, Heading, Text } from '@techmirai/cms-core/components/ui'
import { LegalPage } from '../_components/LegalPage'
import { JsonLd } from '@/lib/seo/JsonLd'
import { launchBreadcrumbJsonLd } from '@/lib/seo/voice-json-ld'

type Props = { params: Promise<{ locale: string }> }

// Voice-pivot (ECC Master Prompt v2 §9): the policy must also cover forms,
// demo recordings, transcription, retention, access and contact. CLAUDE.md
// rule 7 forbids writing legal wording, so this panel only lists the TOPICS
// the professional's text has to cover. It is not policy text.
const SCOPE_NOTE = {
  en: {
    heading: 'Draft scope — for professional review',
    body: 'This page explains how TechMirai handles personal information; it is for anyone using our forms or demo, and you can contact us from the Contact page. It is a draft. Last updated: [TBD: owner to confirm date]. Responsible company: [TBD: legal company name]. The final policy written by a professional must cover:',
    topics: [
      'Information entered in the contact, partnership and overview-download forms',
      'Voice demo recordings, if and when live calls are offered',
      'Transcription and AI summaries of demo calls',
      'Retention periods and who can access the data',
      'How to contact TechMirai about your information',
    ],
  },
  ja: {
    heading: '想定範囲（ドラフト）：専門家による確認用',
    body: 'このページは、TechMiraiが個人情報をどのように取り扱うかを説明するもので、フォームやデモをご利用になる方向けです。お問い合わせはお問い合わせページからご連絡ください。現在はドラフトです。最終更新日：[TBD：オーナー確認待ち]。責任主体：[TBD：正式な会社名]。専門家が作成する最終版のポリシーでは、次の内容を扱う必要があります。',
    topics: [
      'お問い合わせ・協業相談・概要資料ダウンロードの各フォームに入力された情報',
      'ライブ通話を提供する場合の、音声デモの録音',
      'デモ通話の文字起こしとAIによる要約',
      '保存期間と、データにアクセスできる者',
      'ご自身の情報についてTechMiraiへ問い合わせる方法',
    ],
  },
} as const

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return staticPageMetadata('/privacy', locale)
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params
  const note = SCOPE_NOTE[locale === 'ja' ? 'ja' : 'en']
  const breadcrumb = launchBreadcrumbJsonLd(locale === 'ja' ? 'ja' : 'en', '/privacy')

  return (
    <>
      {breadcrumb && <JsonLd data={breadcrumb} />}
      <LegalPage locale={locale} page="privacy" />
      <Container className="max-w-3xl pb-24">
        <aside className="rounded-2xl border border-dashed border-emerald-300 bg-white p-6 shadow-sm">
          <Heading level={2} className="mb-2 text-base font-semibold">
            {note.heading}
          </Heading>
          <Text className="mb-2 text-sm text-text-secondary">{note.body}</Text>
          <ul className="list-disc space-y-1 pl-5 text-sm text-text-secondary">
            {note.topics.map((topic, i) => (
              <li key={i}>{topic}</li>
            ))}
          </ul>
        </aside>
      </Container>
    </>
  )
}
