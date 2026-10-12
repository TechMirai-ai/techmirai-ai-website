import { expect, test } from '@playwright/test'

import siteConfig from '../site.config'

/**
 * Manage-appointment page journey: reached via a magic link (?code=&token=),
 * mirroring booking-journey.spec.ts's approach of mocking the booking API at
 * the network boundary rather than hitting a real database (see that file's
 * doc comment on why — local dev DB is SQLite, which disables the real
 * transactions the reservation engine's atomicity depends on).
 */

const ORIGINAL_APPOINTMENT = {
  confirmation_code: 'E2E1234',
  status: 'booked',
  visit_type: 'first' as const,
  service_id: 1,
  resource_id: 20,
}

test.beforeEach(async ({ page }) => {
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
                slot_id: 9,
                resource_id: 20,
                starts_at: `${from}T03:00:00.000Z`,
                ends_at: `${from}T03:30:00.000Z`,
                capacity: 4,
                remaining_capacity: 4,
              },
            ],
          },
        ],
      }),
    })
  })
})

test('loads via the manage link, shows the appointment, and cleans the code/token out of the URL', async ({ page }) => {
  const weekOut = new Date(Date.now() + 7 * 86_400_000).toISOString()
  await page.route('**/api/v1/booking/lookup**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...ORIGINAL_APPOINTMENT, scheduled_at: weekOut }),
    })
  })

  await page.goto('/en/booking/manage?code=E2E1234&token=e2e-mock-token')

  await expect(page.getByText('E2E1234')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cancel appointment' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Reschedule' })).toBeVisible()

  // The credential must not linger in the address bar.
  await expect(page).toHaveURL((url) => !url.search.includes('code=') && !url.search.includes('token='))
})

test('shows the clinic phone number instead of buttons once past the cutoff', async ({ page }) => {
  const oneHourOut = new Date(Date.now() + 60 * 60 * 1000).toISOString()
  await page.route('**/api/v1/booking/lookup**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...ORIGINAL_APPOINTMENT, scheduled_at: oneHourOut }),
    })
  })

  await page.goto('/en/booking/manage?code=E2E1234&token=e2e-mock-token')

  await expect(page.getByText('E2E1234')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cancel appointment' })).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Reschedule' })).not.toBeVisible()
  // The page shows site.config.ts's contact.phone — read from the same config
  // so this does not go stale again (today it is the bracketed placeholder
  // tracked as F1-01 in docs/PLACEHOLDER-REGISTER.md, not a real number).
  const contactPhone = siteConfig.contact.phone ?? ''
  expect(contactPhone).not.toBe('')
  // The number also appears in the footer, so scope to the cutoff message itself.
  await expect(page.getByText('too close to its scheduled time').filter({ hasText: contactPhone })).toBeVisible()
})

test('completes a full reschedule: pick a new slot, confirm, see the success message', async ({ page }) => {
  const weekOut = new Date(Date.now() + 7 * 86_400_000).toISOString()
  await page.route('**/api/v1/booking/lookup**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...ORIGINAL_APPOINTMENT, scheduled_at: weekOut }),
    })
  })
  await page.route('**/api/v1/booking/reschedule', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        confirmation_code: 'E2E9999',
        access_token: 'new-mock-token',
        link_token: 'new-mock-link-token',
        old_appointment_cancelled: true,
      }),
    })
  })

  await page.goto('/en/booking/manage?code=E2E1234&token=e2e-mock-token')
  await expect(page.getByText('E2E1234')).toBeVisible()

  await page.getByRole('button', { name: 'Reschedule' }).click()
  await expect(page.getByRole('heading', { name: 'Choose a new time' })).toBeVisible()

  const plentySlot = page.getByRole('button', { name: /Plenty available/ }).first()
  await expect(plentySlot).toBeVisible()
  await plentySlot.click()
  await page.getByRole('button', { name: 'Confirm new time' }).click()

  await expect(page.getByText('Your appointment has been rescheduled.')).toBeVisible()
  await expect(page.getByText('E2E9999')).toBeVisible()
})

test('REQUIRED: a reschedule failure (new slot taken before submit) leaves the original appointment recoverable and unchanged', async ({
  page,
}) => {
  const weekOut = new Date(Date.now() + 7 * 86_400_000).toISOString()
  await page.route('**/api/v1/booking/lookup**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...ORIGINAL_APPOINTMENT, scheduled_at: weekOut }),
    })
  })
  await page.route('**/api/v1/booking/reschedule', async (route) => {
    await route.fulfill({
      status: 409,
      contentType: 'application/json',
      body: JSON.stringify({ error: { code: 'SLOT_FULL', message: 'The selected slot is no longer available' } }),
    })
  })

  await page.goto('/en/booking/manage?code=E2E1234&token=e2e-mock-token')
  await expect(page.getByText('E2E1234')).toBeVisible()

  await page.getByRole('button', { name: 'Reschedule' }).click()
  const plentySlot = page.getByRole('button', { name: /Plenty available/ }).first()
  await plentySlot.click()
  await page.getByRole('button', { name: 'Confirm new time' }).click()

  await expect(page.getByText('That time was just booked by someone else. Please choose another time.')).toBeVisible()

  // Back out of the failed attempt — the ORIGINAL appointment (same code)
  // must reappear exactly as it was, not corrupted, not the failed target.
  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page.getByText('E2E1234')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cancel appointment' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Reschedule' })).toBeVisible()
})
