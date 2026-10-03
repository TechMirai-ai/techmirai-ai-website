import { expect, test, type Page } from '@playwright/test'
import siteConfig from '../site.config'

/**
 * Reception widget journey — Step 3, Part 6.
 *
 * The widget (packages/cms-core/.../reception) is mounted app-wide in the
 * locale layout, so any page under /[locale] carries it; every test here
 * starts on the ja home page and opens it via the launcher button (never
 * waits for the teaser — openDelayMs is 8s and irrelevant to these flows).
 * Flat test() calls, no test.describe() — matching booking-journey.spec.ts
 * and manage-appointment.spec.ts's existing convention in this file.
 *
 * Two things are mocked at the network boundary, same rationale as
 * booking-journey.spec.ts (deterministic, no real external quota spent):
 *   - POST /api/reception/ai (the Groq-backed grounded-answer call) for the
 *     AI-fallback and rate-limit paths.
 *   - Nothing else. The medical-refusal and off-topic paths are answered
 *     entirely client-side by screenQuestion() (screening.ts) — the widget
 *     never calls the endpoint for them, and each test below asserts that
 *     directly rather than assuming it.
 *
 * NOT covered here: the static-FAQ-match happy path (test.skip, see its own
 * comment) and the staffLineUrl-unset case (covered at the component level
 * in ReceptionPanel.test.tsx's "talk to staff (faq.staff)" tests — see the
 * "staff link — present after..." test below for why that half of the
 * check can't run against a live site.config value in an E2E environment).
 */

const CLINIC_NAME = siteConfig.site.name
const AI_ENDPOINT = '**/api/reception/ai'

const COPY = {
  ja: {
    faqMenuOption: '質問がある',
    askOption: '質問を入力する',
    staffOption: 'LINEでスタッフに相談する',
    staffCta: 'LINEでチャットを開く',
    otherOption: '症状・施術についてのご質問',
    askPlaceholder: 'ご質問を入力してください。お答えできる範囲でご案内します。',
    send: '送信',
    refusalSnippet: '担当の施術者に直接ご確認ください',
    offTopicSnippet: '当院のご利用に関するご質問のみお答えしております',
    safeFallbackSnippet: 'ただいま自動でのご案内ができませんでした',
    medicalQuestion: '肩が痛いです',
    offTopicQuestion: '今日の天気はどうですか',
    // NOT 'クレジットカードは使えますか': after the FAQ content replacement
    // (faq-content.ts) that now static-matches faq.prices — faq-36's real
    // question ("健康保険は使えますか？") shares the literal phrase
    // "は使えますか" with it. See faq-matcher.test.ts's "ambiguous
    // phrasings" suite.
    clinicQuestion: 'ペットを連れて行っても良いですか',
    mockedAnswer: '施術中はペットの同伴はご遠慮いただいております。',
  },
  en: {
    faqMenuOption: 'Ask a question',
    askOption: 'Type your own question',
    staffOption: 'Talk to our staff on LINE',
    staffCta: 'Open LINE chat',
    otherOption: 'Questions about symptoms or treatment',
    askPlaceholder: "Type your question and we'll try to answer it.",
    send: 'Send',
    refusalSnippet: 'please ask the practitioner directly',
    offTopicSnippet: 'we can only help with questions about the clinic',
    safeFallbackSnippet: "we couldn't answer that automatically just now",
    medicalQuestion: 'My shoulder hurts',
    offTopicQuestion: "What's the weather like today?",
    clinicQuestion: 'Do you accept credit cards?',
    mockedAnswer: 'We accept both cash and credit cards.',
  },
} as const

type LocaleKey = keyof typeof COPY

async function openWidget(page: Page): Promise<void> {
  await page.goto('/ja')
  await page.getByRole('button', { name: CLINIC_NAME }).click()
}

async function switchToEnglish(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'EN', exact: true }).click()
}

async function openFaqMenu(page: Page, locale: LocaleKey): Promise<void> {
  await openWidget(page)
  if (locale === 'en') await switchToEnglish(page)
  await page.getByRole('button', { name: COPY[locale].faqMenuOption }).click()
}

async function askFreeText(page: Page, locale: LocaleKey, question: string): Promise<void> {
  await page.getByRole('button', { name: COPY[locale].askOption }).click()
  await page.getByPlaceholder(COPY[locale].askPlaceholder).fill(question)
  await page.getByRole('button', { name: COPY[locale].send }).click()
}

// ─────────────────────────────────────────────────────────────────────────
// 1. Happy path: static FAQ match
// ─────────────────────────────────────────────────────────────────────────

test('happy path: a question the static matcher should catch renders the correct FAQ answer, then returns to the menu', async ({
  page,
}) => {
  // Was PENDING CONTENT / skipped: the six FAQ nodes' answer text used to
  // come from CLINIC_FAQ_SLUGS/resolveClinicFaqAnswers (a live, never-seeded
  // Payload `faqs` query — every FAQ answer rendered the "not ready yet"
  // fallback). That mechanism is now retired; both the free-text match this
  // test drives and the button it corresponds to read faq-content.ts
  // directly (faq-answers.ts) — see the delivery report.
  await openFaqMenu(page, 'ja')
  await askFreeText(page, 'ja', '駐車場はありますか')
  await expect(page.getByText(/アクセス.*ページをご確認ください/)).toBeVisible()
  // Back at the menu, not stuck mid-conversation.
  await expect(page.getByText(COPY.ja.staffOption)).toBeVisible()
})

test('happy path: tapping the "Parking" button directly gives the same answer as the free-text match above', async ({ page }) => {
  await openFaqMenu(page, 'ja')
  await page.getByRole('button', { name: '駐車場' }).click()
  await expect(page.getByText(/アクセス.*ページをご確認ください/)).toBeVisible()
})

// ─────────────────────────────────────────────────────────────────────────
// 2 + 7. AI fallback path, in both locales
// ─────────────────────────────────────────────────────────────────────────

for (const locale of ['ja', 'en'] as const) {
  test(`AI fallback (${locale}): a clinic question with no FAQ match renders the grounded answer, then returns to the menu`, async ({
    page,
  }) => {
    const c = COPY[locale]
    let aiCalled = false
    await page.route(AI_ENDPOINT, async (route) => {
      aiCalled = true
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'answered', answer: c.mockedAnswer }),
      })
    })

    await openFaqMenu(page, locale)
    await askFreeText(page, locale, c.clinicQuestion)

    await expect(page.getByText(c.mockedAnswer)).toBeVisible()
    expect(aiCalled).toBe(true)

    // Back at the menu: the faq.menu choice buttons render again (no second
    // "what would you like to know?" prompt — suppressNextPrompt), proving
    // the backTo loop actually landed there rather than leaving the widget stuck.
    await expect(page.getByText(c.staffOption)).toBeVisible()
  })
}

// ─────────────────────────────────────────────────────────────────────────
// 3. Medical refusal path — never reaches the AI endpoint (client-side screenQuestion)
// ─────────────────────────────────────────────────────────────────────────

test('medical refusal: an obviously symptom-related question gets the fixed refusal message, never an AI answer, and never calls the endpoint', async ({
  page,
}) => {
  const c = COPY.ja
  let aiCalled = false
  await page.route(AI_ENDPOINT, async (route) => {
    aiCalled = true
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'answered', answer: 'nope' }) })
  })

  await openFaqMenu(page, 'ja')
  await askFreeText(page, 'ja', c.medicalQuestion)

  await expect(page.getByText(c.refusalSnippet)).toBeVisible()
  await expect(page.getByText(c.offTopicSnippet)).not.toBeVisible()
  expect(aiCalled).toBe(false)
})

// ─────────────────────────────────────────────────────────────────────────
// 4. Off-topic path — different fixed message than refusal, also client-side only
// ─────────────────────────────────────────────────────────────────────────

test('off-topic: a clearly unrelated question gets the fixed off-topic message — distinct from the refusal message — and never calls the endpoint', async ({
  page,
}) => {
  const c = COPY.ja
  let aiCalled = false
  await page.route(AI_ENDPOINT, async (route) => {
    aiCalled = true
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'answered', answer: 'nope' }) })
  })

  await openFaqMenu(page, 'ja')
  await askFreeText(page, 'ja', c.offTopicQuestion)

  await expect(page.getByText(c.offTopicSnippet)).toBeVisible()
  await expect(page.getByText(c.refusalSnippet)).not.toBeVisible()
  expect(aiCalled).toBe(false)
})

// ─────────────────────────────────────────────────────────────────────────
// 5. Staff LINE link — present at the menu, present after an AI answer
//    (via backTo), and points at the real configured URL.
// ─────────────────────────────────────────────────────────────────────────

test('staff link: is present at the top-level FAQ menu, pointing at the configured LINE URL', async ({ page }) => {
  const staffLineUrl = siteConfig.reception.staffLineUrl
  expect(staffLineUrl, 'this app currently has reception.staffLineUrl configured — see site.config.ts').toBeTruthy()

  await openFaqMenu(page, 'ja')
  await page.getByRole('button', { name: COPY.ja.staffOption }).click()

  const link = page.getByRole('link', { name: COPY.ja.staffCta })
  await expect(link).toHaveAttribute('href', staffLineUrl!)
  await expect(link).toHaveAttribute('target', '_blank')
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
})

// The staffLineUrl-unset ("hidden, not broken") half of this check is NOT
// repeated here: reception.staffLineUrl is a single compile-time
// site.config.ts value for the whole running app under test, not something
// an E2E run can flip per-test. It's already covered deterministically at
// the component level — see ReceptionPanel.test.tsx's "talk to staff
// (faq.staff)" tests, which render <ReceptionPanel> directly with
// staffLineUrl omitted / blank and assert the option never appears.

test('staff link: is present after an AI answer, via the backTo loop, without re-opening the menu', async ({ page }) => {
  const staffLineUrl = siteConfig.reception.staffLineUrl
  await page.route(AI_ENDPOINT, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'answered', answer: COPY.ja.mockedAnswer }),
    })
  })

  await openFaqMenu(page, 'ja')
  await askFreeText(page, 'ja', COPY.ja.clinicQuestion)
  await expect(page.getByText(COPY.ja.mockedAnswer)).toBeVisible()

  await page.getByRole('button', { name: COPY.ja.staffOption }).click()
  const link = page.getByRole('link', { name: COPY.ja.staffCta })
  await expect(link).toHaveAttribute('href', staffLineUrl!)
})

// ─────────────────────────────────────────────────────────────────────────
// 6. Rate limit — repeated requests past the limit degrade to the safe
//    fallback message rather than erroring visibly.
// ─────────────────────────────────────────────────────────────────────────

test('rate limit: a rate-limited response degrades to the safe fallback message, not a visible error, across repeated questions', async ({
  page,
}) => {
  await page.route(AI_ENDPOINT, async (route) => {
    await route.fulfill({ status: 429, contentType: 'application/json', body: JSON.stringify({ status: 'rate-limited' }) })
  })

  await openFaqMenu(page, 'ja')

  // First question, past the (mocked) limit.
  await askFreeText(page, 'ja', COPY.ja.clinicQuestion)
  await expect(page.getByText(COPY.ja.safeFallbackSnippet)).toBeVisible()

  // A second, distinct question — the widget must still be usable, not
  // stuck or broken after the first rate-limited response. Also not a
  // static-FAQ-matching phrase (verified against the real faq-content.ts
  // corpus): it must still reach the mocked AI endpoint for this assertion
  // to mean anything.
  await page.getByRole('button', { name: COPY.ja.askOption }).click()
  await page.getByPlaceholder(COPY.ja.askPlaceholder).fill('子供と一緒に行けますか')
  await page.getByRole('button', { name: COPY.ja.send }).click()

  await expect(page.getByText(COPY.ja.safeFallbackSnippet).last()).toBeVisible()
})
