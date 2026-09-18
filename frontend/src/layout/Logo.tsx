import { cn } from '../lib/cn'

// Slanted panel mark in the brand's orange-to-navy diagonal gradient.
export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('flex items-center gap-2.5 font-display', className)}>
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden="true">
        <defs>
          <linearGradient id="swish-logo" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#df5b12" />
            <stop offset="100%" stopColor="#33394a" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#swish-logo)" />
        <path d="M11 21.5 14.5 10h8.5L19.5 21.5Z" fill="#fff" opacity="0.92" />
      </svg>
      {!compact ? <span className="text-lg font-medium tracking-tight">SwishOS</span> : null}
    </span>
  )
}
