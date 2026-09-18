import { useNavigate } from 'react-router-dom'

import { DEFAULT_PAGE_SIZE, usePlants } from '../api/queries'
import type { Plant } from '../api/types'
import {
  formatCurrency,
  formatDate,
  formatDaysUntilReset,
  formatNumber,
  isResetUrgent,
  plantLabel,
} from '../lib/format'
import { useUrlState } from '../lib/useUrlState'
import { Badge, Card, CardFooter, CardHeader, DataTable, Pagination, Toggle } from '../ui'
import type { Column } from '../ui'

const COLUMNS: Column<Plant>[] = [
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
    key: 'tariff',
    header: 'Tariff / kWh',
    align: 'right',
    render: (plant) => formatCurrency(plant.tariff_per_kwh, 3),
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
    render: (plant) => (
      <Badge tone={isResetUrgent(plant.days_until_next_reset) ? 'primary' : 'neutral'}>
        {formatDaysUntilReset(plant.days_until_next_reset)}
      </Badge>
    ),
  },
  {
    key: 'commissioned',
    header: 'Commissioned',
    align: 'right',
    render: (plant) => (
      <span className="text-muted-foreground">{formatDate(plant.creation_date)}</span>
    ),
  },
]

export function PlantsTab() {
  const navigate = useNavigate()
  const { getPage, getFlag, setValues } = useUrlState()
  const page = getPage('page')
  const mine = getFlag('mine')

  const plants = usePlants(mine ? 'mine' : 'all', { page })

  return (
    <Card>
      <CardHeader
        title="Plants"
        description={
          mine ? 'Plants assigned to your account.' : 'Every plant visible to your account.'
        }
        actions={
          <Toggle
            label="Mine"
            checked={mine}
            description="Only show plants assigned to me"
            onChange={(checked) => setValues({ mine: checked ? '1' : '0', page: '1' })}
          />
        }
      />

      <DataTable
        columns={COLUMNS}
        rows={plants.data?.results}
        rowKey={(plant) => plant.id}
        onRowClick={(plant) => navigate(`/plants/${plant.id}`)}
        isLoading={plants.isLoading}
        isError={plants.isError}
        onRetry={() => plants.refetch()}
        emptyTitle={mine ? 'No plants assigned to you' : 'No plants found'}
        emptyDescription={
          mine ? 'Turn off the "Mine" filter to see the whole fleet.' : undefined
        }
      />

      <CardFooter>
        <Pagination
          className="w-full"
          page={page}
          pageSize={DEFAULT_PAGE_SIZE}
          count={plants.data?.count ?? 0}
          onPageChange={(next) => setValues({ page: String(next) })}
        />
      </CardFooter>
    </Card>
  )
}
