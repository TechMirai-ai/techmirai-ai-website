import { beforeEach, describe, expect, it, vi } from 'vitest'

const sendMock = vi.fn()

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: sendMock },
  })),
}))

import { Resend } from 'resend'

import { EmailResendChannel } from './email-resend'

describe('EmailResendChannel', () => {
  beforeEach(() => {
    sendMock.mockReset()
  })

  it('sends via resend.emails.send with from/to/subject/html/text and the dedupeKey as idempotencyKey', async () => {
    sendMock.mockResolvedValueOnce({ data: { id: 'resend-msg-1' }, error: null })
    const resend = new Resend('test-key')
    const channel = new EmailResendChannel(resend, 'notifications@clinic-demo.example')

    const result = await channel.send({
      to: 'patient@example.com',
      subject: 'Your appointment is confirmed',
      html: '<p>Confirmed</p>',
      text: 'Confirmed',
      dedupeKey: 'email:booking-confirmation:412',
    })

    expect(result).toEqual({ providerMessageId: 'resend-msg-1' })
    expect(sendMock).toHaveBeenCalledWith(
      {
        from: 'notifications@clinic-demo.example',
        to: 'patient@example.com',
        subject: 'Your appointment is confirmed',
        html: '<p>Confirmed</p>',
        text: 'Confirmed',
      },
      { idempotencyKey: 'email:booking-confirmation:412' },
    )
  })

  it('throws a descriptive error when Resend returns an error payload', async () => {
    sendMock.mockResolvedValueOnce({ data: null, error: { message: 'Invalid `to` field' } })
    const resend = new Resend('test-key')
    const channel = new EmailResendChannel(resend, 'notifications@clinic-demo.example')

    await expect(
      channel.send({ to: 'bad-address', subject: 'Hi', html: '<p>hi</p>', text: 'hi' }),
    ).rejects.toThrow(/Invalid `to` field/)
  })
})
