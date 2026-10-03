import type { ErrorResponse } from '../../api/schemas'
import type { SelectedSlot } from './types'

export type ManageStep = 'loading' | 'not_found' | 'view' | 'reschedule_picking' | 'cancelled' | 'rescheduled'

export interface ManageAppointmentInfo {
  confirmationCode: string
  status: string
  visitType: 'first' | 'return'
  scheduledAt: string
  serviceId: string | number
  resourceId: string | number
}

export interface ManageState {
  step: ManageStep
  appointment?: ManageAppointmentInfo | undefined
  // Current credentials for this session — start as whatever the manage
  // link carried (code+token from the URL), replaced with the NEW
  // appointment's credentials after a successful reschedule, since the old
  // ones stop being useful once that appointment is cancelled.
  confirmationCode: string
  accessToken: string
  actionSubmission: 'idle' | 'submitting'
  actionError?: ErrorResponse['error'] | undefined
  /**
   * Generated once, on ENTER_RESCHEDULE, and never regenerated for the life
   * of this hook instance — same discipline as the main booking flow's
   * idempotencyKey (see flow/reducer.ts's ENTER_CONTACT_STEP guard).
   */
  rescheduleIdempotencyKey: string | null
  newSlot?: SelectedSlot | undefined
  /**
   * From the reschedule API response — false in the rare case the new slot
   * was reserved but cancelling the old appointment then failed (see
   * reschedule.ts's cancelOldBestEffort). The view must surface this rather
   * than showing the same success message as a fully-clean reschedule.
   */
  oldAppointmentCancelled?: boolean | undefined
}

export type ManageAction =
  | { type: 'LOOKUP_SUCCEEDED'; appointment: ManageAppointmentInfo }
  | { type: 'LOOKUP_FAILED' }
  | { type: 'CANCEL_SUBMIT' }
  | { type: 'CANCEL_SUCCEEDED' }
  | { type: 'CANCEL_FAILED'; error: ErrorResponse['error'] }
  | { type: 'ENTER_RESCHEDULE'; idempotencyKey: string }
  | { type: 'SELECT_NEW_SLOT'; slot: SelectedSlot }
  | { type: 'RESCHEDULE_SUBMIT' }
  | {
      type: 'RESCHEDULE_SUCCEEDED'
      confirmationCode: string
      accessToken: string
      scheduledAt: string
      oldAppointmentCancelled: boolean
    }
  | { type: 'RESCHEDULE_FAILED'; error: ErrorResponse['error'] }
  | { type: 'EXIT_RESCHEDULE' }
