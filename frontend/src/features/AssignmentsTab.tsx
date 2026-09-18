import { useNavigate } from 'react-router-dom'

import { DEFAULT_PAGE_SIZE, useAssignments } from '../api/queries'
import type { CrewAssignment } from '../api/types'
import { crewLabel, formatCurrency, formatDate, plantLabel } from '../lib/format'
import { useUrlState } from '../lib/useUrlState'
import { Card, CardFooter, CardHeader, DataTable, Pagination, Toggle } from '../ui'
import type { Column } from '../ui'

const COLUMNS: Column<CrewAssignment>[] = [
  { key: 'date', header: 'Date', render: (assignment) => formatDate(assignment.date) },
  {
    key: 'plant',
    header: 'Plant',
    render: (assignment) => (
      <span className="font-medium">
        {plantLabel({ id: assignment.plant, name: assignment.plant_name })}
      </span>
    ),
  },
  {
    key: 'crew',
    header: 'Crew',
    render: (assignment) => crewLabel(assignment.crew),
  },
  {
    key: 'days',
    header: 'Estimated days',
    align: 'right',
    render: (assignment) => assignment.estimate_days,
  },
  {
    key: 'cost',
    header: 'Estimated cost',
    align: 'right',
    render: (assignment) => formatCurrency(assignment.estimate_cost),
  },
]

export function AssignmentsTab() {
  const navigate = useNavigate()
  const { getPage, getFlag, setValues } = useUrlState()
  const page = getPage('page')
  const mine = getFlag('mine')

  const assignments = useAssignments(mine ? 'mine' : 'all', { page })

  return (
    <Card>
      <CardHeader
        title="Assignments"
        description={
          mine
            ? 'Scheduled cleaning work for the plants assigned to you.'
            : 'Every scheduled cleaning assignment.'
        }
        actions={
          <Toggle
            label="Mine"
            checked={mine}
            description="Only show assignments for my plants"
            onChange={(checked) => setValues({ mine: checked ? '1' : '0', page: '1' })}
          />
        }
      />

      <DataTable
        columns={COLUMNS}
        rows={assignments.data?.results}
        rowKey={(assignment) => assignment.id}
        onRowClick={(assignment) => navigate(`/plants/${assignment.plant}`)}
        isLoading={assignments.isLoading}
        isError={assignments.isError}
        onRetry={() => assignments.refetch()}
        emptyTitle={mine ? 'No assignments for your plants' : 'No assignments scheduled'}
        emptyDescription={
          mine ? 'Turn off the "Mine" filter to see every assignment.' : undefined
        }
      />

      <CardFooter>
        <Pagination
          className="w-full"
          page={page}
          pageSize={DEFAULT_PAGE_SIZE}
          count={assignments.data?.count ?? 0}
          onPageChange={(next) => setValues({ page: String(next) })}
        />
      </CardFooter>
    </Card>
  )
}
