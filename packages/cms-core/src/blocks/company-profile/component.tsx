'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { SectionEyebrow } from '../../components/ui'
import { staggerContainer, fadeInUp } from '../../lib/motion'
import type { CompanyProfileBlockProps } from './types'

// 1. Define localized labels for the table rows
const labels: Record<string, Record<string, string>> = {
  en: {
    companyName: 'Company Name',
    founded: 'Founded',
    ceo: 'CEO',
    address: 'Address',
    capital: 'Capital',
    licenseNumber: 'License',
    headcount: 'Headcount',
    businessDescription: 'Business',
  },
  ja: {
    companyName: '会社名',
    founded: '設立',
    ceo: '代表取締役',
    address: '所在地',
    capital: '資本金',
    licenseNumber: '許認可',
    headcount: '従業員数',
    businessDescription: '事業内容',
  },
  bn: {
    companyName: 'কোম্পানির নাম',
    founded: 'প্রতিষ্ঠিত',
    ceo: 'সিইও',
    address: 'ঠিকানা',
    capital: 'মূলধন',
    licenseNumber: 'লাইসেন্স',
    headcount: 'জনবল',
    businessDescription: 'ব্যবসা',
  },
}

export function CompanyProfileBlock({
  eyebrow,
  heading,
  rows,
  photoUrl,
  photoAlt,
  photoFallbackText = 'Company office',
  yearsBadge,
  viewFullPageCta,
}: CompanyProfileBlockProps) {
  
  // 2. Access the current locale and corresponding labels
 const locale = useLocale();
const t = (labels[locale] || labels['en']) as Record<string, string>;

  if (!rows || rows.length === 0) return null

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Header */}
          <div className="mb-12">
            {eyebrow && <SectionEyebrow>{eyebrow}</SectionEyebrow>}
            {heading && (
              <h2 className="mt-3 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
                {heading}
              </h2>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* Left Column - Information */}
            <motion.div variants={fadeInUp} className="lg:col-span-7">
              <div className="border border-gray-100 rounded-2xl overflow-hidden">
                <dl className="divide-y divide-gray-100">
                  {rows.map((row, index) => {
                    // 3. Map the row.key to the localized label. 
                    // Assumes your rows have a 'key' property matching the dictionary.
                    const displayLabel = row.key ? (t[row.key] || row.label) : row.label

                    return (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2 px-8 py-6 hover:bg-gray-50 transition-colors">
                        <dt className="w-full sm:w-52 font-semibold text-gray-900 text-base">
                          {displayLabel}
                        </dt>
                        <dd className="flex-1 text-gray-700 text-[15.5px] leading-relaxed">
                          {row.value}
                        </dd>
                      </div>
                    )
                  })}
                </dl>
              </div>

              {/* CTA Button */}
              {viewFullPageCta && (
                <motion.div variants={fadeInUp} className="mt-10">
                  <Link href={viewFullPageCta.href} className="inline-flex items-center gap-3 rounded-xl bg-gray-900 px-8 py-4 text-base font-semibold text-white hover:bg-black transition-all duration-200 shadow-md hover:shadow-lg">
                    {viewFullPageCta.label}
                    <span aria-hidden="true" className="text-xl">→</span>
                  </Link>
                </motion.div>
              )}
            </motion.div>

            {/* Right Column - Image + Badge (Using yearsBadge from payload) */}
            <motion.div variants={fadeInUp} className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-xl border border-gray-100 aspect-[4/3]">
                <Image
                  src={photoUrl || '/images/company-placeholder.jpg'}
                  alt={photoAlt || photoFallbackText}
                  width={640}
                  height={480}
                  className="w-full h-full object-cover"
                />
              </div>

              {yearsBadge && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="absolute -bottom-6 -right-4 bg-gradient-to-br from-amber-500 to-orange-600 text-white px-7 py-5 rounded-2xl shadow-2xl flex flex-col items-center min-w-[160px]"
                >
                  <p className="text-4xl font-black tracking-tighter leading-none mt-1">
                    {yearsBadge.years}+
                  </p>
                  <p className="text-sm font-medium">{yearsBadge.label || 'Years'}</p>
                </motion.div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}