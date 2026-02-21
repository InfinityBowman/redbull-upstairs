import { cn } from '@/lib/utils'

const colorMap = {
  accent: {
    border: 'border-t-primary',
    glow: 'from-primary/5',
    text: 'text-primary',
  },
  success: {
    border: 'border-t-emerald-500',
    glow: 'from-emerald-500/5',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  warning: {
    border: 'border-t-amber-500',
    glow: 'from-amber-500/5',
    text: 'text-amber-600 dark:text-amber-400',
  },
  danger: {
    border: 'border-t-red-500',
    glow: 'from-red-500/5',
    text: 'text-red-600 dark:text-red-400',
  },
  info: {
    border: 'border-t-blue-500',
    glow: 'from-blue-500/5',
    text: 'text-blue-600 dark:text-blue-400',
  },
}

interface KpiCardProps {
  label: string
  value: string | number
  sub?: string
  color?: keyof typeof colorMap
}

export function KpiCard({ label, value, sub, color = 'accent' }: KpiCardProps) {
  const c = colorMap[color]
  return (
    <div
      className={cn(
        'card-elevated relative overflow-hidden rounded-xl border border-border/60 bg-card p-4 border-t-[3px]',
        c.border,
      )}
    >
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-b to-transparent opacity-60',
          c.glow,
        )}
      />
      <div className="relative">
        <div className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </div>
        <div className="mt-1.5 text-2xl font-extrabold tracking-tight text-card-foreground">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
      </div>
    </div>
  )
}
