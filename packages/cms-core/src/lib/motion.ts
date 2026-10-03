"use client"

import { useReducedMotion, useTransform } from 'framer-motion'
import type { MotionValue, Variants } from 'framer-motion'

// ─── Static variant objects ───────────────────────────────────────────────────

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
}

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

export const cardHover: Variants = {
  rest: {
    scale: 1,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    transition: { duration: 0.2 },
  },
  hover: {
    scale: 1.02,
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    transition: { duration: 0.2, ease: "easeOut" },
  },
}

export const pageFade: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: "easeIn" } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

export const drawerVariants: Variants = {
  closed: { x: "100%", transition: { duration: 0.3, ease: [0.32, 0, 0.67, 0] } },
  open: { x: "0%", transition: { duration: 0.35, ease: [0.33, 1, 0.68, 1] } },
}

export const backdropVariants: Variants = {
  closed: { opacity: 0 },
  open: { opacity: 0.5, transition: { duration: 0.3 } },
}

export const accordionVariants = {
  open: {
    height: "auto",
    opacity: 1,
    transition: { duration: 0.28, ease: "easeInOut" },
  },
  closed: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.28, ease: "easeInOut" },
  },
}

// ─── Reduced-motion factory ───────────────────────────────────────────────────

type MotionVariantSet = {
  fadeInUp: Variants
  staggerContainer: Variants
  cardHover: Variants
  pageFade: Variants
  drawerVariants: Variants
  backdropVariants: Variants
  accordionVariants: Variants
}

export function makeVariants(reducedMotion: boolean): MotionVariantSet {
  if (!reducedMotion) {
    return {
      fadeInUp,
      staggerContainer,
      cardHover,
      pageFade,
      drawerVariants,
      backdropVariants,
      accordionVariants,
    }
  }

  return {
    fadeInUp: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.01 } },
    },
    staggerContainer: {
      hidden: {},
      visible: { transition: { staggerChildren: 0 } },
    },
    cardHover: {
      rest: { scale: 1, transition: { duration: 0.01 } },
      hover: { scale: 1, transition: { duration: 0.01 } },
    },
    pageFade: {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition: { duration: 0.01 } },
      exit: { opacity: 0, transition: { duration: 0.01 } },
    },
    drawerVariants: {
      closed: { x: "100%", transition: { duration: 0.01 } },
      open: { x: "0%", transition: { duration: 0.01 } },
    },
    backdropVariants: {
      closed: { opacity: 0 },
      open: { opacity: 0.5, transition: { duration: 0.01 } },
    },
    accordionVariants: {
      open: { height: "auto", opacity: 1, transition: { duration: 0.01 } },
      closed: { height: 0, opacity: 0, transition: { duration: 0.01 } },
    },
  }
}

// ─── Hook: returns motion-safe variants ──────────────────────────────────────

export function useAnimationVariants(): MotionVariantSet {
  const reduced = useReducedMotion() ?? false
  return makeVariants(reduced)
}

// ─── Hero parallax — max 30px, disabled when reduced motion is on ─────────────

export function useHeroParallax(scrollY: MotionValue<number>): MotionValue<number> | null {
  const reduced = useReducedMotion() ?? false
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const transform = useTransform(scrollY, [0, 400], [0, 30])
  return reduced ? null : transform
}
