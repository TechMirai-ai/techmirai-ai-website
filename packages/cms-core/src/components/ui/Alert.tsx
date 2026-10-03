import type { ReactNode } from 'react'
import { Info, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react'

type AlertVariant = 'info' | 'success' | 'warning' | 'danger'

interface AlertProps {
  children: ReactNode
  variant?: AlertVariant
  title?: string
  className?: string
}

const variantConfig: Record<AlertVariant, { border: string; icon: typeof Info; iconColor: string }> = {
  info: { border: 'border-[var(--color-primary)]', icon: Info, iconColor: 'text-[var(--color-primary)]' },
  success: { border: 'border-[var(--color-success)]', icon: CheckCircle2, iconColor: 'text-[var(--color-success)]' },
  warning: { border: 'border-[var(--color-warning)]', icon: AlertTriangle, iconColor: 'text-[var(--color-warning)]' },
  danger: { border: 'border-[var(--color-error)]', icon: AlertCircle, iconColor: 'text-[var(--color-error)]' },
}

export function Alert({ children, variant = 'info', title, className = '' }: AlertProps) {
  const { border, icon: Icon, iconColor } = variantConfig[variant]

  return (
    <div
      role="alert"
      className={[
        'flex gap-3 rounded-md border-l-4 bg-[var(--color-surface)] p-4',
        border,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Icon className={`h-5 w-5 shrink-0 ${iconColor}`} aria-hidden="true" />
      <div className="text-sm text-[var(--color-text)] leading-relaxed">
        {title && <p className="mb-1 font-semibold">{title}</p>}
        {children}
      </div>
    </div>
  )
}
