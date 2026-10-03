// Server-only surface of the reception AI fallback. Kept behind its own
// package export ("@techmirai/cms-core/reception/ai") rather than the
// reception barrel: corpus.ts pulls in Payload, and the reception barrel is
// reachable from client components.
export { compileAiCorpus, CORPUS_SOURCES } from './corpus'
export type { CompileAiCorpusArgs, CorpusDocument } from './corpus'
export { callGroq, GROQ_API_URL, GROQ_DEFAULT_MODEL, GROQ_TIMEOUT_MS } from './groq'
export type { CallGroqOptions, GroqFailureReason, GroqResult, GroqUsage } from './groq'
export {
  buildGroundingContext,
  buildReceptionPrompt,
  buildSystemPrompt,
  estimateTokens,
  MAX_ANSWER_TOKENS,
  MAX_CONTEXT_TOKENS,
  MAX_DOCUMENT_TOKENS,
} from './prompt'
export type { BuildPromptArgs, BuiltPrompt, GroundingContext, PromptLocale, PromptMessage } from './prompt'
export { answerReceptionQuestion } from './answer'
export { handleReceptionAiRequest, RECEPTION_AI_RATE_LIMIT_PREFIX } from './handler'
export type { ReceptionAiHandlerDeps, ReceptionAiHandlerInput, ReceptionAiHandlerResult } from './handler'
export type { AnswerReceptionQuestionArgs, ReceptionAnswerResult } from './answer'
