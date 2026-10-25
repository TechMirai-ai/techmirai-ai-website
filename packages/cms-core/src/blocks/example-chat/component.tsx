'use client'

import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { staggerContainer, fadeInUp } from '../../lib/motion'
import type { ExampleChatBlockProps } from './types'

// Spec §7: this exact label must appear on every example chat. Hardcoded
// here (not a seeded field) so it cannot be omitted by an incomplete seed —
// see config.ts's comment.
const EXAMPLE_LABEL: Record<string, string> = {
  en: 'Example conversation. Details are illustrative.',
  ja: '会話の例です。内容はイメージです。',
}

// The Spec's own Speaker column shows "AI受付" unchanged even in EN rows —
// never translated, so it is hardcoded rather than taken from any field.
const AI_SPEAKER_LABEL = 'AI受付'

export function ExampleChatBlock({ customerLabel, turns }: ExampleChatBlockProps) {
  const locale = useLocale()

  if (!turns || turns.length === 0) return null

  const exampleLabel = EXAMPLE_LABEL[locale] ?? EXAMPLE_LABEL['en']

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-10 md:py-14 bg-bg-tertiary">
      <div className="mx-auto max-w-2xl">
        <p className="mb-4 text-center text-[12px] italic text-text-muted">{exampleLabel}</p>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="flex flex-col gap-3"
        >
          {turns.map((turn, i) => {
            const isAi = turn.speaker === 'ai'
            return (
              <motion.div
                key={i}
                variants={fadeInUp}
                className={`flex flex-col gap-1 ${isAi ? 'items-start' : 'items-end'}`}
              >
                <span className="text-[11px] font-semibold text-text-muted px-1">
                  {isAi ? AI_SPEAKER_LABEL : customerLabel}
                </span>
                <div
                  className={
                    isAi
                      ? 'max-w-[85%] rounded-2xl rounded-tl-sm bg-white border border-border-default px-4 py-2.5 text-[13.5px] leading-relaxed text-text-primary whitespace-pre-wrap'
                      : 'max-w-[85%] rounded-2xl rounded-tr-sm bg-brand-primary px-4 py-2.5 text-[13.5px] leading-relaxed text-on-primary whitespace-pre-wrap'
                  }
                >
                  {turn.message}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
