import type { HTMLAttributes, ReactNode, ThHTMLAttributes, TdHTMLAttributes } from 'react'

import { cn } from '../lib/cn'

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full border-collapse text-sm', className)} {...props} />
    </div>
  )
}

export function THead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('bg-muted/60', className)} {...props} />
}

export function TBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('divide-y divide-border', className)} {...props} />
}

interface TrProps extends HTMLAttributes<HTMLTableRowElement> {
  onActivate?: () => void
}

// A row becomes a keyboard-operable button when onActivate is supplied.
export function Tr({ onActivate, className, ...props }: TrProps) {
  return (
    <tr
      className={cn(
        onActivate && 'cursor-pointer transition-colors hover:bg-muted/70',
        className,
      )}
      onClick={onActivate}
      onKeyDown={
        onActivate
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onActivate()
              }
            }
          : undefined
      }
      tabIndex={onActivate ? 0 : undefined}
      role={onActivate ? 'button' : undefined}
      {...props}
    />
  )
}

interface CellProps {
  align?: 'left' | 'right' | 'center'
}

const ALIGN = {
  left: 'text-left',
  right: 'text-right tabular-nums',
  center: 'text-center',
}

export function Th({
  align = 'left',
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & CellProps) {
  return (
    <th
      className={cn(
        'px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground',
        ALIGN[align],
        className,
      )}
      {...props}
    />
  )
}

export function Td({
  align = 'left',
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & CellProps) {
  return <td className={cn('px-4 py-3 text-foreground', ALIGN[align], className)} {...props} />
}

export function TableSkeleton({ rows = 6, columns }: { rows?: number; columns: number }) {
  return (
    <TBody>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: columns }).map((_, columnIndex) => (
            <td key={columnIndex} className="px-4 py-3">
              <span className="block h-4 w-full animate-pulse rounded bg-muted" />
            </td>
          ))}
        </tr>
      ))}
    </TBody>
  )
}

export function TableMessage({ columns, children }: { columns: number; children: ReactNode }) {
  return (
    <TBody>
      <tr>
        <td colSpan={columns} className="px-4 py-12">
          {children}
        </td>
      </tr>
    </TBody>
  )
}
