'use client'

import { motion } from 'framer-motion'
import type { StatsBarBlockProps } from './types'

export function StatsBarBlock({
  items,
}: StatsBarBlockProps) {
  if (!items || items.length === 0) return null

  // Parent animation layout for sequential/staggered block loading
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }
    }
  }

  return (
    <section className="bg-neutral-50/50 py-16 md:py-20 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.ul 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
         
          className="flex flex-wrap justify-center gap-6"
        >
          {items.map((item, index) => (
            <motion.li
              key={index}
              variants={cardVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
             
              className="flex flex-col justify-center rounded-xl border border-neutral-100/70 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] min-h-[160px] w-full sm:w-[calc(50%-12px)] xl:w-[calc(25%-18px)] min-w-[250px]"
            >
              <div className="flex flex-col gap-2.5">
                {/* Clean, left-aligned typography matching image_7e2a15.png */}
                <h3 className="text-[16px] font-bold text-gray-900 tracking-tight leading-snug">
                  {item.label}
                </h3>
                <p className="text-[13.5px] leading-relaxed text-gray-400 font-normal">
                  {item.body}
                </p>
                
                {/* Optional value indicator safe-render */}
                {item.value && (
                  <span className="mt-1 text-xs font-semibold text-[var(--color-primary,rgba(15,164,87,1))]">
                    {item.value}
                  </span>
                )}
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}