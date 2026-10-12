import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ManageAppointmentView } from '../ManageAppointmentView'
import { getWeekDates, startOfWeek, toDateOnlyString } from '../calendar/week'
import { buildAvailability, interpolatingTranslate } from './test-utils'

vi.mock('next-intl', () => ({
  useTranslations: () => interpolatingTranslate,
  useLocale: () => 'en',
}))

const lookup = vi.fn()
const cancel = vi.fn()
const reschedule = vi.fn()
const fetchAvailability = vi.fn()
const createIdempotencyKey = vi.fn()

vi.mock('../../api/client', () => ({
  lookup: (...args: unknown[]) => lookup(...args),
  cancel: (...args: unknown[]) => cancel(...args),
  reschedule: (...args: unknown[]) => reschedule(...args),
  fetchAvailability: (...args: unknown[]) => fetchAvailability(...args),
  createIdempotencyKey: (...args: unknown[]) => createIdempotencyKey(...args),
}))

const FIXED_NOW = new Date('2027-01-06T09:00:00.000Z')
const weekStart = startOfWeek(FIXED_NOW)
const NEW_SLOT_DATE = toDateOnlyString(getWeekDates(weekStart)[0]!)
const NEW_SLOT_TIME = '01:00' // UTC time the mocked availability is built at
const NEW_SLOT_LABEL_TIME = '10:00' // the same instant as shown in the booking zone (Asia/Tokyo, UTC+9)
const NEW_SLOT_AVAILABILITY = buildAvailability(NEW_SLOT_DATE, NEW_SLOT_TIME)

function newSlotAriaLabel(): string {
  return interpolatingTranslate('calendar.selectedSlotLabel', {
    date: NEW_SLOT_DATE,
    time: NEW_SLOT_LABEL_TIME,
    symbolLabel: 'calendar.legend.plenty',
  })
}

function lookupResponse(overrides: Record<string, unknown> = {}) {
  return {
    ok: true,
    data: {
      confirmation_code: 'ABC123',
      status: 'booked',
      visit_type: 'first',
      scheduled_at: '2027-01-10T01:00:00.000Z',
      service_id: 1,
      resource_id: 20,
      ...overrides,
    },
  }
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(FIXED_NOW)
  fetchAvailability.mockResolvedValue({ ok: true, data: NEW_SLOT_AVAILABILITY })
  createIdempotencyKey.mockReturnValue('reschedule-idem-key-1')
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('ManageAppointmentView', () => {
  it('shows cancel and reschedule buttons for an appointment well within the cutoff', async () => {
    lookup.mockResolvedValue(lookupResponse({ scheduled_at: '2027-01-10T01:00:00.000Z' }))

    render(
      <ManageAppointmentView
        clinicName="Sunrise Clinic"
        clinicPhone="+81-3-0000-0000"
        cancellationCutoffHours={24}
        confirmationCode="ABC123"
        accessToken="tok"
      />,
    )

    expect(await screen.findByText('ABC123')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'manage.cancelButton' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'manage.rescheduleButton' })).toBeInTheDocument()
    expect(screen.queryByText(/\+81-3-0000-0000/)).not.toBeInTheDocument()
  })

  it('does not show cancel/reschedule buttons for a non-actionable status (e.g. already cancelled by staff), even within the cutoff window', async () => {
    lookup.mockResolvedValue(lookupResponse({ status: 'cancelled', scheduled_at: '2027-01-10T01:00:00.000Z' }))

    render(
      <ManageAppointmentView
        clinicName="Sunrise Clinic"
        clinicPhone="+81-3-0000-0000"
        cancellationCutoffHours={24}
        confirmationCode="ABC123"
        accessToken="tok"
      />,
    )

    await screen.findByText('ABC123')
    expect(screen.queryByRole('button', { name: 'manage.cancelButton' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'manage.rescheduleButton' })).not.toBeInTheDocument()
  })

  it('shows the clinic phone number instead of buttons once past the cutoff', async () => {
    // 1 hour out, inside a 24h cutoff.
    lookup.mockResolvedValue(lookupResponse({ scheduled_at: '2027-01-06T10:00:00.000Z' }))

    render(
      <ManageAppointmentView
        clinicName="Sunrise Clinic"
        clinicPhone="+81-3-0000-0000"
        cancellationCutoffHours={24}
        confirmationCode="ABC123"
        accessToken="tok"
      />,
    )

    await screen.findByText('ABC123')
    expect(screen.queryByRole('button', { name: 'manage.cancelButton' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'manage.rescheduleButton' })).not.toBeInTheDocument()
    expect(screen.getByText(/\+81-3-0000-0000/)).toBeInTheDocument()
  })

  it('REQUIRED: a reschedule failure (new slot taken before submit) leaves the original appointment intact and recoverable', async () => {
    lookup.mockResolvedValue(lookupResponse({ scheduled_at: '2027-01-10T01:00:00.000Z' }))
    reschedule.mockResolvedValue({ ok: false, error: { code: 'SLOT_FULL', message: 'The selected slot is no longer available' } })

    render(
      <ManageAppointmentView
        clinicName="Sunrise Clinic"
        clinicPhone="+81-3-0000-0000"
        cancellationCutoffHours={24}
        confirmationCode="ABC123"
        accessToken="tok"
      />,
    )

    await screen.findByText('ABC123')
    fireEvent.click(screen.getByRole('button', { name: 'manage.rescheduleButton' }))

    fireEvent.click(await screen.findByRole('button', { name: newSlotAriaLabel() }))
    fireEvent.click(screen.getByRole('button', { name: 'manage.reschedule.confirm' }))

    await waitFor(() => expect(reschedule).toHaveBeenCalledTimes(1))
    expect(reschedule.mock.calls[0]?.[0]).toMatchObject({
      confirmation_code: 'ABC123',
      access_token: 'tok',
      idempotency_key: 'reschedule-idem-key-1',
    })

    await screen.findByText('errors.slotFull')

    // A second failed attempt must not generate a new idempotency key —
    // same discipline as the main booking flow.
    fireEvent.click(await screen.findByRole('button', { name: newSlotAriaLabel() }))
    fireEvent.click(screen.getByRole('button', { name: 'manage.reschedule.confirm' }))
    await waitFor(() => expect(reschedule).toHaveBeenCalledTimes(2))
    expect(reschedule.mock.calls[1]?.[0]).toMatchObject({ idempotency_key: 'reschedule-idem-key-1' })
    expect(createIdempotencyKey).toHaveBeenCalledTimes(1)

    // Backing out of the failed reschedule attempt must show the ORIGINAL
    // appointment exactly as it was — not corrupted, not the failed target.
    fireEvent.click(screen.getByRole('button', { name: 'nav.back' }))
    expect(await screen.findByText('ABC123')).toBeInTheDocument()
    expect(cancel).not.toHaveBeenCalled()
  })
})
