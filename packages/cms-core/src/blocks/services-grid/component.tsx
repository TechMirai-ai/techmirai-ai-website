'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useLocale } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bone, 
  Activity, 
  UserCheck, 
  HeartPulse, 
  Stethoscope, 
  ShieldAlert, 
  ChevronDown,
  ArrowRight,
  Sparkles,
  HelpCircle
} from 'lucide-react'
import { fadeInUp, staggerContainer } from '../../lib/motion'
import type { ServicesGridBlockProps } from './types'

const iconMap = {
  Bone,
  Activity,
  UserCheck,
  HeartPulse,
  Stethoscope,
  ShieldAlert,
  Sparkles,
  HelpCircle
} as const

const fallbackIcons = [Bone, Activity, UserCheck, HeartPulse, Stethoscope, ShieldAlert, Sparkles, HelpCircle]

// Extended static symptom data with your detailed descriptions
const detailedSymptomsEn = [
  {
    id: '01',
    title: 'Lower Back Pain',
    shortDesc: 'Pain, stiffness, or discomfort around the lower back.',
    details: 'Whether caused by long sitting hours, heavy lifting, or poor posture, lower back pain can restrict daily movement. We provide targeted spinal alignment and muscle relief.',
    iconName: 'Bone'
  },
  {
    id: '02',
    title: 'Shoulder Stiffness',
    shortDesc: 'Tension and stiffness that make your neck and shoulders feel heavy.',
    details: 'Chronic shoulder tightness often stems from desktop work and stress. Our therapy targets deep tissue tension to restore full range of motion.',
    iconName: 'Activity'
  },
  {
    id: '03',
    title: 'Neck Pain',
    shortDesc: 'Neck discomfort that affects your daily movement or comfort.',
    details: 'Tech-neck and strain can lead to headaches and persistent upper body pain. We gently re-align the cervical spine and relieve nerve pressure.',
    iconName: 'UserCheck'
  },
  {
    id: '04',
    title: 'Knee Pain',
    shortDesc: 'Pain or discomfort when walking, standing, or moving your knees.',
    details: 'Knee discomfort can stem from cartilage wear, joint misalignment, or muscle imbalances. We focus on joint stabilization and pain reduction.',
    iconName: 'HeartPulse'
  },
  {
    id: '05',
    title: 'Joint & Muscle Pain',
    shortDesc: 'Discomfort, soreness, or restricted movement in your joints and muscles.',
    details: 'General body soreness can affect overall quality of life. We offer comprehensive soft tissue manipulation and joint mobilization.',
    iconName: 'Stethoscope'
  },
  {
    id: '06',
    title: 'Sports Injuries',
    shortDesc: 'Support for strains, sprains, and other sports-related injuries.',
    details: 'From acute sprains to repetitive overuse injuries, our rehabilitation programs get you back to active sports safely and swiftly.',
    iconName: 'ShieldAlert'
  },
  {
    id: '07',
    title: 'Accident-Related Pain',
    shortDesc: 'Care and support for pain or discomfort following an accident.',
    details: 'Whiplash and sudden trauma require gentle, specialized care. We help manage acute inflammation and prevent long-term chronic pain.',
    iconName: 'Sparkles'
  },
  {
    id: '08',
    title: 'Other Physical Concerns',
    shortDesc: 'Any other pain, stiffness, or movement concerns affecting your everyday life.',
    details: 'Unsure of what is causing your discomfort? We offer personalized consultations to identify root causes and create tailored recovery plans.',
    iconName: 'HelpCircle'
  },
]

// title/shortDesc from Jamal's homepage content doc; details are an
// approximate translation, pending final content review (no JA source exists)
const detailedSymptomsJa = [
  {
    id: '01',
    title: '腰痛',
    shortDesc: '日常生活に影響を及ぼす、腰の痛み・張り・違和感。',
    details: '長時間の座り仕事や重い物の持ち上げ、姿勢の悪さなどが原因で、腰の痛みは日常の動きを制限します。的確な骨盤・脊柱の調整と筋肉のケアを行います。', // approximate translation, pending final content review
    iconName: 'Bone'
  },
  {
    id: '02',
    title: '肩こり',
    shortDesc: '肩や上背部の張り・重だるさ・違和感。',
    details: '慢性的な肩の張りは、デスクワークやストレスが原因となることが多いです。深部の筋肉の緊張にアプローチし、可動域を取り戻します。', // approximate translation, pending final content review
    iconName: 'Activity'
  },
  {
    id: '03',
    title: '首の痛み',
    shortDesc: '日常の動作を不快にする首の痛みや凝り。',
    details: 'スマートフォンやパソコンの使用による負担は、頭痛や上半身の痛みにつながることがあります。頸椎を優しく調整し、神経への圧迫を和らげます。', // approximate translation, pending final content review
    iconName: 'UserCheck'
  },
  {
    id: '04',
    title: '膝の痛み',
    shortDesc: '歩く・立つ・曲げる・階段の上り下りで感じる痛みや違和感。',
    details: '膝の不調は、軟骨のすり減りや関節のズレ、筋肉のアンバランスから起こることがあります。関節の安定化と痛みの軽減に重点を置いて施術します。', // approximate translation, pending final content review
    iconName: 'HeartPulse'
  },
  {
    id: '05',
    title: '関節・筋肉の痛み',
    shortDesc: '関節や筋肉の痛み・だるさ・動きにくさ。',
    details: '全身のだるさや痛みは生活の質に影響します。軟部組織へのアプローチと関節の調整を組み合わせた施術を行います。', // approximate translation, pending final content review
    iconName: 'Stethoscope'
  },
  {
    id: '06',
    title: 'スポーツ外傷',
    shortDesc: '筋挫傷・捻挫など、スポーツに伴うケガのケアと回復サポート。',
    details: '急な捻挫から使いすぎによる慢性的な怪我まで、安全かつ迅速にスポーツへ復帰できるようリハビリプログラムを提供します。', // approximate translation, pending final content review
    iconName: 'ShieldAlert'
  },
  {
    id: '07',
    title: '交通事故などの痛み',
    shortDesc: '交通事故やその他のケガによる痛み・違和感のサポート。',
    details: 'むち打ちや突然の外傷には、丁寧で専門的なケアが必要です。急性の炎症を管理し、慢性化を防ぐお手伝いをします。', // approximate translation, pending final content review
    iconName: 'Sparkles'
  },
  {
    id: '08',
    title: 'その他の体の不調',
    shortDesc: '「何かおかしい」と感じたら、まずはお話を聞かせてください。適切なケアにつなげます。',
    details: '何が原因かわからない不調でも、丁寧なカウンセリングで根本原因を見極め、あなたに合った回復プランをご提案します。', // approximate translation, pending final content review
    iconName: 'HelpCircle'
  },
]

export function ServicesGridBlock({
  eyebrow = 'FEATURE',
  heading = 'In addition to gastroenterology and surgery, specialization in abdominal conditions...',
  services = [
    { title: "Osteopathic Treatment", iconName: "Bone" },
    { title: "Sports Injuries", iconName: "Activity" },
    { title: "Posture & Movement", iconName: "UserCheck" },
    { title: "Rehabilitation", iconName: "HeartPulse" },
    { title: "Pain Relief", iconName: "Stethoscope" },
    { title: "Accident Care", iconName: "ShieldAlert" },
  ],
}: ServicesGridBlockProps) {
  const locale = useLocale()
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const detailedSymptoms = locale === 'ja' ? detailedSymptomsJa : detailedSymptomsEn

  if (!services || services.length === 0) return null

  return (
    <section className="relative w-full z-20 pb-16 md:pb-24 pl-4 sm:pl-6 lg:pl-8 overflow-x-clip bg-gradient-to-b from-[#eaf2ef] to-brand-surface">
      <div className="mx-auto max-w-7xl">
        
 {/* 1. OUTER ANGLED CONTAINER (PINK CARD) WITH SCROLL FADE-UP */}
<motion.div
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-80px" }}
  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
  className="relative w-full bg-[#F5E1DD] p-[6px] sm:p-[10px] md:p-[14px] -mt-12 md:-mt-20 shadow-sm [clip-path:polygon(0%_4%,50%_0%,100%_4%,100%_100%,0%_100%)] sm:[clip-path:polygon(0%_12%,50%_0%,100%_12%,100%_100%,0%_100%)]"
>
  <div
    className="w-full bg-[#FAF0EE] pt-8 sm:pt-18 md:pt-24 pb-48 sm:pb-56 md:pb-64 px-4 sm:px-8 md:px-12 [clip-path:polygon(0%_4%,50%_0%,100%_4%,100%_100%,0%_100%)] sm:[clip-path:polygon(0%_12%,50%_0%,100%_12%,100%_100%,0%_100%)]"
  >
    {/* Header Animated Reveal */}
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="mb-8 sm:mb-10 text-center max-w-2xl mx-auto space-y-2 sm:space-y-3 pt-4 sm:pt-2"
    >
      <div className="text-[#d0915a] text-xs mb-1">✦</div>
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-brand-primary leading-tight">
        {locale === 'ja' ? '症状・お悩み' : 'Symptoms & Concerns'}
      </h2>
      <p className="text-sm md:text-base font-medium text-slate-700">
        {locale === 'ja'
          ? '体が「ケアが必要」とサインを出しているかもしれません。'
          : "Your body may be telling you it's time for some care."}
      </p>
      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl mx-auto">
        {locale === 'ja'
          ? '日常的な痛みや凝りからスポーツ外傷まで、さくら整骨院は自信を持って動ける毎日をサポートします。'
          : 'From everyday aches and stiffness to sports injuries, Sakura Osteopathic Clinic is here to help you move with confidence.'}
      </p>
    </motion.div>

    {/* SYMPTOMS: Staggered Stagger Grid Reveal */}
    <motion.div 
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4"
    >
      {detailedSymptoms.map((item, idx) => {
        const IconComp = iconMap[item.iconName as keyof typeof iconMap] || Bone
        const isOpen = openIndex === idx

        return (
          <motion.div 
            key={item.id}
            variants={fadeInUp}
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
            className="bg-white/90 backdrop-blur-xs border border-[#eedad5] rounded-2xl p-4 sm:p-5 transition-colors shadow-xs hover:border-[#D98A72]"
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              className="w-full flex items-start gap-3.5 text-left focus:outline-none cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-[#F5E1DD]/60 flex items-center justify-center shrink-0 text-[#2B7A78] mt-0.5">
                <IconComp className="w-5 h-5 stroke-[1.75]" />
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#D98A72] tracking-wider">
                    {item.id}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-800">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                  {item.shortDesc}
                </p>
              </div>
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 mt-3 border-t border-slate-100 pl-13 text-xs text-slate-600 leading-relaxed">
                    {item.details}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </motion.div>

    {/* BOTTOM CTA: Smooth Pop-In */}
    <motion.div 
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="mt-8 sm:mt-10 max-w-2xl mx-auto text-center backdrop-blur-xs p-6 sm:p-8 space-y-3"
    >
      {/* CTA copy has no JA source doc; JA text below is an approximate translation, pending final content review */}
      <h3 className="text-base sm:text-lg font-bold text-slate-800">
        {locale === 'ja' ? 'どのようなケアが必要かわからない方へ' : 'Not sure what kind of care you need?'}
      </h3>
      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
        {locale === 'ja'
          ? 'お話を伺いながら、最適な方法を一緒に見つけます。'
          : "We're here to listen and help you find the right approach."}
      </p>
      <div className="pt-2">
        <Link
          href={`/${locale}/contact`}
          className="inline-flex items-center justify-center gap-2.5 bg-brand-primary hover:bg-white border border-brand-primary text-white hover:text-brand-primary text-xs sm:text-sm px-6 py-3 rounded-xl transition-colors shadow-sm group"
        >
          <span>{locale === 'ja' ? 'お問い合わせ' : 'Talk to Us'}</span>
          <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </motion.div>

  </div>
</motion.div>

  {/* 2. OVERLAPPING WHITE CARD */}
        <motion.div
          initial={{ opacity: 0, x: 80 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          className="
            relative 
            -mt-28 sm:-mt-36 md:-mt-44 
            z-20 
            bg-white 
            rounded-l-[28px] sm:rounded-l-[36px] 
            rounded-r-none 
            p-6 sm:p-10 md:p-14 
            shadow-lg 
            border-y border-l border-[#ede7db]
            ml-4 sm:ml-6 md:ml-8 lg:ml-10
            [margin-right:calc(-50vw+50%)] 
            pr-8 sm:pr-12 lg:pr-16
          "
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* LEFT SIDE: Heading & Description */}
            <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left space-y-5">
              {/* Centered Logo on Mobile, Left-aligned on Desktop */}
              <div className="w-full flex justify-center lg:justify-start">
                <div className="w-12 h-12 sm:w-14 sm:h-14 relative">
                  <Image
                    src="/brand/logo3.png"
                    alt="Clinic Logo"
                    width={56}
                    height={56}
                    className="object-contain"
                  />
                </div>
              </div>
              {eyebrow && (
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-brand-primary leading-tight">
                  {eyebrow}
                </h2>
              )}

              <p className="text-xs sm:text-base text-gray-600 font-normal leading-relaxed">
                {heading}
              </p>

              {/* View Details Button (Desktop View) */}
              <div className="hidden lg:block pt-2">
                <Link
                  href={`/${locale}/treatment-details`}
                  className="inline-flex items-center justify-center gap-3 bg-brand-primary hover:bg-white border border-brand-primary text-white hover:text-brand-primary text-xs sm:text-sm px-8 py-3.5 rounded-xl transition-colors shadow-sm group"
                >
                  <span>{locale === 'ja' ? '詳細を見る' : 'View Details'}</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* RIGHT SIDE: 6 Cards + Mobile View Details Button */}
            <div className="lg:col-span-7 w-full flex flex-col items-center">
              <motion.div 
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                className="w-full flex flex-col sm:grid sm:grid-cols-3 gap-3 sm:gap-5"
              >
                {services.slice(0, 6).map((service, i) => {
                  const iconKey = (service.iconName || service.icon) as keyof typeof iconMap
                  const IconComponent = iconMap[iconKey] || fallbackIcons[i % fallbackIcons.length] || Activity
                  const targetHref = service.cta?.href ? `/${locale}${service.cta.href}` : `/${locale}/services`

                  return (
                    <motion.div key={service.title || i} variants={fadeInUp}>
                      <Link
                        href={targetHref}
                        className="group flex flex-row sm:flex-col items-center justify-between bg-[#EBF5F0] hover:bg-[#DFEFE8] transition-all duration-200 rounded-2xl p-3.5 sm:p-5 h-auto sm:h-full sm:min-h-[190px] text-left sm:text-center"
                      >
                        {/* Icon Badge */}
                        <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-full bg-white shadow-xs flex items-center justify-center p-2.5 sm:p-3.5 shrink-0 sm:my-auto transition-transform duration-200 group-hover:scale-105">
                          <IconComponent className="w-6 h-6 sm:w-10 sm:h-10 text-[#2B7A78] stroke-[1.75]" />
                        </div>

                        {/* Title & Arrow Container */}
                        <div className="w-full pl-3 sm:pl-0 sm:pt-3 sm:border-t border-[#CBE2D7] flex items-center justify-between gap-2 sm:mt-auto">
                          <span className="text-sm font-semibold text-[#1F5150] truncate">
                            {service.title}
                          </span>
                          <ArrowRight className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-[#2B7A78] shrink-0 transform group-hover:translate-x-1 sm:group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </Link>
                    </motion.div>
                  )
                })}
              </motion.div>

              {/* View Details Button (Mobile/Tablet View Below Cards) */}
              <div className="block lg:hidden pt-6 sm:pt-8 w-full text-center">
                <Link
                  href={`/${locale}/treatment-details`}
                  className="inline-flex items-center justify-center gap-3 bg-brand-primary hover:bg-white border border-brand-primary text-white hover:text-brand-primary text-xs sm:text-sm px-8 py-3.5 rounded-xl transition-colors shadow-sm group"
                >
                  <span>View details</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </section>
  )
}