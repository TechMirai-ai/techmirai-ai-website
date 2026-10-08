import type { Payload } from 'payload'
import { createLocalizedDoc } from '@techmirai/cms-core/seed'
import { richText } from './lib/rich-text'

type Industry = 'clinic' | 'beauty' | 'automobile' | 'hotel'

interface IndustryFaqItem {
  faqId: string
  en: { q: string; a: string }
  ja: { q: string; a: string }
}

// Spec §7.1-7.4's own FAQ tables, copied verbatim, 3 per industry.
// `faqId` values are scoped to this step (never reused by the homepage's
// F01-F26 range from faqs.ts) and are stable once set, per
// packages/cms-core/src/payload/collections/faqs.ts's own admin description.
const ITEMS: Record<Industry, IndustryFaqItem[]> = {
  clinic: [
    {
      faqId: 'IND-CLINIC-1',
      en: {
        q: 'Can it connect to our reception or medical-records software?',
        a: "We do not connect to electronic medical records. If you have no booking software, AI受付's booking and admin panel become your booking system. If you keep your current software, staff receive a notification for every booking so they can enter it there.",
      },
      ja: {
        q: '今使っている受付システムや電子カルテとつながりますか？',
        a: '電子カルテとの連携は行っていません。予約システムをお使いでない場合は、AI受付の予約機能と管理画面がそのまま予約台帳になります。今のシステムを使い続ける場合は、予約のたびにスタッフへ通知が届くため、そちらへの転記もスムーズです。',
      },
    },
    {
      faqId: 'IND-CLINIC-2',
      en: {
        q: 'Can older patients use it?',
        a: 'Booking takes a few taps on simple buttons, and your phone line stays open as before.',
      },
      ja: {
        q: 'ご高齢の患者さんでも使えますか？',
        a: 'ボタンを数回タップするだけで予約でき、これまでどおりお電話でも受け付けられます。',
      },
    },
    {
      faqId: 'IND-CLINIC-3',
      en: {
        q: 'Do your pages follow healthcare advertising rules?',
        a: 'Websites for clinics and treatment rooms in Japan are subject to advertising rules. We write with these in mind, and you approve every page before it goes live.',
      },
      ja: {
        q: '医療広告のルールには対応していますか？',
        a: 'クリニックや治療院のホームページには、広告に関するルールがあります。それを踏まえて作成し、公開前にすべてのページを確認・承認いただきます。',
      },
    },
  ],
  beauty: [
    {
      faqId: 'IND-BEAUTY-1',
      en: {
        q: 'We already use a booking portal. Can you connect to it?',
        a: "Booking portals often don't offer an open connection. One common approach is to keep the portal for new customers and use AI受付 with LINE for regulars. We check your setup in the free assessment.",
      },
      ja: {
        q: 'すでに予約サイトを使っています。連携できますか？',
        a: '予約サイトは、外部との連携に対応していないことが多くあります。新規のお客様は予約サイト、常連のお客様はAI受付とLINE、と使い分ける方法もあります。くわしくは無料診断で確認します。',
      },
    },
    {
      faqId: 'IND-BEAUTY-2',
      en: {
        q: 'Can customers rebook from LINE?',
        a: 'Yes. Customers book, change and cancel inside LINE, and receive reminders there.',
      },
      ja: {
        q: 'LINEから次回の予約はできますか？',
        a: 'はい。LINEの中で予約・変更・キャンセルができ、リマインドもLINEに届きます。',
      },
    },
    {
      faqId: 'IND-BEAUTY-3',
      en: {
        q: 'Will it answer questions about allergies?',
        a: 'No. Questions about allergies or skin conditions always go to your staff.',
      },
      ja: {
        q: 'アレルギーについての質問にも答えますか？',
        a: 'いいえ。アレルギーや肌の状態に関するご質問は、必ずスタッフにおつなぎします。',
      },
    },
  ],
  automobile: [
    {
      faqId: 'IND-AUTO-1',
      en: {
        q: 'Can AI受付 give repair estimates?',
        a: 'No. It collects the details — model, year and what is wrong — and passes them to your staff, who reply with the estimate.',
      },
      ja: {
        q: '修理の見積もりも出せますか？',
        a: 'いいえ。車種・年式・症状などの情報をお預かりしてスタッフに引き継ぎ、スタッフからお見積りをご連絡します。',
      },
    },
    {
      faqId: 'IND-AUTO-2',
      en: {
        q: 'Can customers book outside opening hours?',
        a: 'Yes. Bookings come in 24 hours a day, and staff see them when they start work.',
      },
      ja: {
        q: '営業時間外でも予約できますか？',
        a: 'はい。24時間ご予約を受け付け、スタッフは出勤時に内容を確認できます。',
      },
    },
    {
      faqId: 'IND-AUTO-3',
      en: {
        q: 'Does it remind customers when their inspection is due?',
        a: 'It sends a reminder before each booked appointment. Reminders for inspection due dates are not included today.',
      },
      ja: {
        q: '車検の時期をお客様に知らせてくれますか？',
        a: 'ご予約の前にリマインドを送ります。車検の満了時期のお知らせは、現在は対応していません。',
      },
    },
  ],
  hotel: [
    {
      faqId: 'IND-HOTEL-1',
      en: {
        q: 'Can guests book rooms through AI受付?',
        a: 'Room reservations stay with your current booking system or travel sites. AI受付 answers questions and sends guests to your booking page.',
      },
      ja: {
        q: 'AI受付で客室の予約はできますか？',
        a: '客室のご予約は、現在お使いの予約システムや旅行サイトをそのままご利用ください。AI受付はご質問に答え、予約ページへご案内します。',
      },
    },
    {
      faqId: 'IND-HOTEL-2',
      en: {
        q: 'Which languages can guests use?',
        a: 'Japanese and English as standard. Ask us about other languages.',
      },
      ja: {
        q: 'ゲストは何語で質問できますか？',
        a: '日本語と英語に標準対応しています。その他の言語はご相談ください。',
      },
    },
    {
      faqId: 'IND-HOTEL-3',
      en: {
        q: 'Can WhatsApp be used for handoff?',
        a: 'Yes. We have built WhatsApp handoff before, for a client with international customers.',
      },
      ja: {
        q: '引き継ぎにWhatsAppは使えますか？',
        a: 'はい。海外のお客様が多い企業向けに、WhatsAppでの引き継ぎを導入した実績があります。',
      },
    },
  ],
}

/**
 * Pack-3/H2 (Spec §7.1-7.4). Idempotent on re-run, same as faqs.ts's
 * seedFaqs: `faqId` is unique, looked up before creating. Returns each
 * industry's 3 doc ids in Spec order, for the industry page's `faq` block
 * `items` relationship array.
 */
export async function seedIndustryFaqs(payload: Payload): Promise<Record<Industry, (string | number)[]>> {
  const result: Record<Industry, (string | number)[]> = {
    clinic: [],
    beauty: [],
    automobile: [],
    hotel: [],
  }
  let created = 0

  for (const industry of Object.keys(ITEMS) as Industry[]) {
    for (const item of ITEMS[industry]) {
      const existing = await payload.find({
        collection: 'faqs',
        where: { faqId: { equals: item.faqId } },
        limit: 1,
        depth: 0,
      })

      if (existing.docs[0]) {
        result[industry].push(existing.docs[0]['id'] as string | number)
        continue
      }

      const doc = await createLocalizedDoc(payload, 'faqs', {
        en: {
          faqId: item.faqId,
          question: item.en.q,
          answer: richText(item.en.a),
          homepage: false,
          active: true,
          slug: item.faqId.toLowerCase(),
        },
        ja: {
          faqId: item.faqId,
          question: item.ja.q,
          answer: richText(item.ja.a),
          homepage: false,
          active: true,
          slug: item.faqId.toLowerCase(),
        },
      })
      result[industry].push((doc as { id: string | number }).id)
      created++
    }
  }

  payload.logger.info(`❓ Industry FAQs seeded (${created} new of 12 — Spec §7.1-7.4)`)
  return result
}
