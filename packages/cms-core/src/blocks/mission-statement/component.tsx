'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { useLocale } from 'next-intl' // 1. Import useLocale
import { staggerContainer, fadeInUp } from '../../lib/motion'
import type { MissionStatementBlockProps, MissionPhotoSize } from './types'

const sizeMap: Record<MissionPhotoSize, string> = {
  small: 'h-[90px] md:h-[110px] lg:h-[130px] w-[130px] md:w-[160px] lg:w-[190px]',
  medium: 'h-[130px] md:h-[150px] lg:h-[180px] w-[180px] md:w-[210px] lg:w-[250px]',
  large: 'h-[170px] md:h-[200px] lg:h-[220px] w-[240px] md:w-[280px] lg:w-[310px]',
}

// Falling Sakura using your PNG
function SakuraPetal({ 
  style, 
  delay, 
  size 
}: { 
  style: React.CSSProperties
  delay: number
  size: number 
}) {
  return (
    <div
      className="absolute pointer-events-none select-none"
      style={{
        ...style,
        width: size,
        height: size,
        animation: `sakura-fall ${16 + Math.random() * 12}s linear infinite`,
        animationDelay: `${delay}s`,
      }}
    >
      <Image
        src="/brand/logo3.png"
        alt=""
        width={size}
        height={size}
        className="w-full h-full object-contain opacity-80"
        draggable={false}
      />
    </div>
  )
}

export function MissionStatementBlock({
  missionHeading,
  missionBody,
  photos,
}: MissionStatementBlockProps) {
  // 2. Access the current locale ('ja', 'en', 'bn', etc.)
  const locale = useLocale()

  // Fewer + bigger flowers, slow fall
  const petals = Array.from({ length: 7 }).map((_, i) => ({
    id: i,
    left: `${6 + Math.random() * 88}%`,
    delay: Math.random() * 20,
    size: 36 + Math.random() * 28,
    opacity: 0.65 + Math.random() * 0.25,
  }))
  
  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-brand-surface via-brand-surface to-[#eaf2ef] pt-1 pb-16 px-4 sm:px-8 md:pt-2 md:pb-24 md:px-16 lg:px-24">
      
      {/* Falling Sakura Flowers */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {petals.map((petal) => (
          <SakuraPetal
            key={petal.id}
            delay={petal.delay}
            size={petal.size}
            style={{
              left: petal.left,
              top: `-${60 + Math.random() * 80}px`,
              opacity: petal.opacity,
            }}
          />
        ))}
      </div>

      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="relative z-10 max-w-6xl mx-auto flex flex-col items-center text-center"
      >
        {/* Top Logo */}
        <motion.div variants={fadeInUp} className="mb-2">
          <Image
            src="/brand/logo2.png"
            alt="Brand icon"
            width={240}
            height={240}
            className="w-20 h-20 md:w-50 md:h-50 object-contain mx-auto"
            quality={100}
          />
        </motion.div>

        {/* Sub-label */}
        <motion.div variants={fadeInUp} className="flex items-center gap-2 mb-8">
          <span className="text-brand-primary text-xs font-semibold">|</span>
          <span className="text-[11px] md:text-xs font-bold uppercase tracking-widest text-brand-primary">
            {/* 3. Inline locale check matching the pattern in HeroBlock */}
            {locale === 'ja' ? '当院について' : 'ABOUT US'}
          </span>
          <span className="text-brand-primary text-xs font-semibold">|</span>
        </motion.div>

        {/* Heading */}
        <motion.div variants={fadeInUp} className="mb-8 max-w-5xl px-2">
          <h2 className="text-xl md:text-2xl lg:text-2xl text-brand-primary tracking-tight leading-relaxed">
            {missionHeading}
          </h2>
        </motion.div>

        {/* Body */}
        <motion.div variants={fadeInUp} className="mb-14 max-w-4xl px-2">
          <p className="text-sm md:text-base text-gray-700 font-normal leading-loose whitespace-pre-line">
            {missionBody}
          </p>
        </motion.div>

        {/* Photos */}
        {photos && photos.length > 0 && (
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative mt-4 w-full flex flex-col md:flex-row md:flex-wrap items-center justify-center gap-6"
          >
            {photos.map((photo, i) => {
              const mobileMargins = [
                "mr-auto ml-4",
                "ml-auto mr-4 -mt-16",
                "mr-auto ml-10 -mt-10",
                "ml-auto mr-6 -mt-12"
              ];

              return (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  whileHover={{ scale: 1.04, y: -6 }}
                  transition={{ type: "spring", stiffness: 260, damping: 25 }}
                  className={`
                    relative rounded-[24px] overflow-hidden shadow-sm bg-slate-50 z-10
                    ${sizeMap[photo.size]}
                    md:mt-0 md:ml-0 md:mr-0
                    ${mobileMargins[i] || ""}
                  `}
                >
                  <Image
                    src={photo.imageUrl}
                    alt={photo.alt || 'Gallery Presentation Image'}
                    fill
                    className="object-cover pointer-events-none"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </motion.div>

      <style jsx>{`
        @keyframes sakura-fall {
          0% {
            transform: translateY(0) rotate(0deg) translateX(0);
            opacity: 0;
          }
          6% {
            opacity: 1;
          }
          94% {
            opacity: 0.7;
          }
          100% {
            transform: translateY(115vh) rotate(420deg) translateX(30px);
            opacity: 0;
          }
        }
      `}</style>
    </section>
  )
}