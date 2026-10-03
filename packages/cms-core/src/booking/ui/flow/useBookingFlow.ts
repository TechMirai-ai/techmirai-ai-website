'use client'

import { useEffect, useReducer, useState } from 'react'

import { bookingFlowReducer } from './reducer'
import { FLOW_STEPS, INITIAL_FLOW_STATE } from './types'
import type { CustomerInput, VisitType } from './types'
import type { SelectedSlot, FlowState, FlowStep } from './types'
import { createIdempotencyKey, fetchAvailability, fetchBookableServices, reserve } from '../../api/client'
import type { AvailabilityResponse, BookableService } from '../../api/schemas'
import { canGoToPreviousWeek, getWeekDates, startOfWeek, toDateOnlyString } from '../calendar/week'

export interface UseBookingFlowResult {
  state: FlowState
  services: BookableService[]
  servicesLoading: boolean
  servicesError: boolean
  weekStart: Date
  availability: AvailabilityResponse | null
  availabilityLoading: boolean
  canGoPrevWeek: boolean
  selectVisitType: (visitType: VisitType) => void
  selectService: (service: BookableService) => void
  selectSlot: (slot: SelectedSlot) => void
  enterContactStep: () => void
  submitContactForm: (customer: CustomerInput) => void
  confirmSubmit: () => void
  goBack: (to?: FlowStep) => void
  goToPrevWeek: () => void
  goToNextWeek: () => void
}

/**
 * STEP 2 Part 2 item 6 (returning-patient shortcut): when both are set,
 * the flow starts at 'service' with visit-type and contact already known
 * — see reducer.ts's ENTER_CONTACT_STEP case, which skips the contact step
 * once it sees state.customer already populated.
 */
export interface BookingFlowSeed {
  visitType?: VisitType
  customer?: CustomerInput
}

function buildInitialState(seed: BookingFlowSeed | undefined): FlowState {
  if (!seed?.visitType || !seed.customer) return INITIAL_FLOW_STATE
  return {
    ...INITIAL_FLOW_STATE,
    step: 'service',
    visitType: seed.visitType,
    customer: seed.customer,
    skipContactStep: true,
  }
}

/**
 * Wires the pure bookingFlowReducer to the typed API client
 * (@techmirai/cms-core/booking/client) — the only place in this component
 * tree that calls fetch. Never hand-writes a request body; every call goes
 * through fetchBookableServices/fetchAvailability/reserve.
 *
 * `seed` and `lineIdToken` are LIFF-only (STEP 2 Part 2) — both undefined
 * for the plain web flow, which behaves exactly as before.
 */
export function useBookingFlow(
  locale: string,
  seed?: BookingFlowSeed,
  lineIdToken?: string,
): UseBookingFlowResult {
  const [state, dispatch] = useReducer(bookingFlowReducer, seed, buildInitialState)

  const [services, setServices] = useState<BookableService[]>([])
  const [servicesLoading, setServicesLoading] = useState(true)
  const [servicesError, setServicesError] = useState(false)

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setServicesLoading(true)
    setServicesError(false)
    fetchBookableServices({ locale }).then((result) => {
      if (cancelled) return
      if (result.ok) {
        setServices(result.data.services)
      } else {
        setServicesError(true)
      }
      setServicesLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [locale])

  useEffect(() => {
    if (!state.service) return
    let cancelled = false
    setAvailabilityLoading(true)
    const weekDates = getWeekDates(weekStart).map(toDateOnlyString)
    fetchAvailability({
      from: weekDates[0]!,
      to: weekDates[weekDates.length - 1]!,
      service_id: state.service.id,
    }).then((result) => {
      if (cancelled) return
      if (result.ok) setAvailability(result.data)
      setAvailabilityLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [state.service, weekStart])

  // No-optimistic-UI submit: this effect is the ONLY place reserve() is
  // called, fired exactly by the reducer's transition into 'submitting' —
  // never by a click handler directly — so the UI can never show success
  // before the server has actually responded.
  useEffect(() => {
    if (state.submission !== 'submitting') return
    if (!state.service || !state.slot || !state.customer || !state.idempotencyKey || !state.visitType) return

    let cancelled = false
    reserve({
      service_id: state.service.id,
      resource_id: state.slot.resourceId,
      slot_id: state.slot.slotId,
      visit_type: state.visitType,
      customer: state.customer,
      locale,
      idempotency_key: state.idempotencyKey,
      ...(lineIdToken ? { line_id_token: lineIdToken } : {}),
    }).then((result) => {
      if (cancelled) return
      if (result.ok) {
        dispatch({
          type: 'RESERVE_SUCCEEDED',
          result: {
            confirmationCode: result.data.confirmation_code,
            accessToken: result.data.access_token,
            linkToken: result.data.link_token,
          },
        })
      } else {
        dispatch({ type: 'RESERVE_FAILED', error: result.error })
      }
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reads state fields directly; re-runs only when submission flips to 'submitting'
  }, [state.submission])

  return {
    state,
    services,
    servicesLoading,
    servicesError,
    weekStart,
    availability,
    availabilityLoading,
    canGoPrevWeek: canGoToPreviousWeek(weekStart, new Date()),
    selectVisitType: (visitType) => dispatch({ type: 'SELECT_VISIT_TYPE', visitType }),
    selectService: (service) => dispatch({ type: 'SELECT_SERVICE', service }),
    selectSlot: (slot) => dispatch({ type: 'SELECT_SLOT', slot }),
    enterContactStep: () => dispatch({ type: 'ENTER_CONTACT_STEP', idempotencyKey: createIdempotencyKey() }),
    submitContactForm: (customer) => dispatch({ type: 'SUBMIT_CONTACT_FORM', customer }),
    confirmSubmit: () => dispatch({ type: 'CONFIRM_SUBMIT' }),
    goBack: (to) => dispatch({ type: 'GO_BACK', to }),
    goToPrevWeek: () => setWeekStart((w) => new Date(w.getTime() - 7 * 24 * 60 * 60 * 1000)),
    goToNextWeek: () => setWeekStart((w) => new Date(w.getTime() + 7 * 24 * 60 * 60 * 1000)),
  }
}

// Re-exported so step components can type their props against FLOW_STEPS-derived indices without a second import path.
export { FLOW_STEPS }
