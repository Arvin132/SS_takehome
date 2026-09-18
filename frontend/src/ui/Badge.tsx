import type { ReactNode } from 'react'

import { cn } from '../lib/cn'

export type BadgeTone = 'primary' | 'neutral' | 'success' | 'danger' | 'info'

const TONES: Record<BadgeTone, string> = {
  primary: 'bg-primary-soft text-primary-soft-foreground',
  neutral: 'bg-muted text-muted-foreground',
  success: 'bg-success-soft text-success',
  danger: 'bg-destructive-soft text-destructive',
  info: 'bg-subtle text-subtle-foreground',
}

interface BadgeProps {
  tone?: BadgeTone
  icon?: ReactNode
  className?: string
  children: ReactNode
}

export function Badge({ tone = 'neutral', icon, className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}

// Small uppercase orange label that sits above a heading, straight from the brand site.
export function Eyebrow({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        'text-xs font-bold uppercase tracking-[0.12em] text-primary',
        className,
      )}
    >
      {children}
    </span>
  )
}

// Rounded peach tile holding an icon or a step number.
export function IconTile({
  className,
  children,
  size = 'md',
}: {
  className?: string
  children: ReactNode
  size?: 'sm' | 'md'
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-foreground',
        size === 'sm' ? 'size-8' : 'size-11',
        className,
      )}
    >
      {children}
    </span>
  )
}
