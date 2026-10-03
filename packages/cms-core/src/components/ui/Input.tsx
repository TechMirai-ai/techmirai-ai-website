import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  id: string
  error?: string
}

export function Input({ label, id, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-[var(--color-text)] block">
        {label}
      </label>
      <input
        {...props}
        id={id}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={error ? true : undefined}
        className={[
          'w-full min-h-[44px] rounded-md border px-3 py-2 text-base',
          'text-[var(--color-text)] bg-[var(--color-background)]',
          'focus-visible:outline-none focus-visible:ring-2',
          error
            ? 'border-[var(--color-error)] focus-visible:ring-[var(--color-error)]'
            : 'border-neutral-300 focus-visible:ring-[var(--color-primary)]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-[var(--color-error)] mt-0.5">
          {error}
        </p>
      )}
    </div>
  )
}
