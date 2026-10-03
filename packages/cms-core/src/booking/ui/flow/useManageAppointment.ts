'use client'

import { useEffect, useReducer, useState } from 'react'

import { cancel, createIdempotencyKey, fetchAvailability, lookup, reschedule } from '../../api/client'
import type { AvailabilityResponse } from '../../api/schemas'
import { canGoToPreviousWeek, getWeekDates, startOfWeek, toDateOnlyString } from '../calendar/week'
import { manageReducer } from './manageReducer'
import type { ManageState } from './manageTypes'
import type { SelectedSlot } from './types'

export interface UseManageAppointmentResult {
  state: ManageState
  availability: AvailabilityResponse | null
  availabilityLoading: boolean
  weekStart: Date
  canGoPrevWeek: boolean
  cancelAppointment: () => void
  startReschedule: () => void
  selectNewSlot: (slot: SelectedSlot) => void
  confirmReschedule: () => void
  exitReschedule: () => void
  goToPrevWeek: () => void
  goToNextWeek: () => void
}

function initialState(confirmationCode: string, accessToken: string): ManageState {
  return {
    step: 'loading',
    confirmationCode,
    accessToken,
    actionSubmission: 'idle',
    rescheduleIdempotencyKey: null,
  }
}

/**
 * Wires the pure manageReducer to the typed API client — the only place in
 * this component tree that calls fetch, mirroring useBookingFlow.ts's own
 * split. confirmationCode/accessToken are whatever the manage link carried
 * (the caller is responsible for reading them from the URL and cleaning the
 * URL afterward — see the manage page component).
 */
export function useManageAppointment(confirmationCode: string, accessToken: string): UseManageAppointmentResult {
  const [state, dispatch] = useReducer(manageReducer, undefined, () => initialState(confirmationCode, accessToken))

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)

  // Looks up the appointment exactly once, for the credentials this hook
  // instance was created with — a successful reschedule rotates
  // confirmationCode/accessToken inside the reducer's own state rather than
  // triggering a refetch (see manageReducer's RESCHEDULE_SUCCEEDED).
  useEffect(() => {
    let cancelled = false
    lookup({ code: confirmationCode, token: accessToken }).then((result) => {
      if (cancelled) return
      if (result.ok) {
        dispatch({
          type: 'LOOKUP_SUCCEEDED',
          appointment: {
            confirmationCode: result.data.confirmation_code,
            status: result.data.status,
            visitType: result.data.visit_type,
            scheduledAt: result.data.scheduled_at,
            serviceId: result.data.service_id,
            resourceId: result.data.resource_id,
          },
        })
      } else {
        dispatch({ type: 'LOOKUP_FAILED' })
      }
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deliberately runs once per hook instance, not per credential change
  }, [])

  useEffect(() => {
    if (state.step !== 'reschedule_picking' || !state.appointment) return
    let cancelled = false
    setAvailabilityLoading(true)
    const weekDates = getWeekDates(weekStart).map(toDateOnlyString)
    fetchAvailability({
      from: weekDates[0]!,
      to: weekDates[weekDates.length - 1]!,
      service_id: state.appointment.serviceId,
    }).then((result) => {
      if (cancelled) return
      if (result.ok) setAvailability(result.data)
      setAvailabilityLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [state.step, state.appointment, weekStart])

  // No-optimistic-UI submit for both cancel and reschedule, fired exactly
  // by the reducer's transition into 'submitting' — never by a click
  // handler directly, same discipline as useBookingFlow.ts's reserve()
  // effect. Which request fires is determined by `step`: CANCEL_SUBMIT is
  // only ever dispatched while on 'view', RESCHEDULE_SUBMIT only while on
  // 'reschedule_picking'.
  useEffect(() => {
    if (state.actionSubmission !== 'submitting') return
    let cancelledEffect = false

    if (state.step === 'view') {
      cancel({ confirmation_code: state.confirmationCode, access_token: state.accessToken }).then((result) => {
        if (cancelledEffect) return
        if (result.ok) dispatch({ type: 'CANCEL_SUCCEEDED' })
        else dispatch({ type: 'CANCEL_FAILED', error: result.error })
      })
    } else if (state.step === 'reschedule_picking' && state.newSlot && state.rescheduleIdempotencyKey) {
      const newSlot = state.newSlot
      reschedule({
        confirmation_code: state.confirmationCode,
        access_token: state.accessToken,
        new_slot_id: newSlot.slotId,
        new_resource_id: newSlot.resourceId,
        idempotency_key: state.rescheduleIdempotencyKey,
      }).then((result) => {
        if (cancelledEffect) return
        if (result.ok) {
          dispatch({
            type: 'RESCHEDULE_SUCCEEDED',
            confirmationCode: result.data.confirmation_code,
            accessToken: result.data.access_token,
            scheduledAt: newSlot.startsAt,
            oldAppointmentCancelled: result.data.old_appointment_cancelled,
          })
        } else {
          dispatch({ type: 'RESCHEDULE_FAILED', error: result.error })
        }
      })
    }

    return () => {
      cancelledEffect = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reads state fields directly; re-runs only when actionSubmission flips to 'submitting'
  }, [state.actionSubmission])

  return {
    state,
    availability,
    availabilityLoading,
    weekStart,
    canGoPrevWeek: canGoToPreviousWeek(weekStart, new Date()),
    cancelAppointment: () => dispatch({ type: 'CANCEL_SUBMIT' }),
    startReschedule: () => dispatch({ type: 'ENTER_RESCHEDULE', idempotencyKey: createIdempotencyKey() }),
    selectNewSlot: (slot) => dispatch({ type: 'SELECT_NEW_SLOT', slot }),
    confirmReschedule: () => dispatch({ type: 'RESCHEDULE_SUBMIT' }),
    exitReschedule: () => dispatch({ type: 'EXIT_RESCHEDULE' }),
    goToPrevWeek: () => setWeekStart((w) => new Date(w.getTime() - 7 * 24 * 60 * 60 * 1000)),
    goToNextWeek: () => setWeekStart((w) => new Date(w.getTime() + 7 * 24 * 60 * 60 * 1000)),
  }
}
