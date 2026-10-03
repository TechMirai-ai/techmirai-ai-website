'use client'

import { useBookingFlow } from './flow/useBookingFlow'
import type { VisitType } from './flow/types'
import { CalendarStep } from './steps/CalendarStep'
import { ConfirmationStep } from './steps/ConfirmationStep'
import { ContactFormStep } from './steps/ContactFormStep'
import { ServiceStep } from './steps/ServiceStep'
import { SuccessStep } from './steps/SuccessStep'
import { VisitTypeStep } from './steps/VisitTypeStep'
import type { CustomerInput } from '../api/schemas'

export interface BookingFlowProps {
  locale: string
  /** For the 診察券 success screen — never imports siteConfig internally. */
  clinicName: string
  onComplete?: ((result: { confirmationCode: string }) => void) | undefined
  className?: string
  /**
   * STEP 2 Part 2 item 6 (LIFF returning-patient shortcut) — when BOTH are
   * set, the flow starts at the service step with visit-type and contact
   * already known (treated as already confirmed, matching an existing
   * customer record), skipping the visit-type and contact steps entirely.
   * The caller (the LIFF page) is responsible for showing its own
   * "Continue as [name]?" confirm screen BEFORE mounting with these set —
   * this component has no such screen itself.
   */
  initialVisitType?: VisitType | undefined
  initialCustomer?: CustomerInput | undefined
  /**
   * STEP 2 Part 2 item 3 (LIFF first-time booker) — pre-fills the contact
   * form as an editable suggestion (e.g. liff.getProfile().displayName in
   * given_name). Never auto-submitted; ignored once initialCustomer is
   * set, since that path skips the contact form altogether.
   */
  contactPrefill?: Partial<CustomerInput> | undefined
  /**
   * STEP 2 Part 2 items 4 & 6 — raw LIFF ID token for the current session,
   * threaded through to reserve() so the server can verify it and attach
   * the resulting lineUserId to the customer record. Undefined for the
   * plain web/chat flow.
   */
  lineIdToken?: string | undefined
}

/**
 * Self-contained booking flow — mounts in a standalone page, a chat
 * widget, and a LINE LIFF webview (STEP 2 Part 2) alike. Takes no
 * page-level dependencies: no siteConfig, no Container/Section, no
 * Next.js routing — only these props. The LIFF-only props above are a
 * narrow, backward-compatible addition (all optional, default to the
 * exact prior behavior) — nothing about the routing-independence
 * property STEP 2 Part 1's audit verified has changed.
 *
 * Known gap: step transitions below don't move focus or announce the
 * change via aria-live, so screen-reader users get no signal that the
 * step changed mid-flow. Real UX work (focus target per step, live
 * region wording), not a quick fix — tracked, due before WO-8
 * (production go-live), not left open-ended.
 */
export function BookingFlow({
  locale,
  clinicName,
  onComplete,
  className = '',
  initialVisitType,
  initialCustomer,
  contactPrefill,
  lineIdToken,
}: BookingFlowProps) {
  const flow = useBookingFlow(
    locale,
    initialVisitType && initialCustomer ? { visitType: initialVisitType, customer: initialCustomer } : undefined,
    lineIdToken,
  )
  const { state } = flow

  return (
    <div data-locale={locale} className={['booking-flow font-sans', className].filter(Boolean).join(' ')}>
      {state.step === 'visit-type' && <VisitTypeStep onSelect={flow.selectVisitType} />}

      {state.step === 'service' && state.visitType && (
        <ServiceStep
          services={flow.services}
          isLoading={flow.servicesLoading}
          hasError={flow.servicesError}
          visitType={state.visitType}
          onSelect={flow.selectService}
          onBack={() => flow.goBack()}
        />
      )}

      {state.step === 'calendar' && (
        <CalendarStep
          weekStart={flow.weekStart}
          availability={flow.availability}
          isLoading={flow.availabilityLoading}
          selectedSlot={state.slot}
          onSelectSlot={flow.selectSlot}
          onPrevWeek={flow.goToPrevWeek}
          onNextWeek={flow.goToNextWeek}
          canGoPrevWeek={flow.canGoPrevWeek}
          onContinue={flow.enterContactStep}
          onBack={() => flow.goBack()}
        />
      )}

      {state.step === 'contact' && (
        <ContactFormStep
          onSubmit={flow.submitContactForm}
          onBack={() => flow.goBack()}
          initialValues={state.customer ?? contactPrefill}
        />
      )}

      {state.step === 'confirmation' && state.visitType && state.service && state.slot && state.customer && (
        <ConfirmationStep
          visitType={state.visitType}
          service={state.service}
          slot={state.slot}
          customer={state.customer}
          isSubmitting={state.submission === 'submitting'}
          submitError={state.submitError}
          onConfirm={flow.confirmSubmit}
          onEditSlot={() => flow.goBack('calendar')}
          onBack={() => flow.goBack()}
        />
      )}

      {state.step === 'success' && state.customer && state.slot && state.reserveResult && (
        <SuccessStep
          clinicName={clinicName}
          customerName={`${state.customer.family_name} ${state.customer.given_name}`}
          startsAt={state.slot.startsAt}
          reserveResult={state.reserveResult}
          onComplete={onComplete}
        />
      )}
    </div>
  )
}
