import { toNumber } from './format'

export interface CleaningEstimate {
  days: number
  cost: number
}

// Mirrors backend/analytics/recommendation.py's _plan_crew_cleaning: a crew clears
// capacity_mw at mw_per_day, rounded up to a full day, billed at day_rate_usd/day.
export function estimateCleaning(
  plant: { capacity_mw: string | number },
  crew: { mw_per_day: string | number; day_rate_usd: string | number },
): CleaningEstimate | null {
  const capacity = toNumber(plant.capacity_mw)
  const throughput = toNumber(crew.mw_per_day)
  const dayRate = toNumber(crew.day_rate_usd)
  if (capacity === null || throughput === null || dayRate === null || throughput <= 0) {
    return null
  }

  const days = Math.max(1, Math.ceil(capacity / throughput))
  return { days, cost: days * dayRate }
}
