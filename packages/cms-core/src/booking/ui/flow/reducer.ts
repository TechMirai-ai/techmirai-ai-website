import { FLOW_STEPS } from './types'
import type { FlowAction, FlowState, FlowStep } from './types'

function previousStep(step: FlowStep): FlowStep {
  const index = FLOW_STEPS.indexOf(step)
  return index <= 0 ? step : (FLOW_STEPS[index - 1] as FlowStep)
}

/**
 * Pure state machine for the booking flow — no React, DOM, fetch, or crypto
 * dependency, so every transition is testable with zero mocks. useBookingFlow.ts
 * is the only place that wires this to the typed API client.
 */
export function bookingFlowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case 'SELECT_VISIT_TYPE':
      return { ...state, visitType: action.visitType, step: 'service' }

    case 'SELECT_SERVICE':
      // A slot picked for a different service is meaningless once the
      // service changes — the calendar's next render is for a different
      // resource/duration, so any stale selection must not survive.
      return { ...state, service: action.service, slot: undefined, step: 'calendar' }

    case 'SELECT_SLOT':
      return { ...state, slot: action.slot }

    case 'ENTER_CONTACT_STEP':
      return {
        ...state,
        // Returning-patient shortcut (STEP 2 Part 2 item 6): skipContactStep
        // is set only at flow seed time (see types.ts's doc comment) and
        // never changes afterward — deliberately NOT keyed off state.customer,
        // which the ordinary web flow also sets (via SUBMIT_CONTACT_FORM)
        // and keeps set across GO_BACK by design, so keying off it here
        // would wrongly skip the contact step for a normal web user who
        // backs up twice from confirmation and picks a different slot.
        step: state.skipContactStep ? 'confirmation' : 'contact',
        // Idempotent guard: once set, a later ENTER_CONTACT_STEP (e.g. after
        // GO_BACK then forward again) never overwrites it with a new key.
        idempotencyKey: state.idempotencyKey ?? action.idempotencyKey,
      }

    case 'SUBMIT_CONTACT_FORM':
      return { ...state, customer: action.customer, step: 'confirmation' }

    case 'CONFIRM_SUBMIT':
      // Guards a double-tapped submit button: the second of two rapid
      // dispatches sees submission already 'submitting' and no-ops, so at
      // most one reserve() call is ever in flight for this flow instance.
      if (state.submission === 'submitting' || !state.idempotencyKey) return state
      return { ...state, submission: 'submitting', submitError: undefined }

    case 'RESERVE_SUCCEEDED':
      return { ...state, step: 'success', submission: 'success', reserveResult: action.result }

    case 'RESERVE_FAILED':
      return { ...state, submission: 'error', submitError: action.error }

    case 'GO_BACK': {
      // Never navigate away while a reserve() call is in flight.
      if (state.submission === 'submitting') return state
      const nextStep = action.to ?? previousStep(state.step)
      return {
        ...state,
        step: nextStep,
        submission: 'idle',
        submitError: undefined,
        // A forced jump (e.g. away from a slot the server just rejected as
        // full/closed) invalidates the previous selection.
        ...(action.to ? { slot: undefined } : {}),
      }
    }

    default: {
      const exhaustiveCheck: never = action
      return exhaustiveCheck
    }
  }
}
