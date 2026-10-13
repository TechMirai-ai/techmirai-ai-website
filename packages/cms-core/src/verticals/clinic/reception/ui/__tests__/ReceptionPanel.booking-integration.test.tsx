import { NextIntlClientProvider } from 'next-intl'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import enMessages from '../../../../../i18n/messages/en.json'
import { ReceptionPanel } from '../ReceptionPanel'

// Regression test for: BookingFlow (mounted inline via ReceptionPanel's
// "component" interaction) throws "NextIntlClientProvider was not found"
// because every BookingFlow step reads next-intl context. Unlike
// ReceptionPanel.test.tsx (which intentionally mocks BookingFlow itself to
// keep its own assertions focused), this file mounts the REAL BookingFlow
// through the real chat-mount path so the provider-boundary requirement is
// actually exercised, not just unit-tested around.

const fetchBookableServices = vi.fn()
const fetchAvailability = vi.fn()
const reserve = vi.fn()
const createIdempotencyKey = vi.fn()

vi.mock('../../../../../booking/api/client', () => ({
  fetchBookableServices: (...args: unknown[]) => fetchBookableServices(...args),
  fetchAvailability: (...args: unknown[]) => fetchAvailability(...args),
  reserve: (...args: unknown[]) => reserve(...args),
  createIdempotencyKey: (...args: unknown[]) => createIdempotencyKey(...args),
}))

const defaultProps = {
  initialLocale: 'en',
  availableLocales: ['ja', 'en'],
  onClose: () => {},
  greeting: { ja: 'こんにちは', en: 'Hello' },
  clinicPhone: '+81-3-5432-1188',
  clinicName: 'TechMirai',
}

/** K1: booking is reached from the B5 "Free assessment or consultation" answer, not a top-level button. */
function openBooking() {
  fireEvent.click(screen.getByRole('button', { name: 'Free assessment or consultation' }))
  fireEvent.click(screen.getByRole('button', { name: 'Book a call' }))
}

beforeEach(() => {
  fetchBookableServices.mockResolvedValue({ ok: true, data: { services: [] } })
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('ReceptionPanel — real BookingFlow mounted via the chat "component" interaction', () => {
  it('renders VisitTypeStep without throwing when wrapped in a real NextIntlClientProvider', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ReceptionPanel {...defaultProps} />
      </NextIntlClientProvider>,
    )

    openBooking()

    expect(screen.getByText(enMessages.blocks.booking.visitType.title)).toBeInTheDocument()
  })

  it('throws when BookingFlow is mounted WITHOUT a NextIntlClientProvider ancestor', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<ReceptionPanel {...defaultProps} />)
      openBooking()
    }).toThrow()

    consoleError.mockRestore()
  })
})
