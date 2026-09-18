import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import {
  DEFAULT_PAGE_SIZE,
  useGenerateAiSummary,
  usePlant,
  usePlantAiSummary,
  usePlantCrews,
  usePlantDays,
} from '../api/queries'
import type { Crew, PlantDay } from '../api/types'
import { PageHeader } from '../layout/PageHeader'
import {
  crewLabel,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDaysUntilReset,
  formatNumber,
  formatPercent,
  formatRatio,
  isResetUrgent,
  plantLabel,
} from '../lib/format'
import { useUrlState } from '../lib/useUrlState'
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  DataTable,
  DescriptionList,
  ErrorState,
  Pagination,
  Skeleton,
  Spinner,
  Stat,
  StatGrid,
} from '../ui'
import type { Column } from '../ui'
import { DropIcon, PanelIcon, SparkIcon, UsersIcon } from '../ui/icons'
import { AssignmentModal } from './AssignmentModal'

const DAY_COLUMNS: Column<PlantDay>[] = [
  { key: 'date', header: 'Date', render: (day) => formatDate(day.date) },
  {
    key: 'energy',
    header: 'Energy (kWh)',
    align: 'right',
    render: (day) => formatNumber(day.energy_kwh, 0),
  },
  {
    key: 'expected',
    header: 'Expected (kWh)',
    align: 'right',
    render: (day) => formatNumber(day.expected_energy_kwh, 0),
  },
  {
    key: 'pr',
    header: 'PR',
    align: 'right',
    render: (day) => formatRatio(day.performance_ratio),
  },
  {
    key: 'soiling',
    header: 'Soiling loss',
    align: 'right',
    render: (day) => formatPercent(day.soiling_loss_pct),
  },
  {
    key: 'rain',
    header: 'Rain (mm)',
    align: 'right',
    render: (day) => formatNumber(day.event?.rain_mm, 1),
  },
  {
    key: 'cleaned',
    header: 'Cleaned',
    align: 'right',
    render: (day) =>
      day.event?.cleaned ? <Badge tone="success">Cleaned</Badge> : <span className="text-muted-foreground">—</span>,
  },
]

const CREW_COLUMNS: Column<Crew>[] = [
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

export function PlantDetailPage() {
  const navigate = useNavigate()
  const { plantId } = useParams()
  const id = Number(plantId)
  const { getPage, setValues } = useUrlState()
  const daysPage = getPage('daysPage')
  const crewsPage = getPage('crewsPage')
  const [assignOpen, setAssignOpen] = useState(false)

  const plant = usePlant(id)
  const days = usePlantDays(id, { page: daysPage })
  const crews = usePlantCrews(id, { page: crewsPage })
  const aiSummary = usePlantAiSummary(id)
  const generateAiSummary = useGenerateAiSummary(id)

  // Readings have deliberate gaps, so each KPI falls back to its own latest populated day.
  const rows = days.data?.results ?? []
  const latestSoiling = rows.find((day) => day.soiling_loss_pct !== null)
  const latestRatio = rows.find((day) => day.performance_ratio !== null)

  if (plant.isError) {
    return (
      <Card>
        <CardBody>
          <ErrorState
            title="Plant unavailable"
            description="It may not exist, or it is not assigned to your account."
            onRetry={() => plant.refetch()}
          />
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Plant detail"
        title={plant.data ? plantLabel(plant.data) : plantLabel(id)}
        description="Telemetry, economics and the crews that can service this plant."
        back={{ to: '/plants', label: 'Back to plants' }}
        actions={
          plant.data ? (
            <>
              <Badge tone={isResetUrgent(plant.data.days_until_next_reset) ? 'primary' : 'neutral'}>
                {plant.data.days_until_next_reset === null
                  ? 'Reset timing unknown'
                  : `Resets in ${plant.data.days_until_next_reset} days`}
              </Badge>
              <Button size="sm" onClick={() => setAssignOpen(true)}>
                Assign crew
              </Button>
            </>
          ) : null
        }
      />

      <StatGrid>
        <Stat
          label="Latest soiling loss"
          value={formatPercent(latestSoiling?.soiling_loss_pct)}
          hint={
            latestSoiling ? `As of ${formatDate(latestSoiling.date)}` : 'No soiling baseline yet'
          }
          emphasis
          loading={days.isLoading}
        />
        <Stat
          label="Performance ratio"
          value={formatRatio(latestRatio?.performance_ratio)}
          hint={latestRatio ? `As of ${formatDate(latestRatio.date)}` : 'No readings yet'}
          loading={days.isLoading}
        />
        <Stat
          label="Capacity"
          value={`${formatNumber(plant.data?.capacity_mw, 2)} MW`}
          loading={plant.isLoading}
        />
        <Stat
          label="Cleaning cost"
          value={formatCurrency(plant.data?.cleaning_cost_usd)}
          hint={`Tariff ${formatCurrency(plant.data?.tariff_per_kwh, 3)} / kWh`}
          loading={plant.isLoading}
        />
      </StatGrid>

      <Card>
        <CardHeader title="Plant profile" icon={<PanelIcon className="size-5" />} />
        <CardBody>
          <DescriptionList
            items={[
              { label: 'Plant ID', value: id },
              { label: 'Commissioned', value: formatDate(plant.data?.creation_date) },
              {
                label: 'Capacity',
                value: `${formatNumber(plant.data?.capacity_mw, 4)} MW`,
              },
              {
                label: 'Days until next reset',
                value: formatDaysUntilReset(plant.data?.days_until_next_reset),
              },
            ]}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="AI day summary"
          description="A short LLM recap of today's telemetry and recommendation for this plant."
          icon={<SparkIcon className="size-5" />}
          actions={
            <Button
              size="sm"
              variant={aiSummary.data?.status === 'ready' ? 'outline' : 'primary'}
              icon={<SparkIcon className="size-4" />}
              loading={generateAiSummary.isPending}
              disabled={aiSummary.data?.status === 'pending'}
              onClick={() => generateAiSummary.mutate()}
            >
              {aiSummary.data?.status === 'ready' || aiSummary.data?.status === 'failed'
                ? 'Regenerate'
                : 'Generate summary'}
            </Button>
          }
        />
        <CardBody>
          {aiSummary.isLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : aiSummary.isError ? (
            <ErrorState
              title="Summary unavailable"
              description="Today's telemetry for this plant could not be found."
              onRetry={() => aiSummary.refetch()}
            />
          ) : aiSummary.data?.status === 'ready' ? (
            <div className="space-y-2">
              <p className="text-sm text-foreground">{aiSummary.data.summary}</p>
              <p className="text-xs text-muted-foreground">
                Generated {formatDateTime(aiSummary.data.updated_at)}
              </p>
            </div>
          ) : aiSummary.data?.status === 'pending' ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="size-4" />
              Generating today&rsquo;s summary — refresh in a bit to see it.
            </div>
          ) : aiSummary.data?.status === 'failed' ? (
            <p className="text-sm text-destructive">{aiSummary.data.error}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No summary generated yet for today.</p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Daily telemetry"
          description="Newest readings first. Blank cells mean the source data had a gap."
          icon={<DropIcon className="size-5" />}
        />
        <DataTable
          columns={DAY_COLUMNS}
          rows={days.data?.results}
          rowKey={(day) => day.id}
          isLoading={days.isLoading}
          isError={days.isError}
          onRetry={() => days.refetch()}
          emptyTitle="No telemetry for this plant"
        />
        <CardFooter>
          <Pagination
            className="w-full"
            page={daysPage}
            pageSize={DEFAULT_PAGE_SIZE}
            count={days.data?.count ?? 0}
            onPageChange={(next) => setValues({ daysPage: String(next) })}
          />
        </CardFooter>
      </Card>

      <Card>
        <CardHeader
          title="Servicing crews"
          description="Crews whose region covers this plant."
          icon={<UsersIcon className="size-5" />}
        />
        <DataTable
          columns={CREW_COLUMNS}
          rows={crews.data?.results}
          rowKey={(crew) => crew.id}
          onRowClick={(crew) => navigate(`/crews/${crew.id}`)}
          isLoading={crews.isLoading}
          isError={crews.isError}
          onRetry={() => crews.refetch()}
          emptyTitle="No crew services this plant"
        />
        <CardFooter>
          <Pagination
            className="w-full"
            page={crewsPage}
            pageSize={DEFAULT_PAGE_SIZE}
            count={crews.data?.count ?? 0}
            onPageChange={(next) => setValues({ crewsPage: String(next) })}
          />
        </CardFooter>
      </Card>

      {plant.data ? (
        <AssignmentModal
          open={assignOpen}
          onClose={() => setAssignOpen(false)}
          subject={{ type: 'plant', plant: plant.data }}
        />
      ) : null}
    </div>
  )
}
