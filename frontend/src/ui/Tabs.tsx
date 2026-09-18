import type { ReactNode } from 'react'

import { cn } from '../lib/cn'

export interface TabItem {
  key: string
  label: string
  icon?: ReactNode
}

interface TabsProps {
  items: TabItem[]
  value: string
  onChange: (key: string) => void
  className?: string
}

// Underline tabs, matching the product screenshots: orange underline, muted inactive labels.
export function Tabs({ items, value, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex gap-6 border-b border-border', className)} role="tablist">
      {items.map((item) => {
        const active = item.key === value
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.key)}
            className={cn(
              'flex items-center gap-2 border-b-2 px-0.5 pb-3 text-sm font-medium transition-colors',
              active
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {item.icon}
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
