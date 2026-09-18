import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { DEFAULT_PAGE_SIZE, useCrew, useCrewAssignments, useCrewPlants } from '../api/queries'
import type { CrewAssignment, Plant } from '../api/types'
import { PageHeader } from '../layout/PageHeader'
import {
  crewLabel,
  formatCurrency,
  formatDate,
  formatDaysUntilReset,
  formatNumber,
  plantLabel,
} from '../lib/format'
import { useUrlState } from '../lib/useUrlState'
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  DataTable,
  ErrorState,
  Pagination,
  Stat,
  StatGrid,
} from '../ui'
import type { Column } from '../ui'
import { PanelIcon, SparkIcon } from '../ui/icons'
import { AssignmentModal } from './AssignmentModal'

const PLANT_COLUMNS: Column<Plant>[] = [
  {
    key: 'plant',
    header: 'Plant',
    render: (plant) => <span className="font-medium">{plantLabel(plant)}</span>,
  },
  {
    key: 'capacity',
    header: 'Capacity (MW)',
    align: 'right',
    render: (plant) => formatNumber(plant.capacity_mw, 2),
  },
  {
    key: 'cleaning',
    header: 'Cleaning cost',
    align: 'right',
    render: (plant) => formatCurrency(plant.cleaning_cost_usd),
  },
  {
    key: 'reset',
    header: 'Days to reset',
    align: 'right',
    render: (plant) => formatDaysUntilReset(plant.days_until_next_reset),
  },
]

const ASSIGNMENT_COLUMNS: Column<CrewAssignment>[] = [
  { key: 'date', header: 'Date', render: (assignment) => formatDate(assignment.date) },
  {
    key: 'plant',
    header: 'Plant',
    render: (assignment) => plantLabel({ id: assignment.plant, name: assignment.plant_name }),
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

export function CrewDetailPage() {
  const navigate = useNavigate()
  const { crewId } = useParams()
  const id = Number(crewId)
  const { getPage, setValues } = useUrlState()
  const plantsPage = getPage('plantsPage')
  const assignmentsPage = getPage('assignmentsPage')
  const [assignOpen, setAssignOpen] = useState(false)

  const crew = useCrew(id)
  const plants = useCrewPlants(id, { page: plantsPage })
  const assignments = useCrewAssignments(id, { page: assignmentsPage })

  if (crew.isError) {
    return (
      <Card>
        <CardBody>
          <ErrorState
            title="Crew unavailable"
            description="It may not exist, or it is out of your account's scope."
            onRetry={() => crew.refetch()}
          />
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Crew detail"
        title={crewLabel(id)}
        description="Throughput, cost and the plants this crew is allowed to service."
        back={{ to: '/crews', label: 'Back to crews' }}
        actions={
          crew.data ? (
            <Button size="sm" onClick={() => setAssignOpen(true)}>
              Assign to plant
            </Button>
          ) : null
        }
      />

      <StatGrid className="xl:grid-cols-3">
        <Stat
          label="Throughput"
          value={`${formatNumber(crew.data?.mw_per_day, 2)} MW/day`}
          emphasis
          loading={crew.isLoading}
        />
        <Stat
          label="Day rate"
          value={formatCurrency(crew.data?.day_rate_usd)}
          loading={crew.isLoading}
        />
        <Stat
          label="Serviceable plants"
          value={plants.data?.count ?? 0}
          loading={plants.isLoading}
        />
      </StatGrid>

      <Card>
        <CardHeader
          title="Serviceable plants"
          description="Region scoped, a crew only services plants in its own region."
          icon={<PanelIcon className="size-5" />}
        />
        <DataTable
          columns={PLANT_COLUMNS}
          rows={plants.data?.results}
          rowKey={(plant) => plant.id}
          onRowClick={(plant) => navigate(`/plants/${plant.id}`)}
          isLoading={plants.isLoading}
          isError={plants.isError}
          onRetry={() => plants.refetch()}
          emptyTitle="No plants mapped to this crew"
        />
        <CardFooter>
          <Pagination
            className="w-full"
            page={plantsPage}
            pageSize={DEFAULT_PAGE_SIZE}
            count={plants.data?.count ?? 0}
            onPageChange={(next) => setValues({ plantsPage: String(next) })}
          />
        </CardFooter>
      </Card>

      <Card>
        <CardHeader
          title="Assignments"
          description="Scheduled cleaning work for this crew, newest first."
          icon={<SparkIcon className="size-5" />}
        />
        <DataTable
          columns={ASSIGNMENT_COLUMNS}
          rows={assignments.data?.results}
          rowKey={(assignment) => assignment.id}
          onRowClick={(assignment) => navigate(`/plants/${assignment.plant}`)}
          isLoading={assignments.isLoading}
          isError={assignments.isError}
          onRetry={() => assignments.refetch()}
          emptyTitle="No assignments scheduled"
        />
        <CardFooter>
          <Pagination
            className="w-full"
            page={assignmentsPage}
            pageSize={DEFAULT_PAGE_SIZE}
            count={assignments.data?.count ?? 0}
            onPageChange={(next) => setValues({ assignmentsPage: String(next) })}
          />
        </CardFooter>
      </Card>

      {crew.data ? (
        <AssignmentModal
          open={assignOpen}
          onClose={() => setAssignOpen(false)}
          subject={{ type: 'crew', crew: crew.data }}
        />
      ) : null}
    </div>
  )
}
