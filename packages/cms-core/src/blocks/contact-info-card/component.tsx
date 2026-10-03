'use client'
// Client boundary: scroll-triggered fade-up animation

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Phone, Printer, Mail, Clock, Link as LinkIcon } from 'lucide-react'
import { fadeInUp } from '../../lib/motion'
import type { ContactInfoCardBlockProps } from './types'


function Row({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="flex-1">{children}</div>
    </div>
  )
}

export function ContactInfoCardBlock({
  heading,
  subheading,
  address,
  tel,
  fax,
  phone,
  email,
  officeHours,
  links,
  note,
}: ContactInfoCardBlockProps) {
 const hasContent =
    heading || subheading || address || tel || fax || phone || email || officeHours ||
    (links && links.length > 0) || note
  if (!hasContent) return null

  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="rounded-2xl border border-(--color-neutral-200) bg-white p-8 shadow-md md:p-10"
        >
          {heading && (
            <h2 className="mb-1 text-2xl font-bold text-(--color-primary) md:text-3xl">
              {heading}
            </h2>
          )}
          {subheading && (
            <p className="mb-6 text-base text-(--color-muted)">{subheading}</p>
          )}

          <dl className="mt-4 space-y-5">
            {address && (
              <Row
                icon={
                  <MapPin
                    className="h-5 w-5 text-(--color-primary)"
                    aria-hidden="true"
                  />
                }
              >
                <span className="whitespace-pre-line text-sm leading-relaxed text-(--color-text)">
                  {address}
                </span>
              </Row>
            )}
            {tel && (
              <Row
                icon={
                  <Phone
                    className="h-5 w-5 text-(--color-primary)"
                    aria-hidden="true"
                  />
                }
              >
                <span className="text-sm text-(--color-text)">{tel}</span>
              </Row>
            )}
            {phone && (
              <Row
                icon={
                  <Phone
                    className="h-5 w-5 text-(--color-primary)"
                    aria-hidden="true"
                  />
                }
              >
                <span className="text-sm text-(--color-text)">{phone}</span>
              </Row>
            )}
            {fax && (
              <Row
                icon={
                  <Printer
                    className="h-5 w-5 text-(--color-primary)"
                    aria-hidden="true"
                  />
                }
              >
                <span className="text-sm text-(--color-text)">{fax}</span>
              </Row>
            )}
            {email && (
              <Row
                icon={
                  <Mail
                    className="h-5 w-5 text-(--color-primary)"
                    aria-hidden="true"
                  />
                }
              >
                <a
                  href={`mailto:${email}`}
                  className="text-sm font-medium text-(--color-primary) hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-primary)"
                >
                  {email}
                </a>
              </Row>
            )}
            {officeHours && (
              <Row
                icon={
                  <Clock
                    className="h-5 w-5 text-(--color-primary)"
                    aria-hidden="true"
                  />
                }
              >
                <span className="whitespace-pre-line text-sm leading-relaxed text-(--color-text)">
                  {officeHours}
                </span>
              </Row>
            )}
            {links && links.length > 0 && (
              <Row
                icon={
                  <LinkIcon
                    className="h-5 w-5 text-(--color-primary)"
                    aria-hidden="true"
                  />
                }
              >
                <ul className="space-y-1.5">
                  {links.map((link, idx) => (
                    <li key={idx}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-(--color-primary) hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-primary)"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </Row>
            )}
            
          </dl>
          {note && (
            <p className="mt-6 rounded-lg bg-(--color-neutral-100) p-4 text-sm leading-relaxed text-(--color-muted) whitespace-pre-line">
              {note.split(/(Chatbot)/gi).map((part, i) =>
                part.toLowerCase() === 'chatbot' ? (
                  <motion.span
                    key={i}
                    className="inline-flex items-center font-extrabold text-(--color-primary) px-1 select-none"
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 5, -5, 0],
                      y: [0, -2, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    style={{ fontSize: '1.2em' }}
                  >
                    {part.split('').map((char, index) => (
                      <span
                        key={index}
                        className="font-serif italic text-(--color-primary)"
                        style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.1)' }}
                      >
                        {char}
                      </span>
                    ))}
                  </motion.span>
                ) : (
                  part
                )
              )}
            </p>
          )}
        </motion.div>
      </div>
    </section>
  )
}