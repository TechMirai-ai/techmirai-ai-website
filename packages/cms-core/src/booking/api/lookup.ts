import type { Payload } from 'payload'

import { findSlot, verifyAppointmentAccess } from './entities'
import type { LookupRequest, LookupResponse } from './schemas'

export async function handleLookup(payload: Payload, input: LookupRequest): Promise<LookupResponse> {
  const appointment = await verifyAppointmentAccess(payload, input.code, input.token)

  // Resolved only now, after access is verified — see findAppointmentByCode's
  // doc comment in entities.ts for why this must not happen inside the
  // shared timing-sensitive verification path.
  const slot = await findSlot(payload, appointment.slot)
  if (!slot) {
    throw new Error(`Appointment ${appointment.id} references missing slot ${appointment.slot}`)
  }

  return {
    confirmation_code: appointment.confirmationCode,
    status: appointment.status,
    visit_type: appointment.visitType,
    scheduled_at: appointment.scheduledAt,
    service_id: appointment.service,
    resource_id: slot.resource,
  }
}
