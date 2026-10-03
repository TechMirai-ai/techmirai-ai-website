import type { Payload } from 'payload'
import { richText } from './lib/rich-text'

const FAQ_ITEMS = [
  {
    ja: { question: '保険は使えますか？', answer: '打撲や捻挫など急性のケガは健康保険が適用されます。慢性的な症状の施術や骨盤矯正などの自費メニューは保険適用外となりますので、受付にてお気軽にご確認ください。' },
    en: { question: 'Can I use my health insurance?', answer: 'Health insurance covers acute injuries such as bruises and sprains. Chronic-condition treatment and self-pay programs like pelvic alignment are not covered by insurance — please ask at reception if you are unsure.' },
    category: { ja: '保険・お支払い', en: 'Insurance & Payment' },
    homepage: true,
  },
  {
    ja: { question: '予約は必要ですか？', answer: '保険診療は予約不要で受け付けております。自費メニューは十分な施術時間を確保するため、事前のご予約をおすすめしています。' },
    en: { question: 'Do I need an appointment?', answer: 'Insured treatment is walk-in, no appointment needed. For self-pay programs, we recommend booking ahead so we can set aside enough time for your session.' },
    category: { ja: 'ご予約', en: 'Appointments' },
    homepage: true,
  },
  {
    ja: { question: '初めての来院時に必要なものはありますか？', answer: '健康保険証をお持ちください。交通事故治療の場合は、事故証明書とご加入の保険会社の連絡先もあわせてご持参いただくとスムーズです。' },
    en: { question: 'What should I bring for my first visit?', answer: 'Please bring your health insurance card. For traffic-accident treatment, bringing your accident report and insurance company contact details will help your first visit go smoothly.' },
    category: { ja: '初めての方へ', en: 'First Visit' },
    homepage: true,
  },
  {
    ja: { question: '交通事故治療も対応していますか？', answer: 'はい、自賠責保険を使った交通事故治療に対応しております。保険会社とのやり取りについても、スタッフがサポートいたします。' },
    en: { question: 'Do you treat traffic accident injuries?', answer: 'Yes, we treat traffic-accident injuries under compulsory auto (jibaiseki) insurance, and our staff can help you coordinate with your insurance company.' },
    category: { ja: '交通事故治療', en: 'Traffic Accidents' },
    homepage: false,
  },
  {
    ja: { question: '施術時間はどのくらいですか？', answer: '内容によって異なりますが、保険診療は15〜30分程度、自費メニューは30〜45分程度を目安にお考えください。' },
    en: { question: 'How long does a treatment session take?', answer: 'It depends on the treatment — insured sessions typically run 15–30 minutes, and self-pay programs run around 30–45 minutes.' },
    category: { ja: '施術について', en: 'Treatment' },
    homepage: false,
  },
  {
    ja: { question: '子供や高齢者でも施術を受けられますか？', answer: 'はい、お子様からご高齢の方まで、それぞれの症状やお身体の状態に合わせた施術を行っておりますので、ご安心ください。' },
    en: { question: 'Can children and elderly patients receive treatment?', answer: 'Yes — we tailor every treatment to the patient’s condition and physical needs, from children through to elderly patients.' },
    category: { ja: '施術について', en: 'Treatment' },
    homepage: false,
  },
  {
    ja: { question: '駐車場はありますか？', answer: '院の裏手に2台分の専用駐車場をご用意しております。満車の場合は、近隣のコインパーキングをご利用ください。' },
    en: { question: 'Is parking available?', answer: 'We have two dedicated parking spaces behind the clinic. If both are in use, nearby coin-operated parking lots are available.' },
    category: { ja: 'アクセス', en: 'Access' },
    homepage: false,
  },
  {
    ja: { question: 'お支払い方法は何がありますか？', answer: '現金のほか、主要なクレジットカード・電子マネー・QRコード決済がご利用いただけます。' },
    en: { question: 'What payment methods do you accept?', answer: 'In addition to cash, we accept major credit cards, e-money, and QR code payments.' },
    category: { ja: '保険・お支払い', en: 'Insurance & Payment' },
    homepage: false,
  },
  {
    ja: { question: '妊娠中でも骨盤矯正を受けられますか？', answer: 'はい、妊娠中の方に向けて、お身体への負担が少ない施術をご用意しております。安定期に入ってからのご来院をおすすめしております。' },
    en: { question: 'Can I get pelvic correction while pregnant?', answer: 'Yes, we offer gentle treatment designed for pregnancy. We recommend visiting once you have entered the stable second trimester.' },
    category: { ja: '産前産後ケア', en: 'Pre/Postnatal Care' },
    homepage: false,
  },
]

export async function seedDemoFAQs(payload: Payload): Promise<string[]> {
  const ids: string[] = []
  for (const [i, item] of FAQ_ITEMS.entries()) {
    const slug = `demo-faq-${i + 1}`
    const doc = await payload.create({
      collection: 'faqs',
      locale: 'ja',
      data: {
        question: item.ja.question,
        answer: richText(item.ja.answer),
        category: item.category.ja,
        homepage: item.homepage,
        sortOrder: i + 1,
        active: true,
        slug,
        aiVisible: true,
      },
    })
    await payload.update({
      collection: 'faqs',
      id: doc.id,
      locale: 'en',
      data: {
        question: item.en.question,
        answer: richText(item.en.answer),
        category: item.category.en,
      },
    })
    ids.push(doc.id as string)
  }
  return ids
}
