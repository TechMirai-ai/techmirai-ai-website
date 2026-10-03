'use client'

import { motion } from 'framer-motion'
import { SectionEyebrow } from '../../components/ui'
import { staggerContainer, fadeInUp } from '../../lib/motion'
import type { BentoGridBlockProps, BentoGridItem, BentoLayout } from './types'

interface BentoCardProps {
  item: BentoGridItem
  index: number
  layout: BentoLayout
}

function BentoCard({ item, index, layout }: BentoCardProps) {
  const isFeatured = layout === 'asymmetric' && index === 0

  return (
    <motion.article
      variants={fadeInUp}
      className={[
        'relative text-left transition-all duration-300 py-1 flex flex-col',
        // CHANGED: Every card gets a left border and left padding on mobile.
        // On desktop (md:), non-featured cards lose the border and padding, while the featured card centers itself vertically.
        isFeatured 
          ? 'border-l-[3px] border-brand-primary pl-6 h-full justify-center' 
          : 'border-l-[3px] border-brand-primary pl-6 justify-start md:border-l-0 md:pl-0'
      ].join(' ')}
    >
      {/* ── Scaled Down High-Visibility Accent Numeral ── */}
      <span
        className="block text-[40px] font-bold tracking-tight text-brand-primary/25 leading-none mb-1 font-sans select-none"
        aria-hidden="true"
      >
        {item.number}
      </span>

      {/* ── Clean Header ── */}
      <h3 className="text-[16px] font-bold tracking-tight text-text-primary md:text-[18px]">
        {item.title}
      </h3>

      {/* ── High-Legibility Description Block ── */}
      {item.description && (
        <p className="mt-1.5 text-[13px] md:text-[14px] leading-relaxed text-text-muted font-normal tracking-wide max-w-xl">
          {item.description}
        </p>
      )}
    </motion.article>
  )
}

export function BentoGridBlock({
  eyebrow,
  heading,
  intro,
  items,
  layout = 'asymmetric',
  bgVariant = 'tertiary', 
}: BentoGridBlockProps & { bgVariant?: 'primary' | 'secondary' | 'white' | 'tertiary' }) {
  if (!items || items.length === 0) return null

  const bgStyleMap = {
    primary: 'bg-bg-primary',
    secondary: 'bg-bg-secondary',
    white: 'bg-white',
    tertiary:  'bg-bg-tertiary',
  }

  const featuredItem = items[0]
  const restItems = layout === 'asymmetric' ? items.slice(1) : items

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-4 overflow-hidden bg-white">
      <div 
        className={[
          'w-full pt-10 pb-12 md:pt-12 md:pb-16 rounded-2xl md:rounded-3xl lg:rounded-[32px] overflow-hidden',
          bgStyleMap[bgVariant]
        ].join(' ')}
      >
        <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-16">

          {/* ── Centered Strategic Minimalist Header Section ── */}
          <div className="mx-auto mb-8 md:mb-10 max-w-3xl text-center">
             {eyebrow && <SectionEyebrow>{eyebrow}</SectionEyebrow>}
            <h2 className="text-2xl md:text-[32px] font-bold tracking-tight text-text-primary leading-[1.2]">
              {heading}
            </h2>
            {intro && (
              <p className="mx-auto mt-2 max-w-2xl text-[13.5px] md:text-[15px] leading-relaxed text-text-muted font-normal">
                {intro}
              </p>
            )}
          </div>

          {/* ── Structural Distribution Grid ── */}
          {layout === 'asymmetric' && featuredItem ? (
            /* CHANGED: Adjusted vertical spacing on mobile (gap-10) so reason cards with left borders have breathing room */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
              
              {/* Left Column: Featured Card taking 5 out of 12 columns */}
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-100px' }}
                className="lg:col-span-5 flex flex-col justify-center"
              >
                <BentoCard item={featuredItem} index={0} layout={layout} />
              </motion.div>

              {/* Right Column: Remaining 4 Items in a matrix taking 7 out of 12 columns */}
              {restItems.length > 0 && (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-100px' }}
                  // CHANGED: gap-y-10 on mobile ensures clear separation between reasons when stacked
                  className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-10 md:gap-y-6"
                >
                  {restItems.map((item, i) => (
                    <BentoCard
                      key={item.number || i + 1}
                      item={item}
                      index={i + 1}
                      layout={layout}
                    />
                  ))}
                </motion.div>
              )}

            </div>
          ) : (
            /* Uniform standard grid layout fallback block */
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10 md:gap-y-8"
            >
              {items.map((item, i) => (
                <BentoCard key={item.number || i} item={item} index={i} layout={layout} />
              ))}
            </motion.div>
          )}
          
        </div>
      </div>
    </section>
  )
}