// DRF serializes DecimalField as a string, so every numeric formatter normalizes first.
export type Numeric = string | number | null | undefined

export function toNumber(value: Numeric): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const PLACEHOLDER = '—'

export function formatNumber(value: Numeric, fractionDigits = 2) {
  const parsed = toNumber(value)
  if (parsed === null) return PLACEHOLDER
  return parsed.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

export function formatCurrency(value: Numeric, fractionDigits = 2) {
  const parsed = toNumber(value)
  if (parsed === null) return PLACEHOLDER
  return parsed.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

export function formatPercent(value: Numeric, fractionDigits = 1) {
  const parsed = toNumber(value)
  if (parsed === null) return PLACEHOLDER
  return `${parsed.toFixed(fractionDigits)}%`
}

// Performance ratio arrives as a fraction (actual / expected), not a percentage.
export function formatRatio(value: Numeric, fractionDigits = 1) {
  const parsed = toNumber(value)
  if (parsed === null) return PLACEHOLDER
  return `${(parsed * 100).toFixed(fractionDigits)}%`
}

export function formatDate(value: string | null | undefined) {
  if (!value) return PLACEHOLDER
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return PLACEHOLDER
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return PLACEHOLDER
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return PLACEHOLDER
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDaysUntilReset(value: number | null | undefined) {
  return typeof value === 'number' ? `${value}d` : PLACEHOLDER
}

export function isResetUrgent(value: number | null | undefined) {
  return typeof value === 'number' && value <= 7
}

// Crews have no name column in the API, so IDs carry their labelling.
// Plants do have a name; accept either the full record or a bare id (e.g. before it has loaded)
// and fall back to "Plant <id>" if the name is missing or blank.
export function plantLabel(plant: { id: number; name?: string | null } | number) {
  if (typeof plant === 'number') return `Plant ${plant}`
  return plant.name?.trim() || `Plant ${plant.id}`
}

export function crewLabel(id: number) {
  return `Crew ${id}`
}
