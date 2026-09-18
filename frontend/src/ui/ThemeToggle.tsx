import { useState } from 'react'

import { applyTheme, getStoredTheme, type Theme } from '../lib/theme'
import { cn } from '../lib/cn'
import { MoonIcon, SunIcon } from './icons'

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>(getStoredTheme)

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setTheme(next)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-lg border border-border',
        'bg-card text-muted-foreground transition-colors hover:text-foreground',
        className,
      )}
    >
      {theme === 'dark' ? <MoonIcon className="size-4" /> : <SunIcon className="size-4" />}
    </button>
  )
}
