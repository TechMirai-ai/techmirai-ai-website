import { describe, expect, it } from 'vitest'

import { renderStaffAppointment } from './staff-appointment'

const baseInput = {
  patientName: '山田太郎',
  serviceName: '一般診察',
  scheduledAt: '2026-08-06T01:30:00.000Z',
  visitType: 'first' as const,
  appointmentId: 412,
  adminBaseUrl: 'https://clinic-demo.example',
}

describe('renderStaffAppointment', () => {
  it('renders a "created" notification with patient/service/date/visit-type and an admin link', () => {
    const result = renderStaffAppointment({ ...baseInput, event: 'created' })

    expect(result.html).toContain('山田太郎')
    expect(result.html).toContain('一般診察')
    expect(result.html).toContain('https://clinic-demo.example/admin/collections/appointments/412')
    expect(result.text).toContain('https://clinic-demo.example/admin/collections/appointments/412')
    expect(result.subject).toMatch(/new/i)
  })

  it('renders a "cancelled" notification distinctly from "created"', () => {
    const created = renderStaffAppointment({ ...baseInput, event: 'created' })
    const cancelled = renderStaffAppointment({ ...baseInput, event: 'cancelled' })

    expect(cancelled.subject).not.toBe(created.subject)
    expect(cancelled.subject).toMatch(/cancel/i)
    expect(cancelled.html).toContain('412')
  })

  it('has no locale branching — same output regardless of any locale hint', () => {
    // Staff templates have no `locale` field in their input type at all —
    // this test exists to make that omission explicit and intentional.
    const result = renderStaffAppointment({ ...baseInput, event: 'created' })
    expect(result).not.toHaveProperty('locale')
  })

  it('HTML-escapes patient and service names', () => {
    const result = renderStaffAppointment({
      ...baseInput,
      event: 'created',
      patientName: `<img src=x onerror=alert(1)>`,
    })

    expect(result.html).not.toContain('<img')
    expect(result.html).toContain('&lt;img')
  })
})
