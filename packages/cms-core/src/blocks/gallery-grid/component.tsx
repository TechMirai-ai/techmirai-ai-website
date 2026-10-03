'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import type { GalleryGridBlockProps, GalleryImageItem } from './types'
import { GalleryAlbumsBlock } from './GalleryAlbumsBlock'

// Dictionary for dynamic labels based on locale
const labels: Record<string, string> = {
  en: 'Our Journey',
  ja: '私たちの歩み',
  bn: 'আমাদের পথচলা',
}

// Cinematic slow pan and zoom fade transition configuration
const ultraSmoothVariants = {
  initial: { opacity: 0, scale: 1.05, filter: 'blur(4px)' },
  animate: { opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 1.2, ease: [0.25, 1, 0.5, 1] } },
  exit: { opacity: 0, scale: 0.98, filter: 'blur(2px)', transition: { duration: 1.0, ease: [0.25, 1, 0.5, 1] } }
}

export function GalleryGridBlock(props: GalleryGridBlockProps) {
  const { heading, showFilter = false, categories, items } = props
  
  const pathname = usePathname()
  const locale = useLocale()
  
  // Select the correct label or fallback to English
  const journeyLabel = labels[locale] || labels['en']
  
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState<number>(0)

  // Intercept route for Album design
  if (pathname && pathname.includes('/gallery')) {
    return <GalleryAlbumsBlock {...props} />
  }

  const filtered = activeCategory
    ? items.filter((item) => item.category === activeCategory)
    : items

  function handleCategoryChange(slug: string | null) {
    setActiveCategory(slug)
    setActiveIndex(0)
  }

  useEffect(() => {
    if (!filtered || filtered.length <= 1) return

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % filtered.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [filtered])

  if (!filtered || filtered.length === 0) return null

  const currentItem = filtered[activeIndex] as GalleryImageItem

  return (
    <section className="relative w-full overflow-hidden bg-white pt-10 pb-16 md:pt-20 md:pb-24 px-4 sm:px-6 lg:px-8">
      
      {/* Background Aura */}
      {/* <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-[5%] left-[5%] h-80 w-80 rounded-full bg-teal-300/25 opacity-70 mix-blend-multiply filter blur-[80px]" />
        <div className="absolute bottom-[10%] left-[20%] h-[500px] w-[500px] rounded-full bg-amber-200/35 opacity-60 mix-blend-multiply filter blur-[120px]" />
        <div className="absolute top-[2%] right-[8%] h-96 w-96 rounded-full bg-purple-200/25 opacity-50 filter blur-[100px]" />
        <div className="absolute bottom-[25%] right-[12%] h-72 w-72 rounded-full bg-yellow-200/35 opacity-40 filter blur-[80px]" />
      </div> */}

      <div className="relative z-10 mx-auto max-w-5xl">
        
        {/* Header Block */}
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 mb-2.5">
            <span className="h-px w-6 bg-sky-500 rounded" />
            <p className="text-xs font-bold uppercase tracking-widest text-sky-600">
              {journeyLabel}
            </p>
            <span className="h-px w-6 bg-sky-500 rounded" />
          </div>
          <h2 className="text-xl sm:text-2xl md:text-2xl font-extrabold tracking-tight text-gray-900 leading-tight">
            {heading ? heading : "A visual glimpse into our people, partnerships, and the experiences that define us."}
          </h2>
        </div>

        {/* Dynamic Category Selector */}
        {showFilter && categories && categories.length > 0 && (
          <div className="mb-8 flex flex-wrap justify-center gap-2" role="group">
            <button
              onClick={() => handleCategoryChange(null)}
              className={`relative rounded-full px-5 py-2 text-xs font-semibold tracking-wide uppercase transition-all duration-200 z-10 ${
                activeCategory === null ? 'text-white' : 'bg-white/40 backdrop-blur-sm text-gray-600 shadow-sm hover:bg-white/80'
              }`}
            >
              {activeCategory === null && (
                <motion.span 
                  layoutId="galleryFilterPill"
                  className="absolute inset-0 rounded-full bg-sky-600 -z-10"
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                />
              )}
              All Memories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => handleCategoryChange(cat.slug)}
                className={`relative rounded-full px-5 py-2 text-xs font-semibold tracking-wide uppercase transition-all duration-200 z-10 ${
                  activeCategory === cat.slug ? 'text-white' : 'bg-white/40 backdrop-blur-sm text-gray-600 shadow-sm hover:bg-white/80'
                }`}
              >
                {activeCategory === cat.slug && (
                  <motion.span 
                    layoutId="galleryFilterPill"
                    className="absolute inset-0 rounded-full bg-sky-600 -z-10"
                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  />
                )}
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Viewport Stage */}
        <Link 
          href="/gallery" 
          className="relative block group w-full max-w-5xl mx-auto aspect-[4/3] sm:aspect-[16/9] md:aspect-[21/11] overflow-hidden rounded-3xl cursor-pointer"
        >
          <AnimatePresence mode="popLayout">
            <motion.div
              key={activeIndex}
              variants={ultraSmoothVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute inset-0 h-full w-full will-change-[transform,opacity] overflow-hidden"
              style={{
                WebkitMaskImage: 'radial-gradient(circle, rgba(0,0,0,1) 78%, rgba(0,0,0,0) 100%)',
                maskImage: 'radial-gradient(circle, rgba(0,0,0,1) 78%, rgba(0,0,0,0) 100%)',
              }}
            >
              <Image
                src={currentItem.imageUrl}
                alt={currentItem.caption ?? 'Corporate Memory Presentation'}
                fill
                priority
                sizes="(max-width: 1200px) 100vw, 1400px"
                className="object-cover w-full h-full select-none transition-transform duration-700 group-hover:scale-102"
              />
            </motion.div>
          </AnimatePresence>

          <div className="absolute inset-x-4 bottom-6 sm:bottom-8 z-20 px-4 sm:px-8 flex items-center justify-between gap-6 pointer-events-none">
            <div className="max-w-[75%] select-none">
              <AnimatePresence mode="wait">
                {currentItem.caption && (
                  <motion.p
                    key={activeIndex}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.35 }}
                    className="text-xs sm:text-sm font-semibold tracking-wide text-gray-800 drop-shadow-[0_2px_8px_rgba(255,255,255,0.85)] leading-relaxed"
                  >
                    {currentItem.caption}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <div className="shrink-0 rounded-full bg-white/40 backdrop-blur-md px-3 py-1 text-[10px] font-bold tracking-widest text-gray-700 border border-white/40 shadow-sm select-none">
              {activeIndex + 1} / {filtered.length}
            </div>
          </div>

          <div className="absolute inset-0 z-30 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <button
              type="button"
              aria-label="Previous image"
              onClick={(e) => {
                e.preventDefault();
                setActiveIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
              }}
              className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/30 backdrop-blur-md text-gray-800 border border-white/40 shadow-sm transition-all hover:bg-white hover:scale-105 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={(e) => {
                e.preventDefault();
                setActiveIndex((prev) => (prev + 1) % filtered.length);
              }}
              className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/30 backdrop-blur-md text-gray-800 border border-white/40 shadow-sm transition-all hover:bg-white hover:scale-105 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </Link>
      </div>
    </section>
  )
}