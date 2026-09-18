import type { ReactNode } from 'react'

import { cn } from '../lib/cn'
import { Button } from './Button'
import { AlertIcon, InboxIcon } from './icons'

interface StateProps {
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({ title, description, action, className }: StateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3 py-8 text-center', className)}>
      <span className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <InboxIcon className="size-6" />
      </span>
      <div>
        <p className="font-medium text-foreground">{title}</p>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
  className,
}: Partial<StateProps> & { onRetry?: () => void }) {
  return (
    <div className={cn('flex flex-col items-center gap-3 py-8 text-center', className)}>
      <span className="flex size-12 items-center justify-center rounded-xl bg-destructive-soft text-destructive">
        <AlertIcon className="size-6" />
      </span>
      <div>
        <p className="font-medium text-foreground">{title}</p>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <span className={cn('block animate-pulse rounded bg-muted', className)} />
}
