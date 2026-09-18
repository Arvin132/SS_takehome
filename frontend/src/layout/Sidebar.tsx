import { NavLink } from 'react-router-dom'

import { usePlants } from '../api/queries'
import { useAuth } from '../auth/context'
import { cn } from '../lib/cn'
import { plantLabel } from '../lib/format'
import { DropIcon, PanelIcon, SparkIcon, UsersIcon, LogoutIcon } from '../ui/icons'
import { Logo } from './Logo'

const NAV_ITEMS = [
  { to: '/analytics', label: 'Analytics', Icon: DropIcon },
  { to: '/plants', label: 'Plants', Icon: PanelIcon },
  { to: '/crews', label: 'Crews', Icon: UsersIcon },
  { to: '/assignments', label: 'Assignments', Icon: SparkIcon },
]

// Max page size the API allows (core/pagination.py) — used to fetch the whole "mine" list in one page.
const ALL_PLANTS_PAGE_SIZE = 200

function navClasses({ isActive }: { isActive: boolean }) {
  return cn(
    'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
    isActive
      ? 'bg-sidebar-active font-medium text-sidebar-active-foreground'
      : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground',
  )
}

// Active items get the peach pill plus a thin orange edge bar, per the product screenshots.
function ActiveBar({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="absolute inset-y-1.5 -left-2 w-0.5 rounded-full bg-primary" />
  ) : null
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth()
  const quickPlants = usePlants('mine', { page: 1, page_size: ALL_PLANTS_PAGE_SIZE })

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center justify-between border-b border-sidebar-border px-5 py-4">
        <Logo className="text-sidebar-foreground" />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
        <div className="space-y-1">
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} end className={navClasses} onClick={onNavigate}>
              {({ isActive }) => (
                <>
                  <ActiveBar isActive={isActive} />
                  <Icon className="size-4.5" />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="space-y-1">
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-sidebar-muted">
            My plants
          </p>
          <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
            {quickPlants.data?.results.map((plant) => (
              <NavLink
                key={plant.id}
                to={`/plants/${plant.id}`}
                className={navClasses}
                onClick={onNavigate}
              >
                {({ isActive }) => (
                  <>
                    <ActiveBar isActive={isActive} />
                    <span className="truncate">{plantLabel(plant)}</span>
                  </>
                )}
              </NavLink>
            ))}
            {quickPlants.isLoading ? (
              <p className="px-3 py-2 text-sm text-sidebar-muted">Loading…</p>
            ) : null}
            {!quickPlants.isLoading && !quickPlants.data?.count ? (
              <p className="px-3 py-2 text-sm text-sidebar-muted">No plants assigned</p>
            ) : null}
          </div>
        </div>
      </nav>

      <div className="flex items-center gap-3 border-t border-sidebar-border px-4 py-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {(user?.username ?? '?').charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user?.username ?? 'Signed in'}</p>
          <p className="truncate text-xs text-sidebar-muted">Asset manager</p>
        </div>
        <button
          type="button"
          onClick={logout}
          aria-label="Sign out"
          className="rounded-lg p-2 text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-foreground"
        >
          <LogoutIcon className="size-4.5" />
        </button>
      </div>
    </div>
  )
}
