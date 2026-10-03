import { describe, expect, it } from 'vitest'

import { manageReducer } from './manageReducer'
import type { ManageAppointmentInfo, ManageState } from './manageTypes'

const appointment: ManageAppointmentInfo = {
  confirmationCode: 'ABC123',
  status: 'booked',
  visitType: 'first',
  scheduledAt: '2026-09-01T01:00:00.000Z',
  serviceId: 1,
  resourceId: 2,
}

const viewState: ManageState = {
  step: 'view',
  appointment,
  confirmationCode: 'ABC123',
  accessToken: 'access-tok',
  actionSubmission: 'idle',
  rescheduleIdempotencyKey: null,
}

describe('manageReducer', () => {
  it('LOOKUP_SUCCEEDED moves from loading to view with the appointment attached', () => {
    const loading: ManageState = {
      step: 'loading',
      confirmationCode: 'ABC123',
      accessToken: 'access-tok',
      actionSubmission: 'idle',
      rescheduleIdempotencyKey: null,
    }
    const state = manageReducer(loading, { type: 'LOOKUP_SUCCEEDED', appointment })
    expect(state.step).toBe('view')
    expect(state.appointment).toEqual(appointment)
  })

  it('LOOKUP_FAILED moves to not_found', () => {
    const loading: ManageState = { ...viewState, step: 'loading', appointment: undefined }
    const state = manageReducer(loading, { type: 'LOOKUP_FAILED' })
    expect(state.step).toBe('not_found')
  })

  describe('cancel', () => {
    it('CANCEL_SUBMIT is a no-op if already submitting (double-tap guard)', () => {
      const submitting: ManageState = { ...viewState, actionSubmission: 'submitting' }
      const state = manageReducer(submitting, { type: 'CANCEL_SUBMIT' })
      expect(state).toBe(submitting)
    })

    it('CANCEL_SUCCEEDED moves to cancelled', () => {
      const submitting: ManageState = { ...viewState, actionSubmission: 'submitting' }
      const state = manageReducer(submitting, { type: 'CANCEL_SUCCEEDED' })
      expect(state.step).toBe('cancelled')
      expect(state.actionSubmission).toBe('idle')
    })

    it('CANCEL_FAILED stays on view with the error recorded, re-enabling retry', () => {
      const submitting: ManageState = { ...viewState, actionSubmission: 'submitting' }
      const error = { code: 'CUTOFF_PASSED' as const, message: 'too late' }
      const state = manageReducer(submitting, { type: 'CANCEL_FAILED', error })
      expect(state.step).toBe('view')
      expect(state.actionSubmission).toBe('idle')
      expect(state.actionError).toEqual(error)
    })
  })

  describe('reschedule', () => {
    it('ENTER_RESCHEDULE generates the idempotency key exactly once, never overwriting it on a later entry', () => {
      const first = manageReducer(viewState, { type: 'ENTER_RESCHEDULE', idempotencyKey: 'key-1' })
      expect(first.step).toBe('reschedule_picking')
      expect(first.rescheduleIdempotencyKey).toBe('key-1')

      // Simulates the customer exiting and re-entering reschedule mode —
      // the key must not be regenerated, same discipline as the main
      // booking flow's ENTER_CONTACT_STEP.
      const backToView = manageReducer(first, { type: 'EXIT_RESCHEDULE' })
      const second = manageReducer(backToView, { type: 'ENTER_RESCHEDULE', idempotencyKey: 'key-2' })
      expect(second.rescheduleIdempotencyKey).toBe('key-1')
    })

    it('RESCHEDULE_SUBMIT is a no-op without a selected slot', () => {
      const picking: ManageState = {
        ...viewState,
        step: 'reschedule_picking',
        rescheduleIdempotencyKey: 'key-1',
      }
      const state = manageReducer(picking, { type: 'RESCHEDULE_SUBMIT' })
      expect(state).toBe(picking)
    })

    it('RESCHEDULE_SUBMIT is a no-op if already submitting (double-tap guard)', () => {
      const submitting: ManageState = {
        ...viewState,
        step: 'reschedule_picking',
        rescheduleIdempotencyKey: 'key-1',
        newSlot: { slotId: 9, resourceId: 2, startsAt: '2026-09-08T01:00:00.000Z', endsAt: '2026-09-08T01:30:00.000Z' },
        actionSubmission: 'submitting',
      }
      const state = manageReducer(submitting, { type: 'RESCHEDULE_SUBMIT' })
      expect(state).toBe(submitting)
    })

    it('RESCHEDULE_SUCCEEDED rotates credentials and updates the displayed appointment to the new slot', () => {
      const submitting: ManageState = {
        ...viewState,
        step: 'reschedule_picking',
        rescheduleIdempotencyKey: 'key-1',
        newSlot: { slotId: 9, resourceId: 2, startsAt: '2026-09-08T01:00:00.000Z', endsAt: '2026-09-08T01:30:00.000Z' },
        actionSubmission: 'submitting',
      }
      const state = manageReducer(submitting, {
        type: 'RESCHEDULE_SUCCEEDED',
        confirmationCode: 'NEW999',
        accessToken: 'new-access-tok',
        scheduledAt: '2026-09-08T01:00:00.000Z',
        oldAppointmentCancelled: true,
      })
      expect(state.step).toBe('rescheduled')
      expect(state.confirmationCode).toBe('NEW999')
      expect(state.accessToken).toBe('new-access-tok')
      expect(state.appointment?.confirmationCode).toBe('NEW999')
      expect(state.appointment?.scheduledAt).toBe('2026-09-08T01:00:00.000Z')
      expect(state.appointment?.status).toBe('booked')
      expect(state.oldAppointmentCancelled).toBe(true)
    })

    it('RESCHEDULE_SUCCEEDED with oldAppointmentCancelled:false surfaces it in state, not silently dropped', () => {
      const submitting: ManageState = {
        ...viewState,
        step: 'reschedule_picking',
        rescheduleIdempotencyKey: 'key-1',
        newSlot: { slotId: 9, resourceId: 2, startsAt: '2026-09-08T01:00:00.000Z', endsAt: '2026-09-08T01:30:00.000Z' },
        actionSubmission: 'submitting',
      }
      const state = manageReducer(submitting, {
        type: 'RESCHEDULE_SUCCEEDED',
        confirmationCode: 'NEW999',
        accessToken: 'new-access-tok',
        scheduledAt: '2026-09-08T01:00:00.000Z',
        oldAppointmentCancelled: false,
      })
      expect(state.oldAppointmentCancelled).toBe(false)
    })

    it('REQUIRED: RESCHEDULE_FAILED (e.g. the new slot was taken before submit) leaves the original appointment completely unchanged', () => {
      const submitting: ManageState = {
        ...viewState,
        step: 'reschedule_picking',
        rescheduleIdempotencyKey: 'key-1',
        newSlot: { slotId: 9, resourceId: 2, startsAt: '2026-09-08T01:00:00.000Z', endsAt: '2026-09-08T01:30:00.000Z' },
        actionSubmission: 'submitting',
      }
      const error = { code: 'SLOT_FULL' as const, message: 'The selected slot is no longer available' }

      const state = manageReducer(submitting, { type: 'RESCHEDULE_FAILED', error })

      // Not just "no error thrown" — the original appointment (confirmation
      // code, credentials, scheduled time) must be byte-for-byte the same
      // object it was before the failed attempt.
      expect(state.appointment).toBe(submitting.appointment)
      expect(state.appointment).toEqual(appointment)
      expect(state.confirmationCode).toBe('ABC123')
      expect(state.accessToken).toBe('access-tok')
      expect(state.actionSubmission).toBe('idle')
      expect(state.actionError).toEqual(error)
      // Stays in reschedule_picking, not bounced back to 'view' or forward
      // to 'rescheduled' — the customer can immediately try a different slot.
      expect(state.step).toBe('reschedule_picking')
    })

    it('EXIT_RESCHEDULE returns to view and clears the selected slot and any error', () => {
      const picking: ManageState = {
        ...viewState,
        step: 'reschedule_picking',
        rescheduleIdempotencyKey: 'key-1',
        newSlot: { slotId: 9, resourceId: 2, startsAt: '2026-09-08T01:00:00.000Z', endsAt: '2026-09-08T01:30:00.000Z' },
        actionError: { code: 'SLOT_FULL', message: 'full' },
      }
      const state = manageReducer(picking, { type: 'EXIT_RESCHEDULE' })
      expect(state.step).toBe('view')
      expect(state.newSlot).toBeUndefined()
      expect(state.actionError).toBeUndefined()
    })
  })
})
