'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface FAQItem {
  id?: string
  question: string
  answer: string
}

export interface FAQBlockProps {
  sectionHeading?: string
  items?: FAQItem[]
  variant?: 'accordion' | 'grid'
}

export function FAQBlock({ 
  sectionHeading, 
  items = [], 
  variant = 'accordion' 
}: FAQBlockProps) {
  // Track open state for individual accordions
  const [openId, setOpenId] = useState<string | number | null>(null)

  if (!items || items.length === 0) return null

  const toggleAccordion = (id: string | number) => {
    setOpenId(openId === id ? null : id)
  }

  return (
    <section className="bg-white py-16 md:py-24 overflow-hidden">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        {sectionHeading && (
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl">
              {sectionHeading}
            </h2>
          </div>
        )}

        {/* 🛠️ VARIANT 1: ACCORDION LAYOUT */}
        {variant === 'accordion' && (
          <div className="space-y-4 border-t border-[var(--color-border-default)] pt-4">
            {items.map((item, idx) => {
              const itemId = item.id ?? idx
              const isOpen = openId === itemId

              return (
                <div
                  key={itemId}
                  className="border-b border-[var(--color-border-default)] pb-4"
                >
                  <button
                    type="button"
                    onClick={() => toggleAccordion(itemId)}
                    className="flex w-full items-start justify-between text-left py-3 min-h-[48px] group rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
                    aria-expanded={isOpen}
                  >
                    <span className="text-base md:text-lg font-semibold text-[var(--color-text)] group-hover:opacity-80 transition-opacity duration-150">
                      {item.question}
                    </span>
                    <span className="ml-6 flex h-7 items-center text-[var(--color-muted)] group-hover:text-[var(--color-accent)]">
                      <svg
                        className={`h-5 w-5 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <p className="pr-12 pb-2 text-sm md:text-base text-[var(--color-muted)] font-normal leading-relaxed whitespace-pre-wrap">
                          {item.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        )}

        {/* 🛠️ VARIANT 2: GRID LAYOUT */}
        {variant === 'grid' && (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12 pt-4">
            {items.map((item, idx) => (
              <div
                key={item.id ?? idx}
                className="flex flex-col gap-2.5 p-5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface)]"
              >
                <h3 className="text-base md:text-lg font-semibold text-[var(--color-text)] tracking-tight">
                  {item.question}
                </h3>
                <p className="text-sm md:text-base text-[var(--color-muted)] font-normal leading-relaxed whitespace-pre-wrap">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  )
}