import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useFleetAnalytics } from '../api/queries'
import type { PlantAnalytics } from '../api/types'
import { PageHeader } from '../layout/PageHeader'
import { crewLabel, formatCurrency, formatNumber, plantLabel } from '../lib/format'
import { Badge, Button, Card, CardHeader, DataTable, Stat, StatGrid } from '../ui'
import type { Column } from '../ui'
import { CheckIcon, SparkIcon } from '../ui/icons'
import { DispatchModal } from './DispatchModal'

function canDispatch(entry: PlantAnalytics) {
  return entry.status === 'ready' && entry.recommend_crew !== null && !entry.assignment_exists
}

export function AnalyticsPage() {
  const navigate = useNavigate()
  const analytics = useFleetAnalytics()
  const [dispatchEntry, setDispatchEntry] = useState<PlantAnalytics | null>(null)

  const summary = analytics.data?.summary

  const columns: Column<PlantAnalytics>[] = [
    {
      key: 'plant',
      header: 'Plant',
      render: (entry) => <span className="font-medium">{plantLabel(entry.plant)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (entry) =>
        entry.status === 'computing' ? (
          <Badge tone="info">Computing…</Badge>
        ) : (
          <Badge tone="success">Ready</Badge>
        ),
    },
    {
      key: 'loss_kwh',
      header: 'Loss (kWh/day)',
      align: 'right',
      render: (entry) => formatNumber(entry.estimate_loss_kwh, 0),
    },
    {
      key: 'loss_usd',
      header: 'Loss (USD/day)',
      align: 'right',
      render: (entry) => formatCurrency(entry.estimate_loss_usd),
    },
    {
      key: 'recovery',
      header: 'Possible recovery',
      align: 'right',
      render: (entry) => formatCurrency(entry.estimate_recovery),
    },
    {
      key: 'crew',
      header: 'Suggested crew',
      render: (entry) =>
        entry.recommend_crew ? (
          crewLabel(entry.recommend_crew.id)
        ) : (
          <span className="text-muted-foreground">
            {entry.status === 'computing' ? '—' : 'Not worth cleaning'}
          </span>
        ),
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      render: (entry) => (
        <Button
          size="sm"
          variant="outline"
          icon={<CheckIcon className="size-4" />}
          disabled={!canDispatch(entry)}
          onClick={(event) => {
            event.stopPropagation()
            setDispatchEntry(entry)
          }}
        >
          {entry.assignment_exists ? 'Dispatched' : 'Dispatch'}
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fleet"
        title="Today's cleaning recommendations"
        description="Soiling loss and cleaning economics for the plants assigned to you."
      />

      <StatGrid>
        <Stat
          label="Covered plants"
          value={summary?.total_plants ?? '—'}
          loading={analytics.isLoading}
        />
        <Stat
          label="Total loss (USD/day)"
          value={formatCurrency(summary?.total_loss_usd)}
          loading={analytics.isLoading}
        />
        <Stat
          label="Total loss (kWh/day)"
          value={formatNumber(summary?.total_loss_kwh, 0)}
          loading={analytics.isLoading}
        />
        <Stat
          label="Possible recoverables"
          value={formatCurrency(summary?.possible_recovery_usd)}
          emphasis
          loading={analytics.isLoading}
        />
      </StatGrid>

      <Card>
        <CardHeader
          title="Plant reports"
          description="Reports still computing refresh automatically once the background worker finishes."
          icon={<SparkIcon className="size-5" />}
        />
        <DataTable
          columns={columns}
          rows={analytics.data?.results}
          rowKey={(entry) => entry.plant.id}
          onRowClick={(entry) => navigate(`/plants/${entry.plant.id}`)}
          isLoading={analytics.isLoading}
          isError={analytics.isError}
          onRetry={() => analytics.refetch()}
          emptyTitle="No plants assigned to you"
        />
      </Card>

      <DispatchModal
        open={dispatchEntry !== null}
        onClose={() => setDispatchEntry(null)}
        entry={dispatchEntry}
      />
    </div>
  )
}
