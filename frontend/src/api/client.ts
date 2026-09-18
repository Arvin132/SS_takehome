const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '')

export class ApiError extends Error {
  status: number
  detail: string

  constructor(status: number, detail: string) {
    super(detail)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }

  get isUnauthorized() {
    return this.status === 401 || this.status === 403
  }
}

type Query = Record<string, string | number | boolean | undefined | null>

export function buildUrl(path: string, query?: Query) {
  const url = new URL(`${BASE_URL}/api${path}`)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

// DRF validation errors are {field: [messages]} (or non_field_errors for cross-field
// checks like a unique-together constraint) rather than a single detail string.
function firstDrfValidationMessage(body: unknown): string | undefined {
  if (typeof body !== 'object' || body === null) return undefined
  for (const value of Object.values(body as Record<string, unknown>)) {
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
  }
  return undefined
}

async function readError(response: Response) {
  try {
    const body = await response.json()
    return (
      body.detail ?? body.error ?? body.message ?? firstDrfValidationMessage(body) ?? JSON.stringify(body)
    )
  } catch {
    return response.statusText || 'Request failed'
  }
}

// The auth token lives in an httpOnly cookie, so every call must send credentials.
export async function apiFetch<T>(path: string, init?: RequestInit & { query?: Query }): Promise<T> {
  const { query, ...requestInit } = init ?? {}
  const response = await fetch(buildUrl(path, query), {
    ...requestInit,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(requestInit.headers ?? {}) },
  })

  if (!response.ok) {
    throw new ApiError(response.status, await readError(response))
  }
  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}
