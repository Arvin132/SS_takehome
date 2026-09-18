import { useNavigate } from 'react-router-dom'

import { DEFAULT_PAGE_SIZE, useCrews } from '../api/queries'
import type { Crew } from '../api/types'
import { crewLabel, formatCurrency, formatNumber } from '../lib/format'
import { useUrlState } from '../lib/useUrlState'
import { Card, CardFooter, CardHeader, DataTable, Pagination, Toggle } from '../ui'
import type { Column } from '../ui'

const COLUMNS: Column<Crew>[] = [
  {
    key: 'crew',
    header: 'Crew',
    render: (crew) => <span className="font-medium">{crewLabel(crew.id)}</span>,
  },
  {
    key: 'throughput',
    header: 'Throughput (MW/day)',
    align: 'right',
    render: (crew) => formatNumber(crew.mw_per_day, 2),
  },
  {
    key: 'rate',
    header: 'Day rate',
    align: 'right',
    render: (crew) => formatCurrency(crew.day_rate_usd),
  },
]

export function CrewsTab() {
  const navigate = useNavigate()
  const { getPage, getFlag, setValues } = useUrlState()
  const page = getPage('page')
  const mine = getFlag('mine')

  const crews = useCrews(mine ? 'mine' : 'all', { page })

  return (
    <Card>
      <CardHeader
        title="Crews"
        description={
          mine ? 'Crews that service the plants assigned to you.' : 'Every crew in the system.'
        }
        actions={
          <Toggle
            label="Mine"
            checked={mine}
            description="Only show crews servicing my plants"
            onChange={(checked) => setValues({ mine: checked ? '1' : '0', page: '1' })}
          />
        }
      />

      <DataTable
        columns={COLUMNS}
        rows={crews.data?.results}
        rowKey={(crew) => crew.id}
        onRowClick={(crew) => navigate(`/crews/${crew.id}`)}
        isLoading={crews.isLoading}
        isError={crews.isError}
        onRetry={() => crews.refetch()}
        emptyTitle={mine ? 'No crews service your plants' : 'No crews found'}
        emptyDescription={mine ? 'Turn off the "Mine" filter to see every crew.' : undefined}
      />

      <CardFooter>
        <Pagination
          className="w-full"
          page={page}
          pageSize={DEFAULT_PAGE_SIZE}
          count={crews.data?.count ?? 0}
          onPageChange={(next) => setValues({ page: String(next) })}
        />
      </CardFooter>
    </Card>
  )
}
