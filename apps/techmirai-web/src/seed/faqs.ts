import type { Payload } from 'payload'
import { createLocalizedDoc } from '@techmirai/cms-core/seed'
import { richText } from './lib/rich-text'

interface FaqSeedItem {
  faqId: string
  category: string
  sortOrder: number
  en: { q: string; a: string }
  ja: { q: string; a: string }
}

// Spec §5.13 pulls exactly these six, in this order (F01, F07, F03, F14,
// F17, F22) — the Spec's own homepage display order, not numeric order.
// Text copied verbatim from Spec §14 (lines 1176-1217); brackets kept
// exactly per CLAUDE.md rule 5 (F03/F17 repeat brackets already tracked as
// F1-13/F1-02/F1-20 — see docs/PLACEHOLDER-REGISTER.md row G4-03).
// `keywords` is deliberately left unset — that's Spec §16.3/Pack-4/K1-K2
// scope, not G4's.
const ITEMS: FaqSeedItem[] = [
  {
    faqId: 'F01',
    category: 'about-ai-reception',
    sortOrder: 1,
    en: {
      q: 'What is AI受付?',
      a: 'A front desk for your website, chat and LINE. It answers common questions, takes reservations, sends reminders and hands customers to your staff when needed. A phone version is in development.',
    },
    ja: {
      q: 'AI受付とは何ですか？',
      a: 'ホームページ・チャット・LINEで働く受付の仕組みです。よくあるご質問に答え、予約を受け付け、リマインドを送り、必要なときはスタッフにおつなぎします。電話版は現在開発中です。',
    },
  },
  {
    faqId: 'F07',
    category: 'accuracy-and-safety',
    sortOrder: 2,
    en: {
      q: 'Will the AI give wrong answers?',
      a: 'Any AI can make mistakes, so we limit where AI is used. Most questions are answered by buttons and answers you approved. AI is used only when those find nothing, and only from your published content. Prices, availability and booking times always come from your booking data, never from AI. A person is always one tap away.',
    },
    ja: {
      q: 'AIが間違った回答をすることはありませんか？',
      a: 'AIは間違えることがあるため、AIを使う場面を限定しています。ほとんどのご質問は、ボタンと承認済みの回答で対応します。AIを使うのはそれで見つからないときだけで、根拠は公開中の情報に限ります。料金・空き状況・予約時間は必ず予約データから表示し、AIが作ることはありません。スタッフにも、いつでもワンタップでつながります。',
    },
  },
  {
    faqId: 'F03',
    category: 'about-ai-reception',
    sortOrder: 3,
    en: {
      q: 'Do I need a new website?',
      // PLACEHOLDER-OFF: 'or [add AI受付 to your current website]' (bracketed, unconfirmed option) hidden
      a: 'Not necessarily. We can build a new website with AI受付 built in. The free assessment shows which suits you.',
    },
    ja: {
      q: '新しいホームページが必要ですか？',
      // PLACEHOLDER-OFF: 'か、[今のホームページにAI受付を追加する]ことができます' (bracketed option) hidden
      a: '必ずしも必要ではありません。AI受付を組み込んだ新しいホームページをつくることができます。どちらが合うかは、無料診断でご案内します。',
    },
  },
  {
    faqId: 'F14',
    category: 'setup-and-integration',
    sortOrder: 4,
    en: {
      q: 'Can it connect to our current booking system?',
      a: "Case by case. If your system offers an API or data export, we can usually connect it. If not, AI受付's booking can take over, or your staff receive a notification for every booking. We check this in the free assessment.",
    },
    ja: {
      q: '今使っている予約システムとつながりますか？',
      a: 'システムによって異なります。API連携やデータ出力に対応していれば、多くの場合つなげられます。対応していない場合は、AI受付の予約機能に切り替えるか、予約のたびにスタッフへ通知が届く形にします。無料診断で確認します。',
    },
  },
  {
    faqId: 'F17',
    category: 'pricing-and-contract',
    sortOrder: 5,
    en: {
      q: 'How much does it cost?',
      // PLACEHOLDER-OFF: 'The AI受付 Starter Package starts from [¥300,000] for setup and [¥30,000] per month. ' (bracketed prices) hidden
      a: 'Your exact quote comes after the free assessment.',
    },
    ja: {
      q: '料金はいくらですか？',
      // PLACEHOLDER-OFF: 'AI受付 スタートパッケージは、初期費用[30万円]〜、月額[3万円]〜です。' (bracketed prices) hidden
      a: '正式なお見積りは、無料診断のあとにご提示します。',
    },
  },
  {
    faqId: 'F22',
    category: 'support',
    sortOrder: 6,
    en: {
      q: 'Can we talk to you in Japanese?',
      a: 'Yes. Consultations, quotes and support are all available in Japanese. Our client relations lead is bilingual in Japanese and English.',
    },
    ja: {
      q: '日本語で相談できますか？',
      a: 'はい。ご相談、お見積り、サポートまで、すべて日本語で対応します。お客様窓口の担当者は、日本語・英語のバイリンガルです。',
    },
  },
]

/**
 * Idempotent on re-run: `faqId` is unique, so each item is looked up before
 * creating. See docs/FINDINGS.md's G4 note — Pack-3/I4 (full 26-question
 * FAQ page) must upsert-by-faqId for the remaining 20, reusing these 6,
 * never duplicating or changing their faqId.
 */
export async function seedFaqs(payload: Payload): Promise<void> {
  let created = 0
  for (const item of ITEMS) {
    const existing = await payload.find({
      collection: 'faqs',
      where: { faqId: { equals: item.faqId } },
      limit: 1,
      depth: 0,
    })
    if (existing.docs[0]) continue

    await createLocalizedDoc(payload, 'faqs', {
      en: {
        faqId: item.faqId,
        question: item.en.q,
        answer: richText(item.en.a),
        category: item.category,
        homepage: true,
        sortOrder: item.sortOrder,
        active: true,
        slug: item.faqId.toLowerCase(),
      },
      ja: {
        faqId: item.faqId,
        question: item.ja.q,
        answer: richText(item.ja.a),
        category: item.category,
        homepage: true,
        sortOrder: item.sortOrder,
        active: true,
        slug: item.faqId.toLowerCase(),
      },
    })
    created++
  }
  payload.logger.info(`❓ FAQs seeded (${created} new of ${ITEMS.length} — Spec §5.13/§14 F01,F03,F07,F14,F17,F22)`)
}
