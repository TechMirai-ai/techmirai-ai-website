import type { Resend } from 'resend'

import type { ChannelSendResult, NotificationChannel, OutboundMessage } from '../types'

/**
 * The only channel implementation that exists today. `NotificationChannel`
 * is the seam LINE/SMS will plug into later — nothing here is special-cased
 * by the dispatcher or by callers.
 */
export class EmailResendChannel implements NotificationChannel {
  readonly id = 'email' as const

  constructor(
    private readonly resend: Resend,
    private readonly fromEmail: string,
  ) {}

  async send(message: OutboundMessage): Promise<ChannelSendResult> {
    const { data, error } = await this.resend.emails.send(
      {
        from: this.fromEmail,
        to: message.to,
        subject: message.subject ?? '',
        html: message.html ?? '',
        text: message.text ?? '',
      },
      message.dedupeKey ? { idempotencyKey: message.dedupeKey } : undefined,
    )

    if (error || !data) {
      throw new Error(`Resend error: ${error?.message ?? 'no data returned'}`)
    }

    return { providerMessageId: data.id }
  }
}
