import { describe, expect, it } from 'vitest'

import { bookingFlowReducer } from './reducer'
import { INITIAL_FLOW_STATE } from './types'
import type { FlowState } from './types'

const service = { id: 1, name: '一般診察', duration_min: 30, price_yen: 3000, first_visit_allowed: true }
const slot = { slotId: 10, resourceId: 20, startsAt: '2027-01-04T01:00:00.000Z', endsAt: '2027-01-04T01:30:00.000Z' }
const customer = {
  family_name: '山田',
  given_name: '太郎',
  family_name_kana: 'ヤマダ',
  given_name_kana: 'タロウ',
  phone: '090-0000-0000',
}

describe('bookingFlowReducer', () => {
  it('starts on the visit-type step with no idempotency key', () => {
    expect(INITIAL_FLOW_STATE.step).toBe('visit-type')
    expect(INITIAL_FLOW_STATE.idempotencyKey).toBeNull()
  })

  it('SELECT_VISIT_TYPE stores the choice and advances to service', () => {
    const state = bookingFlowReducer(INITIAL_FLOW_STATE, { type: 'SELECT_VISIT_TYPE', visitType: 'first' })
    expect(state.visitType).toBe('first')
    expect(state.step).toBe('service')
  })

  it('SELECT_SERVICE stores the service and advances to calendar', () => {
    const state = bookingFlowReducer(INITIAL_FLOW_STATE, { type: 'SELECT_SERVICE', service })
    expect(state.service).toEqual(service)
    expect(state.step).toBe('calendar')
  })

  it('SELECT_SERVICE clears a slot selected for a previously-chosen service', () => {
    const otherService = { ...service, id: 2, name: '再診' }
    const before: FlowState = { ...INITIAL_FLOW_STATE, step: 'service', service, slot }
    const state = bookingFlowReducer(before, { type: 'SELECT_SERVICE', service: otherService })
    expect(state.service).toEqual(otherService)
    expect(state.slot).toBeUndefined()
  })

  it('SELECT_SLOT stores the slot without changing step', () => {
    const before: FlowState = { ...INITIAL_FLOW_STATE, step: 'calendar' }
    const state = bookingFlowReducer(before, { type: 'SELECT_SLOT', slot })
    expect(state.slot).toEqual(slot)
    expect(state.step).toBe('calendar')
  })

  describe('ENTER_CONTACT_STEP (idempotency key lifecycle)', () => {
    it('advances to the contact step and generates the key on first entry', () => {
      const before: FlowState = { ...INITIAL_FLOW_STATE, step: 'calendar', slot }
      const state = bookingFlowReducer(before, { type: 'ENTER_CONTACT_STEP', idempotencyKey: 'key-one' })
      expect(state.step).toBe('contact')
      expect(state.idempotencyKey).toBe('key-one')
    })

    it('does not regenerate the key on a second ENTER_CONTACT_STEP dispatch', () => {
      const first = bookingFlowReducer(INITIAL_FLOW_STATE, { type: 'ENTER_CONTACT_STEP', idempotencyKey: 'key-one' })
      const second = bookingFlowReducer(first, { type: 'ENTER_CONTACT_STEP', idempotencyKey: 'key-two' })
      expect(second.idempotencyKey).toBe('key-one')
    })

    it('skips straight to confirmation instead of contact when seeded with a known customer (returning-patient shortcut, STEP 2 Part 2 item 6)', () => {
      const seeded: FlowState = {
        step: 'calendar',
        visitType: 'return',
        customer: {
          family_name: '田中',
          given_name: '花子',
          family_name_kana: 'タナカ',
          given_name_kana: 'ハナコ',
          phone: '090-0000-0000',
        },
        skipContactStep: true,
        idempotencyKey: null,
        submission: 'idle',
      }
      const next = bookingFlowReducer(seeded, { type: 'ENTER_CONTACT_STEP', idempotencyKey: 'idem-1' })
      expect(next.step).toBe('confirmation')
      expect(next.idempotencyKey).toBe('idem-1')
      // Customer/visitType from the seed are untouched — never re-derived
      // from a contact-form submission that never happened.
      expect(next.customer).toEqual(seeded.customer)
      expect(next.visitType).toBe('return')
    })

    it('still goes to the contact step for the ordinary web flow (customer not yet known)', () => {
      const next = bookingFlowReducer(
        { ...INITIAL_FLOW_STATE, step: 'calendar' },
        { type: 'ENTER_CONTACT_STEP', idempotencyKey: 'idem-2' },
      )
      expect(next.step).toBe('contact')
    })

    it('REGRESSION: still goes to the contact step for an ordinary web user, even after they submitted it once and backed up twice with a customer already set', () => {
      // The bug this guards against: keying the skip decision off
      // state.customer (instead of the dedicated skipContactStep flag)
      // would wrongly skip the contact step here, since GO_BACK
      // deliberately leaves state.customer set so a single
      // back-then-forward repopulates the form — see types.ts's doc
      // comment on skipContactStep.
      const submitted = bookingFlowReducer(
        { ...INITIAL_FLOW_STATE, step: 'contact' },
        {
          type: 'SUBMIT_CONTACT_FORM',
          customer: {
            family_name: '山田',
            given_name: '太郎',
            family_name_kana: 'ヤマダ',
            given_name_kana: 'タロウ',
            phone: '090-0000-0000',
          },
        },
      )
      expect(submitted.step).toBe('confirmation')

      const backOnce = bookingFlowReducer(submitted, { type: 'GO_BACK' })
      expect(backOnce.step).toBe('contact')
      const backTwice = bookingFlowReducer(backOnce, { type: 'GO_BACK' })
      expect(backTwice.step).toBe('calendar')
      expect(backTwice.customer).toBeDefined() // still set — that's the point

      const forward = bookingFlowReducer(backTwice, { type: 'ENTER_CONTACT_STEP', idempotencyKey: 'idem-3' })
      expect(forward.step).toBe('contact')
    })

    it('preserves the key across a back-then-forward navigation', () => {
      const entered = bookingFlowReducer(INITIAL_FLOW_STATE, { type: 'ENTER_CONTACT_STEP', idempotencyKey: 'key-one' })
      const back = bookingFlowReducer(entered, { type: 'GO_BACK' })
      expect(back.step).toBe('calendar')
      const forward = bookingFlowReducer(back, { type: 'ENTER_CONTACT_STEP', idempotencyKey: 'key-two' })
      expect(forward.idempotencyKey).toBe('key-one')
      expect(forward.step).toBe('contact')
    })
  })

  it('SUBMIT_CONTACT_FORM stores the customer and advances to confirmation', () => {
    const before: FlowState = { ...INITIAL_FLOW_STATE, step: 'contact', idempotencyKey: 'key-one' }
    const state = bookingFlowReducer(before, { type: 'SUBMIT_CONTACT_FORM', customer })
    expect(state.customer).toEqual(customer)
    expect(state.step).toBe('confirmation')
  })

  describe('CONFIRM_SUBMIT / no-optimistic-UI submit', () => {
    const readyState: FlowState = {
      ...INITIAL_FLOW_STATE,
      step: 'confirmation',
      idempotencyKey: 'key-one',
      service,
      slot,
      customer,
    }

    it('sets submission to submitting and clears any prior error, without changing step', () => {
      const errored: FlowState = { ...readyState, submission: 'error', submitError: { code: 'INTERNAL', message: 'x' } }
      const state = bookingFlowReducer(errored, { type: 'CONFIRM_SUBMIT' })
      expect(state.submission).toBe('submitting')
      expect(state.submitError).toBeUndefined()
      expect(state.step).toBe('confirmation')
    })

    it('is a no-op if already submitting — guards against a double-tapped submit racing two dispatches', () => {
      const submitting: FlowState = { ...readyState, submission: 'submitting' }
      const state = bookingFlowReducer(submitting, { type: 'CONFIRM_SUBMIT' })
      expect(state).toBe(submitting)
    })

    it('is a no-op without an idempotency key', () => {
      const noKey: FlowState = { ...readyState, idempotencyKey: null }
      const state = bookingFlowReducer(noKey, { type: 'CONFIRM_SUBMIT' })
      expect(state).toBe(noKey)
    })

    it('RESERVE_SUCCEEDED moves to the success step only after being dispatched — never before', () => {
      const submitting = bookingFlowReducer(readyState, { type: 'CONFIRM_SUBMIT' })
      expect(submitting.step).toBe('confirmation')

      const succeeded = bookingFlowReducer(submitting, {
        type: 'RESERVE_SUCCEEDED',
        result: { confirmationCode: 'ABC123', accessToken: 'tok', linkToken: 'link-tok' },
      })
      expect(succeeded.step).toBe('success')
      expect(succeeded.submission).toBe('success')
      expect(succeeded.reserveResult).toEqual({ confirmationCode: 'ABC123', accessToken: 'tok', linkToken: 'link-tok' })
    })

    it('RESERVE_FAILED stays on confirmation with the error recorded, re-enabling retry', () => {
      const submitting = bookingFlowReducer(readyState, { type: 'CONFIRM_SUBMIT' })
      const failed = bookingFlowReducer(submitting, {
        type: 'RESERVE_FAILED',
        error: { code: 'SLOT_FULL', message: 'That time is no longer available' },
      })
      expect(failed.step).toBe('confirmation')
      expect(failed.submission).toBe('error')
      expect(failed.submitError).toEqual({ code: 'SLOT_FULL', message: 'That time is no longer available' })
    })

    it('a retry after RESERVE_FAILED reuses the same idempotency key', () => {
      const submitting = bookingFlowReducer(readyState, { type: 'CONFIRM_SUBMIT' })
      const failed = bookingFlowReducer(submitting, {
        type: 'RESERVE_FAILED',
        error: { code: 'INTERNAL', message: 'Something went wrong' },
      })
      const retried = bookingFlowReducer(failed, { type: 'CONFIRM_SUBMIT' })
      expect(retried.idempotencyKey).toBe('key-one')
      expect(retried.submission).toBe('submitting')
    })
  })

  describe('GO_BACK', () => {
    it('moves back one step in FLOW_STEPS order by default', () => {
      const before: FlowState = { ...INITIAL_FLOW_STATE, step: 'contact', idempotencyKey: 'key-one' }
      const state = bookingFlowReducer(before, { type: 'GO_BACK' })
      expect(state.step).toBe('calendar')
    })

    it('does not go back past the first step', () => {
      const state = bookingFlowReducer(INITIAL_FLOW_STATE, { type: 'GO_BACK' })
      expect(state.step).toBe('visit-type')
    })

    it('jumps to an explicit `to` step and clears the stale slot selection', () => {
      const before: FlowState = { ...INITIAL_FLOW_STATE, step: 'confirmation', idempotencyKey: 'key-one', slot }
      const state = bookingFlowReducer(before, { type: 'GO_BACK', to: 'calendar' })
      expect(state.step).toBe('calendar')
      expect(state.slot).toBeUndefined()
    })

    it('clears submission/submitError so a fresh attempt starts clean', () => {
      const before: FlowState = {
        ...INITIAL_FLOW_STATE,
        step: 'confirmation',
        idempotencyKey: 'key-one',
        submission: 'error',
        submitError: { code: 'SLOT_FULL', message: 'x' },
      }
      const state = bookingFlowReducer(before, { type: 'GO_BACK', to: 'calendar' })
      expect(state.submission).toBe('idle')
      expect(state.submitError).toBeUndefined()
    })

    it('never navigates away while a reserve() call is in flight', () => {
      const submitting: FlowState = { ...INITIAL_FLOW_STATE, step: 'confirmation', idempotencyKey: 'key-one', submission: 'submitting' }
      const state = bookingFlowReducer(submitting, { type: 'GO_BACK' })
      expect(state).toBe(submitting)
    })

    it('preserves the idempotency key across any back navigation', () => {
      const before: FlowState = { ...INITIAL_FLOW_STATE, step: 'contact', idempotencyKey: 'key-one' }
      const state = bookingFlowReducer(before, { type: 'GO_BACK' })
      expect(state.idempotencyKey).toBe('key-one')
    })
  })
})
