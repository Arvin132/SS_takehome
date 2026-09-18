import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { Eyebrow } from '../ui'
import { ArrowLeftIcon } from '../ui/icons'

interface PageHeaderProps {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  back?: { to: string; label: string }
}

export function PageHeader({ eyebrow, title, description, actions, back }: PageHeaderProps) {
  return (
    <div className="space-y-3">
      {back ? (
        <Link
          to={back.to}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          {back.label}
        </Link>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          <h1 className="mt-1 text-2xl font-light text-foreground sm:text-3xl">{title}</h1>
          {description ? (
            <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  )
}
