// ─────────────────────────────────────────────────────────────────────────────
// Free-text screening — the layer that decides whether a typed question is
// allowed to reach the LLM at all.
//
// Pure, dependency-free, and deliberately shared by BOTH sides:
//   - the browser, through `createClinicTriageResolver` (triage.ts), so a
//     medical question routes to the flow's structural `refusal.medical`
//     node and no request is ever made; and
//   - the server, inside `answerReceptionQuestion` (ai/answer.ts), so the
//     same verdict is re-derived for anything that POSTs the endpoint
//     directly without going through the widget.
//
// This module NEVER decides what the visitor is told — it returns a verdict,
// and the flow graph / i18n copy own the wording. In particular it does not
// replace `RefusalNode`: it is what finally makes free text able to reach
// that node, which until now only the "symptoms/treatment" menu button could.
//
// Both lists are heuristics over an open set, and are the CHEAP layer: they
// catch recognizable classes before any token is spent. The prompt-level
// constraint in ai/prompt.ts is the general catch-all for whatever these
// miss — see the table in that file's header for which layer owns what.
// ─────────────────────────────────────────────────────────────────────────────

export type QuestionScreen =
  /** Symptoms, injuries, diagnosis, "will it heal", medication. Never reaches the LLM. */
  | 'medical'
  /** Recognizably nothing to do with the clinic (code, weather, politics, prompt-poking). Never reaches the LLM. */
  | 'off-topic'
  /** Nothing disqualifying found — eligible for a grounded answer. */
  | 'clinic'

/**
 * Symptom / diagnosis / prognosis language, ja + en.
 *
 * Tuned to fire on the visitor asking about a BODY or a course of treatment,
 * not on the mere mention of a treatment name: "骨盤矯正はいくらですか"
 * (a price question) must still reach the FAQ/AI path, so service nouns like
 * 矯正 / リハビリ / マッサージ are deliberately absent. What is listed here is
 * either a symptom, an injury, or an ask for clinical judgement.
 */
const MEDICAL_PATTERNS: readonly RegExp[] = [
  // ── Japanese: symptoms and injuries ──────────────────────────────────
  /痛[いくみむ]/,
  // Kanji-less 「いたい」 only after a subject particle: 「腰がいたい」 screens,
  // 「現金で支払いたい」 (a payment question) must not.
  /[がはも]いた[いくみ]/,
  /しびれ|痺れ/,
  /腫れ|むくみ/,
  /めまい|眩暈/,
  /肩こり|首こり|背中のこり|凝り/,
  /[肩腰首足脚背](中)?が張/,
  /だるい|重だるい/,
  /ぎっくり|寝違え/,
  /捻挫|打撲|挫傷|骨折|脱臼|肉離れ/,
  /ヘルニア|坐骨神経痛|神経痛|五十肩|四十肩|腱鞘炎|むちうち|むち打ち/,
  /症状|持病|既往/,
  /怪我|けが|負傷/,
  // ── Japanese: asking for clinical judgement ──────────────────────────
  /治り|治る|治ります|完治|回復し/,
  /効き|効果はあり|効くの/,
  /診断|見立て/,
  // 「薬局はどこ」 (a directions question) must not screen as medical — hence
  // the particle-anchored forms rather than a bare 薬.
  /お薬|薬(を|は|が|も)|服薬|処方|湿布/,
  /病院に行/,
  /通えば|通院すれば|何回くらい|どのくらいで良く/,
  /悪化/,
  // ── English: symptoms and injuries ───────────────────────────────────
  /\b(pain|painful|hurts?|hurting|ache|aches|aching|sore|soreness|stiff|stiffness)\b/,
  /\b(numb|numbness|tingling|swelling|swollen|dizzy|dizziness)\b/,
  /\b(injur\w*|sprain\w*|strain\w*|fracture\w*|dislocat\w*|whiplash|herniat\w*|sciatica|tendinitis|tendonitis)\b/,
  /\b(symptom|symptoms|condition|diagnos\w*)\b/,
  // ── English: asking for clinical judgement ───────────────────────────
  /\b(cure|cured|heal|healed|healing|recover|recovery)\b/,
  /\b(medication|medicine|prescription|painkillers?)\b/,
  /\b(should i (see|get|go)|do i need (treatment|surgery|an? x-?ray))\b/,
  /\b(how (long|many sessions) (until|before|will it take))\b/,
]

/**
 * Off-topic but NOT medical — the gap the audit called out: an LLM will
 * happily answer things the FAQ menu was deliberately built never to touch.
 *
 * A denylist of recognizable CLASSES, not an attempt at closed-world
 * coverage. An allowlist ("does the question contain a clinic keyword?")
 * was considered and rejected: it deflects perfectly reasonable operational
 * questions that happen to use no listed noun ("can I bring my child?"),
 * which is a worse failure than the prompt constraint occasionally having to
 * do the work. Anything not caught here still faces a system prompt that
 * only holds clinic content and is told to decline what that content does
 * not cover.
 */
const OFF_TOPIC_PATTERNS: readonly RegExp[] = [
  // ── Code / homework / computation ────────────────────────────────────
  /コード(を|書|の)|プログラム(を|書)|バグ|デバッグ|宿題|課題を解/,
  /\b(write|debug|refactor|explain) (me )?(some )?(code|a function|a script|a program)\b/,
  /\b(python|javascript|typescript|java|sql|regex|html|css)\b/,
  /\b(solve|calculate|compute) (this|the|my)\b/,
  /計算して|方程式/,
  // ── Creative / general-purpose assistant asks ────────────────────────
  /詩を|物語を|小説を|作文|レシピ|冗談|ジョーク|川柳|俳句/,
  /\b(write|compose|draft) (me )?(an? )?(poem|story|song|essay|joke|email|recipe)\b/,
  /翻訳して|要約して/,
  /\b(translate|summari[sz]e) (this|the following|it)\b/,
  // ── General knowledge / current events ───────────────────────────────
  /天気|気温|降水|台風/,
  /\b(weather|forecast|temperature outside)\b/,
  /株価|為替|ビットコイン|仮想通貨|投資/,
  /\b(stock price|bitcoin|crypto|exchange rate)\b/,
  /選挙|政治|首相|大統領|宗教/,
  /\b(politics|election|president|prime minister|religion)\b/,
  /\b(who won|what year did|capital of)\b/,
  // ── Recommendations outside the clinic ───────────────────────────────
  /おすすめの(映画|音楽|本|レストラン|店|旅行)/,
  /\b(recommend|suggest) (me )?(a )?(movie|film|book|restaurant|song|hotel)\b/,
  // ── Meta / prompt poking ─────────────────────────────────────────────
  /ignore (all )?(previous|prior|above) (instructions?|prompts?)/,
  /system prompt|プロンプト(を|は|教)|jailbreak/,
  /\b(what (ai |llm |language )?model are you|are you (chatgpt|gpt|claude|an ai))\b/,
  /あなたは(ai|人工知能|チャットgpt|ロボット)/,
  /\b(act as|pretend to be|roleplay as)\b/,
]

/**
 * Full-width → half-width and case folding, so 「ＰＹＴＨＯＮ」/"Python" and
 * "PAIN"/"pain" screen identically. NFKC also normalizes half-width katakana,
 * which visitors on some IMEs do produce.
 */
function normalize(text: string): string {
  return text.normalize('NFKC').toLowerCase()
}

/**
 * Screens one free-text question. Medical is checked FIRST and wins outright:
 * a question that is both ("my back hurts, is there parking?") must land on
 * the refusal path, never on an answer.
 *
 * Empty/whitespace input screens as `clinic` — the flow's `required`
 * validator on `faq.ask` already rejects it before triage, so there is no
 * empty question here to have an opinion about.
 */
export function screenQuestion(text: string): QuestionScreen {
  const question = normalize(text)
  if (!question.trim()) return 'clinic'
  if (MEDICAL_PATTERNS.some((pattern) => pattern.test(question))) return 'medical'
  if (OFF_TOPIC_PATTERNS.some((pattern) => pattern.test(question))) return 'off-topic'
  return 'clinic'
}
