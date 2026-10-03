import type { ManageAction, ManageState } from './manageTypes'

/**
 * Pure state machine for the customer-facing manage-appointment page — no
 * React, DOM, fetch, or crypto dependency, so every transition is testable
 * with zero mocks. useManageAppointment.ts is the only place that wires
 * this to the typed API client (mirrors flow/reducer.ts's own split).
 */
export function manageReducer(state: ManageState, action: ManageAction): ManageState {
  switch (action.type) {
    case 'LOOKUP_SUCCEEDED':
      return { ...state, step: 'view', appointment: action.appointment }

    case 'LOOKUP_FAILED':
      return { ...state, step: 'not_found' }

    case 'CANCEL_SUBMIT':
      // Guards a double-tapped button: the second of two rapid dispatches
      // sees actionSubmission already 'submitting' and no-ops.
      if (state.actionSubmission === 'submitting') return state
      return { ...state, actionSubmission: 'submitting', actionError: undefined }

    case 'CANCEL_SUCCEEDED':
      return { ...state, step: 'cancelled', actionSubmission: 'idle' }

    case 'CANCEL_FAILED':
      return { ...state, actionSubmission: 'idle', actionError: action.error }

    case 'ENTER_RESCHEDULE':
      return {
        ...state,
        step: 'reschedule_picking',
        actionError: undefined,
        // Idempotent guard: once set, re-entering reschedule mode (e.g.
        // after EXIT_RESCHEDULE then back in) never overwrites it with a
        // new key — same discipline as flow/reducer.ts's ENTER_CONTACT_STEP.
        rescheduleIdempotencyKey: state.rescheduleIdempotencyKey ?? action.idempotencyKey,
      }

    case 'SELECT_NEW_SLOT':
      return { ...state, newSlot: action.slot }

    case 'RESCHEDULE_SUBMIT':
      if (state.actionSubmission === 'submitting' || !state.rescheduleIdempotencyKey || !state.newSlot) return state
      return { ...state, actionSubmission: 'submitting', actionError: undefined }

    case 'RESCHEDULE_SUCCEEDED':
      // The old confirmationCode/accessToken are no longer useful for
      // managing anything once this appointment is cancelled — rotate to
      // the new appointment's credentials so further actions (another
      // cancel/reschedule) target the right one.
      return {
        ...state,
        step: 'rescheduled',
        actionSubmission: 'idle',
        confirmationCode: action.confirmationCode,
        accessToken: action.accessToken,
        oldAppointmentCancelled: action.oldAppointmentCancelled,
        appointment: state.appointment
          ? { ...state.appointment, confirmationCode: action.confirmationCode, scheduledAt: action.scheduledAt, status: 'booked' }
          : state.appointment,
      }

    case 'RESCHEDULE_FAILED':
      // REQUIRED invariant: state.appointment (and confirmationCode/
      // accessToken) are not touched here at all — a failed reschedule
      // (e.g. the new slot was taken before submit) must leave the
      // original appointment completely unchanged. Stays in
      // reschedule_picking so the customer can immediately try another
      // slot, rather than being bounced back to 'view'.
      return { ...state, actionSubmission: 'idle', actionError: action.error }

    case 'EXIT_RESCHEDULE':
      return { ...state, step: 'view', newSlot: undefined, actionError: undefined }

    default: {
      const exhaustiveCheck: never = action
      return exhaustiveCheck
    }
  }
}
