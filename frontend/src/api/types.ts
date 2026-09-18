export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface User {
  id: number
  username: string
}

export interface Plant {
  id: number
  name: string
  region: string
  capacity_mw: string
  tariff_per_kwh: string
  cleaning_cost_usd: string
  days_until_next_reset: number | null
  creation_date: string
}

export interface PlantDayEvent {
  rain_mm: string
  cleaned: boolean
}

export interface PlantDay {
  id: number
  plant: number
  date: string
  energy_kwh: string
  expected_energy_kwh: string
  performance_ratio: string | null
  soiling_loss_pct: string | null
  event: PlantDayEvent | null
}

export interface Crew {
  id: number
  mw_per_day: string
  day_rate_usd: string
}

export interface CrewAssignment {
  id: number
  crew: number
  plant: number
  plant_name: string
  date: string
  estimate_days: number
  estimate_cost: string
}

export interface PageParams {
  page: number
  page_size?: number
}

export interface PlantAnalytics {
  plant: Plant
  date: string
  status: 'ready' | 'computing'
  estimate_loss_usd: string | null
  estimate_loss_kwh: string | null
  estimate_recovery: string | null
  cleaning_cost: string | null
  recommend_crew: Crew | null
  assignment_exists: boolean
}

export interface FleetAnalyticsSummary {
  total_plants: number
  total_loss_usd: string
  total_loss_kwh: string
  possible_recovery_usd: string
}

export interface FleetAnalytics {
  date: string
  summary: FleetAnalyticsSummary
  results: PlantAnalytics[]
}

export type PlantDayAiSummaryStatus = 'none' | 'pending' | 'ready' | 'failed'

export interface PlantDayAiSummary {
  status: PlantDayAiSummaryStatus
  summary: string | null
  error: string | null
  updated_at: string | null
}
