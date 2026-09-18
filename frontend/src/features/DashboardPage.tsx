import { useLocation, useNavigate } from 'react-router-dom'

import { PageHeader } from '../layout/PageHeader'
import { Tabs } from '../ui'
import type { TabItem } from '../ui'
import { PanelIcon, SparkIcon, UsersIcon } from '../ui/icons'
import { AssignmentsTab } from './AssignmentsTab'
import { CrewsTab } from './CrewsTab'
import { PlantsTab } from './PlantsTab'

const TABS: TabItem[] = [
  { key: 'plants', label: 'Plants', icon: <PanelIcon className="size-4" /> },
  { key: 'crews', label: 'Crews', icon: <UsersIcon className="size-4" /> },
  { key: 'assignments', label: 'Assignments', icon: <SparkIcon className="size-4" /> },
]

// Tab state is the route, so a tab is linkable and survives a refresh.
export function DashboardPage() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const active = pathname.startsWith('/crews')
    ? 'crews'
    : pathname.startsWith('/assignments')
      ? 'assignments'
      : 'plants'

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fleet"
        title="Soiling & cleaning advisor"
        description="Review the plants and crews you are responsible for today."
      />

      <Tabs items={TABS} value={active} onChange={(key) => navigate(`/${key}`)} />

      {active === 'plants' ? <PlantsTab /> : active === 'crews' ? <CrewsTab /> : <AssignmentsTab />}
    </div>
  )
}
