import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { BookingFlow } from '../BookingFlow'
import { getWeekDates, startOfWeek, toDateOnlyString } from '../calendar/week'
import { buildAvailability, interpolatingTranslate, SAMPLE_SERVICE } from './test-utils'

vi.mock('next-intl', () => ({
  useTranslations: () => interpolatingTranslate,
  useLocale: () => 'en',
}))

const fetchBookableServices = vi.fn()
const fetchAvailability = vi.fn()
const reserve = vi.fn()
const createIdempotencyKey = vi.fn()

vi.mock('../../api/client', () => ({
  fetchBookableServices: (...args: unknown[]) => fetchBookableServices(...args),
  fetchAvailability: (...args: unknown[]) => fetchAvailability(...args),
  reserve: (...args: unknown[]) => reserve(...args),
  createIdempotencyKey: (...args: unknown[]) => createIdempotencyKey(...args),
}))

const FIXED_NOW = new Date('2027-01-06T09:00:00.000Z')
const weekStart = startOfWeek(FIXED_NOW)
const BOOKING_DATE = toDateOnlyString(getWeekDates(weekStart)[0]!)
const SLOT_TIME = '01:00' // UTC time the mocked availability is built at
const SLOT_LABEL_TIME = '10:00' // the same instant as shown in the booking zone (Asia/Tokyo, UTC+9)
const AVAILABILITY = buildAvailability(BOOKING_DATE, SLOT_TIME)

function slotAriaLabel(): string {
  return interpolatingTranslate('calendar.selectedSlotLabel', {
    date: BOOKING_DATE,
    time: SLOT_LABEL_TIME,
    symbolLabel: 'calendar.legend.plenty',
  })
}

beforeEach(() => {
  // Only fake Date — faking setTimeout too would block waitFor/findBy*'s
  // internal real-timer polling and hang every async assertion below.
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(FIXED_NOW)
  fetchBookableServices.mockResolvedValue({ ok: true, data: { services: [SAMPLE_SERVICE] } })
  fetchAvailability.mockResolvedValue({ ok: true, data: AVAILABILITY })
  createIdempotencyKey.mockReturnValue('idem-key-1')
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('BookingFlow', () => {
  it('walks the full booking journey and only shows success after reserve() actually resolves', async () => {
    let resolveReserve!: (value: unknown) => void
    reserve.mockReturnValue(new Promise((resolve) => { resolveReserve = resolve }))

    render(<BookingFlow locale="en" clinicName="Sunrise Clinic" />)

    // Step 1: visit type
    fireEvent.click(screen.getByText('visitType.first'))

    // Step 2: service (loaded via fetchBookableServices)
    await waitFor(() => expect(fetchBookableServices).toHaveBeenCalledWith({ locale: 'en' }))
    fireEvent.click(await screen.findByText('General Checkup'))

    // Step 3: calendar (loaded via fetchAvailability) — select the slot, then continue
    await waitFor(() => expect(fetchAvailability).toHaveBeenCalled())
    fireEvent.click(await screen.findByRole('button', { name: slotAriaLabel() }))
    fireEvent.click(screen.getByText('contact.continue'))

    // Idempotency key is generated exactly once, on entering the contact step
    expect(createIdempotencyKey).toHaveBeenCalledTimes(1)

    // Step 4: contact form
    fireEvent.change(screen.getByLabelText('contact.familyName'), { target: { value: '山田' } })
    fireEvent.change(screen.getByLabelText('contact.givenName'), { target: { value: '太郎' } })
    fireEvent.change(screen.getByLabelText('contact.familyNameKana'), { target: { value: 'ヤマダ' } })
    fireEvent.change(screen.getByLabelText('contact.givenNameKana'), { target: { value: 'タロウ' } })
    fireEvent.change(screen.getByLabelText('contact.phone'), { target: { value: '090-0000-0000' } })
    fireEvent.click(screen.getByRole('button', { name: 'contact.continue' }))

    // Step 5: confirmation
    await screen.findByText('confirmation.title')
    const submitButton = screen.getByRole('button', { name: 'confirmation.submit' })
    fireEvent.click(submitButton)

    await waitFor(() => expect(reserve).toHaveBeenCalledTimes(1))
    expect(reserve.mock.calls[0]?.[0]).toMatchObject({ idempotency_key: 'idem-key-1' })

    // No optimistic UI: still on confirmation, submit disabled, while reserve() is pending
    expect(screen.getByText('confirmation.title')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
    expect(screen.queryByText('success.title')).not.toBeInTheDocument()

    // A double-tap while pending must not fire a second reserve() call
    fireEvent.click(submitButton)
    expect(reserve).toHaveBeenCalledTimes(1)

    // Server responds — only now does the success screen appear
    resolveReserve({ ok: true, data: { confirmation_code: 'ABC123', access_token: 'tok', link_token: 'link-tok' } })
    await screen.findByText('success.title')
    expect(screen.getByText('ABC123')).toBeInTheDocument()

    const manageLink = screen.getByRole('link', { name: 'success.manageLinkLabel' })
    expect(manageLink).toHaveAttribute('href', '/en/booking/manage?code=ABC123&token=link-tok')
  })

  it('shows a retryable error and reuses the same idempotency key on retry after a failed reserve()', async () => {
    reserve.mockResolvedValueOnce({ ok: false, error: { code: 'INTERNAL', message: 'boom' } })
    reserve.mockResolvedValueOnce({ ok: true, data: { confirmation_code: 'XYZ999', access_token: 'tok', link_token: 'link-tok' } })

    render(<BookingFlow locale="en" clinicName="Sunrise Clinic" />)

    fireEvent.click(screen.getByText('visitType.first'))
    fireEvent.click(await screen.findByText('General Checkup'))
    fireEvent.click(await screen.findByRole('button', { name: slotAriaLabel() }))
    fireEvent.click(screen.getByText('contact.continue'))
    fireEvent.change(screen.getByLabelText('contact.familyName'), { target: { value: '山田' } })
    fireEvent.change(screen.getByLabelText('contact.givenName'), { target: { value: '太郎' } })
    fireEvent.change(screen.getByLabelText('contact.familyNameKana'), { target: { value: 'ヤマダ' } })
    fireEvent.change(screen.getByLabelText('contact.givenNameKana'), { target: { value: 'タロウ' } })
    fireEvent.change(screen.getByLabelText('contact.phone'), { target: { value: '090-0000-0000' } })
    fireEvent.click(screen.getByRole('button', { name: 'contact.continue' }))

    await screen.findByText('confirmation.title')
    fireEvent.click(screen.getByRole('button', { name: 'confirmation.submit' }))
    await waitFor(() => expect(reserve).toHaveBeenCalledTimes(1))

    await screen.findByText('errors.generic')

    fireEvent.click(screen.getByRole('button', { name: 'confirmation.submit' }))
    await waitFor(() => expect(reserve).toHaveBeenCalledTimes(2))
    expect(reserve.mock.calls[1]?.[0]).toMatchObject({ idempotency_key: 'idem-key-1' })

    await screen.findByText('success.title')
  })

  describe('STEP 2 Part 2: LIFF props', () => {
    it('contactPrefill pre-fills the contact form as an editable suggestion, never auto-submitted', async () => {
      reserve.mockResolvedValueOnce({
        ok: true,
        data: { confirmation_code: 'PRE001', access_token: 'tok', link_token: 'link-tok' },
      })

      render(
        <BookingFlow locale="en" clinicName="Sunrise Clinic" contactPrefill={{ given_name: 'Taro' }} />,
      )

      fireEvent.click(screen.getByText('visitType.first'))
      fireEvent.click(await screen.findByText('General Checkup'))
      fireEvent.click(await screen.findByRole('button', { name: slotAriaLabel() }))
      fireEvent.click(screen.getByText('contact.continue'))

      const givenNameField = screen.getByLabelText('contact.givenName') as HTMLInputElement
      expect(givenNameField.value).toBe('Taro')
      // Still editable — the patient can overwrite the suggestion.
      fireEvent.change(givenNameField, { target: { value: '太郎' } })
      expect(givenNameField.value).toBe('太郎')
      // Every other field is genuinely blank, not silently pre-filled too.
      expect((screen.getByLabelText('contact.familyName') as HTMLInputElement).value).toBe('')
    })

    it('returning-patient shortcut (initialVisitType + initialCustomer) skips visit-type and contact entirely', async () => {
      reserve.mockResolvedValueOnce({
        ok: true,
        data: { confirmation_code: 'RET001', access_token: 'tok', link_token: 'link-tok' },
      })
      const knownCustomer = {
        family_name: '田中',
        given_name: '花子',
        family_name_kana: 'タナカ',
        given_name_kana: 'ハナコ',
        phone: '090-1111-2222',
      }

      render(
        <BookingFlow
          locale="en"
          clinicName="Sunrise Clinic"
          initialVisitType="return"
          initialCustomer={knownCustomer}
        />,
      )

      // No visit-type tap needed — service list is already showing.
      fireEvent.click(await screen.findByText('General Checkup'))
      fireEvent.click(await screen.findByRole('button', { name: slotAriaLabel() }))
      fireEvent.click(screen.getByText('contact.continue'))

      // Straight to confirmation — no contact form appeared in between.
      await screen.findByText('confirmation.title')
      expect(screen.queryByLabelText('contact.familyName')).not.toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'confirmation.submit' }))
      await waitFor(() => expect(reserve).toHaveBeenCalledTimes(1))
      expect(reserve.mock.calls[0]?.[0]).toMatchObject({ visit_type: 'return', customer: knownCustomer })
    })

    it('threads lineIdToken through to the reserve() call as line_id_token', async () => {
      reserve.mockResolvedValueOnce({
        ok: true,
        data: { confirmation_code: 'LIF001', access_token: 'tok', link_token: 'link-tok' },
      })

      render(<BookingFlow locale="en" clinicName="Sunrise Clinic" lineIdToken="raw-id-token-abc" />)

      fireEvent.click(screen.getByText('visitType.first'))
      fireEvent.click(await screen.findByText('General Checkup'))
      fireEvent.click(await screen.findByRole('button', { name: slotAriaLabel() }))
      fireEvent.click(screen.getByText('contact.continue'))
      fireEvent.change(screen.getByLabelText('contact.familyName'), { target: { value: '山田' } })
      fireEvent.change(screen.getByLabelText('contact.givenName'), { target: { value: '太郎' } })
      fireEvent.change(screen.getByLabelText('contact.familyNameKana'), { target: { value: 'ヤマダ' } })
      fireEvent.change(screen.getByLabelText('contact.givenNameKana'), { target: { value: 'タロウ' } })
      fireEvent.change(screen.getByLabelText('contact.phone'), { target: { value: '090-0000-0000' } })
      fireEvent.click(screen.getByRole('button', { name: 'contact.continue' }))
      await screen.findByText('confirmation.title')
      fireEvent.click(screen.getByRole('button', { name: 'confirmation.submit' }))

      await waitFor(() => expect(reserve).toHaveBeenCalledTimes(1))
      expect(reserve.mock.calls[0]?.[0]).toMatchObject({ line_id_token: 'raw-id-token-abc' })
    })
  })
})
