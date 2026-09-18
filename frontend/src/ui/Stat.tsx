import type { ReactNode } from 'react'

import { cn } from '../lib/cn'
import { Skeleton } from './States'

interface StatProps {
  label: string
  value: ReactNode
  hint?: ReactNode
  delta?: { value: string; direction: 'up' | 'down' }
  emphasis?: boolean
  loading?: boolean
  className?: string
}

// KPI box from the SwishOS header strip: muted label, large value, optional signed delta.
export function Stat({ label, value, hint, delta, emphasis, loading, className }: StatProps) {
  return (
    <div className={cn('rounded-xl border border-border bg-card px-4 py-3 shadow-card', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {delta ? (
          <span
            className={cn(
              'text-xs font-semibold tabular-nums',
              delta.direction === 'up' ? 'text-success' : 'text-destructive',
            )}
          >
            {delta.direction === 'up' ? '▲' : '▼'} {delta.value}
          </span>
        ) : null}
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-7 w-24" />
      ) : (
        <p
          className={cn(
            'mt-1 font-display text-2xl font-semibold tabular-nums',
            emphasis ? 'text-primary' : 'text-foreground',
          )}
        >
          {value}
        </p>
      )}
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

export function StatGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('grid gap-3 sm:grid-cols-2 xl:grid-cols-4', className)}>{children}</div>
  )
}

export function DescriptionList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {item.label}
          </dt>
          <dd className="mt-1 text-sm font-medium tabular-nums text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
