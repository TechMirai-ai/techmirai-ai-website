'use client'

import type { ButtonHTMLAttributes } from 'react'

type BookingButtonVariant = 'primary' | 'outline'

interface BookingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BookingButtonVariant
  isLoading?: boolean
}

const VARIANT_CLASSES: Record<BookingButtonVariant, string> = {
  primary: 'bg-[var(--booking-accent)] text-white hover:opacity-90',
  outline: 'border border-[var(--booking-accent)] text-[var(--booking-accent)] hover:bg-[var(--booking-accent)]/10',
}

/**
 * Same isLoading/aria-busy contract as components/ui/Button.tsx, but styled
 * with --booking-* tokens instead of the tenant-configurable --color-*
 * ones — this flow must look identical across all 3 mount points, some of
 * which may never have the tenant's SiteConfig CSS variables in scope.
 */
export function BookingButton({
  variant = 'primary',
  isLoading = false,
  disabled,
  children,
  className = '',
  ...props
}: BookingButtonProps) {
  const isDisabled = disabled || isLoading

  return (
    <button
      {...props}
      disabled={isDisabled}
      aria-busy={isLoading}
      className={[
        'inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-center text-base font-semibold leading-snug break-words',
        'transition-colors duration-[var(--booking-transition-duration)] ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)] focus-visible:ring-offset-2',
        VARIANT_CLASSES[variant],
        isDisabled ? 'cursor-not-allowed opacity-50' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {isLoading && (
        <svg className="h-4 w-4 shrink-0 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
