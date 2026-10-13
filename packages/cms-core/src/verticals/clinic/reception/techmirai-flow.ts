import type { ChoiceOption, FlowGraph, FlowNode } from '@techmirai/reception-engine'
import {
  AI_NODE_ID,
  ALL_ENTRIES,
  BOOKING_NODE_ID,
  MATCHED_ENTRIES,
  MENU_BUTTON_IDS,
  MENU_NODE_ID,
  OFF_TOPIC_NODE_ID,
  QUESTION_FIELD,
  START_NODE_ID,
  TALK_TO_PERSON_NODE_ID,
  TRIAGE_NODE_ID,
  type ChatEntry,
  type NextButton,
} from './techmirai-chat-content'
import { RECEPTION_AI_ANSWER_KEY } from './flow'

const GREETING_KEY = 'reception.greeting'

const answerKey = (id: string) => `reception.tm.${id}.answer`
const labelKey = (id: string) => `reception.tm.${id}.label`
const buttonKey = (name: string) => `reception.tm.btn.${name}`

/** The six main-menu buttons, in Spec order. */
function menuOptions(): ChoiceOption[] {
  return MENU_BUTTON_IDS.map((id) => ({ labelKey: labelKey(id), value: id, next: id }))
}

/**
 * One "next button". A node button steps to that node; a link button stays on
 * the current node (`next` points back at it) and carries `href`; a booking
 * button steps to the inline booking component.
 */
function toOption(button: NextButton, index: number, fromNodeId: string): ChoiceOption {
  switch (button.kind) {
    case 'node':
      return {
        labelKey: button.to === MENU_NODE_ID ? buttonKey('menu') : labelKey(button.to),
        value: button.to,
        next: button.to,
      }
    case 'link':
      return {
        labelKey: buttonKey(button.label),
        value: `link-${index}`,
        next: fromNodeId,
        href: button.href,
        ...(button.newTab ? { newTab: true } : {}),
      }
    case 'booking':
      return { labelKey: buttonKey(button.label), value: `booking-${index}`, next: BOOKING_NODE_ID }
  }
}

function answerNode(entry: ChatEntry): FlowNode {
  // C01 is the main menu, and the rule-13 redirect "shows the menu": both offer the six menu entries.
  const showsMenu = entry.id === MENU_NODE_ID || entry.id === OFF_TOPIC_NODE_ID
  const options = showsMenu ? menuOptions() : entry.next.map((b, i) => toOption(b, i, entry.id))
  return { id: entry.id, type: 'choice', promptKey: answerKey(entry.id), options }
}

/**
 * Reception flow for TechMirai (Spec §16). Every answer is a `choice` node:
 * its prompt is the answer text and its options are the Spec's "next buttons",
 * so a button press and a matched typed question land on the same node and show
 * the same answer with the same buttons.
 *
 * Typed text never routes itself: the host jumps to `triage` with the question
 * in `question`, and the injected resolver (techmirai-triage.ts) answers with
 * one of the 36 matched nodes or `ai`. The AI node answers once and returns to
 * "Talk to a person", so a failed or unknown answer always ends at a human.
 */
export const techmiraiReceptionFlow: FlowGraph = {
  id: 'techmirai.reception',
  start: START_NODE_ID,
  nodes: {
    [START_NODE_ID]: { id: START_NODE_ID, type: 'choice', promptKey: GREETING_KEY, options: menuOptions() },

    ...Object.fromEntries(ALL_ENTRIES.map((entry) => [entry.id, answerNode(entry)])),

    [BOOKING_NODE_ID]: { id: BOOKING_NODE_ID, type: 'component', componentId: 'booking' },

    [TRIAGE_NODE_ID]: {
      id: TRIAGE_NODE_ID,
      type: 'triage',
      field: QUESTION_FIELD,
      refuseTo: 'f09',
      // The 36 matched answers, "Talk to a person" (a typed request for staff) and
      // the rule-13 redirect (an off-topic question).
      allow: [...MATCHED_ENTRIES.map((entry) => entry.id), TALK_TO_PERSON_NODE_ID, OFF_TOPIC_NODE_ID],
      aiFallback: AI_NODE_ID,
    },

    [AI_NODE_ID]: {
      id: AI_NODE_ID,
      type: 'ai-fallback',
      field: QUESTION_FIELD,
      textKey: RECEPTION_AI_ANSWER_KEY,
      backTo: TALK_TO_PERSON_NODE_ID,
    },
  },
}
