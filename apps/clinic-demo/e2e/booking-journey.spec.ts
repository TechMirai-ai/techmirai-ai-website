import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

/**
 * Full booking journey on a mobile viewport (playwright.config.ts sets
 * devices['iPhone 13']).
 *
 * The three booking API calls are mocked at the network boundary rather than
 * hitting a real database. This repo's local dev DB is SQLite, which disables
 * real transactions (see booking/test/config.ts's own doc comment) — the
 * reservation engine's atomic booking logic literally cannot complete
 * against it. Mocking here keeps the test deterministic and runnable by
 * anyone with no DB/seed setup, while still exercising the real rendered
 * component tree, real client-side validation, and real DOM interactions in
 * a real browser against the real Next.js dev server.
 */

const SERVICE = { id: 1, name: 'General Checkup', duration_min: 30, price_yen: 3000, first_visit_allowed: true }

test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/booking/services**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ services: [SERVICE] }) })
  })

  await page.route('**/api/v1/booking/availability**', async (route) => {
    const url = new URL(route.request().url())
    const from = url.searchParams.get('from')
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        dates: [
          {
            date: from,
            slots: [
              {
                slot_id: 5,
                resource_id: 20,
                starts_at: `${from}T01:00:00.000Z`,
                ends_at: `${from}T01:30:00.000Z`,
                capacity: 4,
                remaining_capacity: 4,
              },
            ],
          },
        ],
      }),
    })
  })

  await page.route('**/api/v1/booking/reserve', async (route) => {
    // A deliberate delay — mocking this instantly leaves no real window to
    // assert the pending/no-optimistic-UI state before success renders.
    await new Promise((resolve) => setTimeout(resolve, 800))
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ confirmation_code: 'E2E1234', access_token: 'e2e-mock-token', link_token: 'e2e-mock-link-token' }),
    })
  })
})

test('completes the full booking journey: visit type through the patient-card success screen', async ({ page }) => {
  await page.goto('/en/booking')

  await test.step('step 1: visit type', async () => {
    await expect(page.getByRole('heading', { name: 'Is this your first visit?' })).toBeVisible()
    await page.getByRole('button', { name: 'First visit (初診)' }).click()
  })

  await test.step('step 2: service selection', async () => {
    await expect(page.getByRole('heading', { name: 'Choose a service' })).toBeVisible()
    await page.getByRole('button', { name: /General Checkup/ }).click()
  })

  await test.step('step 3: calendar — pick a slot', async () => {
    await expect(page.getByRole('heading', { name: 'Choose a date and time' })).toBeVisible()

    const accessibilityScan = await new AxeBuilder({ page }).include('.booking-flow').analyze()
    expect(accessibilityScan.violations).toEqual([])

    const plentySlot = page.getByRole('button', { name: /Plenty available/ }).first()
    await expect(plentySlot).toBeVisible()
    await expect(plentySlot).toHaveCSS('min-height', '48px')
    await plentySlot.click()

    await page.getByRole('button', { name: 'Continue' }).click()
  })

  await test.step('step 4: contact form', async () => {
    await expect(page.getByRole('heading', { name: 'Your details' })).toBeVisible()
    await page.getByRole('textbox', { name: 'Family name', exact: true }).fill('山田')
    await page.getByRole('textbox', { name: 'Given name', exact: true }).fill('太郎')
    await page.getByRole('textbox', { name: 'Family name (kana)' }).fill('ヤマダ')
    await page.getByRole('textbox', { name: 'Given name (kana)' }).fill('タロウ')
    await page.getByRole('textbox', { name: 'Phone number' }).fill('090-1234-5678')
    await page.getByRole('button', { name: 'Continue' }).click()
  })

  await test.step('step 5: confirmation — submit is disabled while reserve() is pending, never optimistic', async () => {
    await expect(page.getByRole('heading', { name: 'Confirm your appointment' })).toBeVisible()
    await expect(page.getByText('General Checkup')).toBeVisible()
    await expect(page.getByText('山田 太郎')).toBeVisible()

    const accessibilityScan = await new AxeBuilder({ page }).include('.booking-flow').analyze()
    expect(accessibilityScan.violations).toEqual([])

    // Matches both the idle ("Confirm booking") and pending ("Confirming…")
    // label — the button's accessible name changes while loading.
    const confirmButton = page.getByRole('button', { name: /Confirm/ })
    await confirmButton.click()
    // While the (deliberately delayed) mock is still pending: button
    // disabled, no optimistic success render.
    await expect(confirmButton).toBeDisabled()
    await expect(page.getByText('Booking confirmed')).not.toBeVisible()
  })

  await test.step('step 6: success — the 診察券 patient card', async () => {
    await expect(page.getByText('Booking confirmed')).toBeVisible()
    await expect(page.getByText('E2E1234')).toBeVisible()
    await expect(page.getByText('山田 太郎')).toBeVisible()
  })
})

test('does not allow navigating the calendar into the past', async ({ page }) => {
  await page.goto('/en/booking')
  await page.getByRole('button', { name: 'First visit (初診)' }).click()
  await page.getByRole('button', { name: /General Checkup/ }).click()

  await expect(page.getByRole('button', { name: 'Previous week' })).toBeDisabled()
})
