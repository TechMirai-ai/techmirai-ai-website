import { type NextRequest, NextResponse } from 'next/server'
import { attemptSend, fetchDueNotifications } from '@techmirai/cms-core/notifications'

import { getCachedPayload } from '@/lib/payload'
import { getNotificationDispatcher } from '@/lib/notifications'

/**
 * Sends due notifications (reminders, and any earlier immediate send that
 * failed and is now due for retry). Scheduled once daily in vercel.json
 * ("0 0 * * *", chosen for Vercel Hobby-plan safety — see this file's
 * reminder-timing note below for the consequence) — but this endpoint
 * itself has no Vercel-specific dependency: it's a plain bearer-token-gated
 * route, callable
 * by any scheduler that can send an `Authorization: Bearer <CRON_SECRET>`
 * header, so moving off Vercel Cron later needs no change here.
 *
 * Fetches all due rows in ONE query (fetchDueNotifications) and processes
 * them on the ONE Payload/connection-pool instance this invocation already
 * has — never opens a connection per row. A failure on one row (attemptSend
 * never throws) never stops the rest of the batch from being processed.
 *
 * NOTE — reminder timing: because this only runs once daily (at ~00:00 UTC),
 * `computeReminderScheduledFor` targets 00:00 UTC on the day before an
 * appointment, not a configurable hour (`reminderHourLocal` is currently
 * inert — see that function's doc comment). When WO-8's production cadence
 * moves this to hourly, re-enable `reminderHourLocal` there — it's already
 * threaded through as a one-line change.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const expectedToken = process.env['CRON_SECRET']

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getCachedPayload()
  const dispatcher = getNotificationDispatcher()

  const due = await fetchDueNotifications(payload)
  for (const notification of due) {
    await attemptSend(payload, dispatcher, notification)
  }

  return NextResponse.json({ success: true, processed: due.length })
}
