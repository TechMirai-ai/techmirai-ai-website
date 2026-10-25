import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'phone'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-primary)] text-on-primary hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2',
  // Accent text on tint background — accent text color is darkened from the raw
  // token (#47A35A on tint is only ~3:1) so it still clears 4.5:1 at button text size.
  secondary:
    'bg-[var(--color-surface-alt)] text-[#2A783D] hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2',
  ghost:
    'bg-transparent text-[var(--color-text)] hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2',
  outline:
    'border border-[var(--color-primary)] text-brand-primary-dark hover:bg-[var(--color-primary)]/10 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2',
  // Tap-to-call CTA: same high-contrast fill as primary, tabular figures for the number.
  phone:
    'bg-[var(--color-primary)] text-on-primary hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 tabular-nums',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-7 py-3.5 text-lg',
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading

  return (
    <button
      {...props}
      disabled={isDisabled}
      aria-busy={isLoading}
      className={[
        'inline-flex max-w-full items-center justify-center gap-2 rounded-md text-center font-medium leading-snug break-words transition-colors duration-150',
        // 48px minimum tap target site-wide; the phone/booking CTA gets the
        // stricter 56px minimum called for by the older-skewing patient audience.
        'focus-visible:outline-none min-h-[48px]',
        variant === 'phone' ? 'min-h-[56px]' : '',
        variantClasses[variant],
        sizeClasses[size],
        isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {isLoading && (
        <svg
          className="animate-spin h-4 w-4 shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}
