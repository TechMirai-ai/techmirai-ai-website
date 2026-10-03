// ─────────────────────────────────────────────────────────────────────────────
// Static answers for the six button-driven `faq` nodes (flow.ts).
//
// Replaces faq-resolver.ts / resolveClinicFaqAnswers, which queried the live
// `faqs` Payload collection by CLINIC_FAQ_SLUGS — both retired (see the
// delivery report). This is synchronous and does no I/O: the same
// FAQ_CONTENT_NODE_MAP that tells faq-matcher.ts which of the 36 entries can
// be a free-text match also tells this module which entries back each
// button's own displayed answer, so the two can never drift apart.
// ─────────────────────────────────────────────────────────────────────────────

import { clinicReceptionFlow } from './flow'
import { FAQ_CONTENT, FAQ_CONTENT_NODE_MAP, type FaqLocale } from './faq-content'

/**
 * Builds the `faqAnswers` map `createReceptionTextResolver` renders for the
 * flow's six `faq` nodes, keyed by each node's own `answerKey` (unchanged
 * strings like `faq.clinic-hours` — now just internal identifiers, no
 * longer tied to a Payload slug).
 *
 * Where more than one FAQ_CONTENT entry maps to the same node (faq-31 +
 * faq-32 both feed faq.hours; faq-33 + faq-34 feed faq.access; faq-35 +
 * faq-36 feed faq.prices; faq-05 + faq-06 feed faq.first-visit), their
 * answers are joined with a blank line, in FAQ_CONTENT's own order —
 * neither is dropped. A node backed by exactly one entry (faq.parking:
 * faq-29, faq.bring: faq-10) just gets that entry's answer.
 */
export function buildStaticFaqAnswers(locale: string): Record<string, string> {
  const faqLocale: FaqLocale = locale === 'ja' ? 'ja' : 'en'

  const answersByNodeId = new Map<string, string[]>()
  for (const content of FAQ_CONTENT) {
    const nodeId = FAQ_CONTENT_NODE_MAP[content.id]
    if (!nodeId) continue
    const parts = answersByNodeId.get(nodeId) ?? []
    parts.push(content.answer[faqLocale])
    answersByNodeId.set(nodeId, parts)
  }

  const answers: Record<string, string> = {}
  for (const node of Object.values(clinicReceptionFlow.nodes)) {
    if (node.type !== 'faq') continue
    const parts = answersByNodeId.get(node.id)
    if (parts && parts.length > 0) answers[node.answerKey] = parts.join('\n\n')
  }
  return answers
}
