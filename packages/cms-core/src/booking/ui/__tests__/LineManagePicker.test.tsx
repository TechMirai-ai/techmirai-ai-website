import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { LineManagePicker } from '../LineManagePicker'
import { interpolatingTranslate } from './test-utils'
import type { LineManageAppointment } from '../../api/schemas'

vi.mock('next-intl', () => ({
  useTranslations: () => interpolatingTranslate,
  useLocale: () => 'en',
}))

function appointment(overrides: Partial<LineManageAppointment> = {}): LineManageAppointment {
  return {
    confirmation_code: 'AAA111',
    access_token: 'tok-a',
    status: 'booked',
    visit_type: 'first',
    scheduled_at: '2027-01-10T01:00:00.000Z',
    service_id: 1,
    service_name: 'General Checkup',
    ...overrides,
  }
}

describe('LineManagePicker', () => {
  it('renders one button per appointment, showing its service name and date', () => {
    const appointments = [
      appointment({ confirmation_code: 'AAA111', service_name: 'General Checkup' }),
      appointment({ confirmation_code: 'BBB222', service_name: 'Follow-up', scheduled_at: '2027-02-01T01:00:00.000Z' }),
    ]

    render(<LineManagePicker appointments={appointments} onSelect={vi.fn()} />)

    expect(screen.getAllByRole('button')).toHaveLength(2)
    expect(screen.getByText('General Checkup')).toBeInTheDocument()
    expect(screen.getByText('Follow-up')).toBeInTheDocument()
  })

  it('calls onSelect with the exact appointment whose button was clicked, not any other', () => {
    const onSelect = vi.fn()
    const first = appointment({ confirmation_code: 'AAA111', service_name: 'General Checkup' })
    const second = appointment({ confirmation_code: 'BBB222', service_name: 'Follow-up' })

    render(<LineManagePicker appointments={[first, second]} onSelect={onSelect} />)

    fireEvent.click(screen.getByText('Follow-up'))

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(second)
  })

  it('renders nothing selectable for an empty list (caller handles the empty state separately)', () => {
    render(<LineManagePicker appointments={[]} onSelect={vi.fn()} />)

    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })
})
