import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiFetch } from './client'
import type {
  Crew,
  CrewAssignment,
  FleetAnalytics,
  PageParams,
  Paginated,
  Plant,
  PlantDay,
  PlantDayAiSummary,
  User,
} from './types'

// "mine" hits the /mine/ variant of a list endpoint, "all" hits the unscoped one.
export type Scope = 'mine' | 'all'

export const queryKeys = {
  session: ['session'] as const,
  plants: (scope: Scope, page: number, pageSize: number) =>
    ['plants', scope, page, pageSize] as const,
  plant: (id: number) => ['plants', id] as const,
  plantDays: (id: number, page: number, pageSize: number) =>
    ['plants', id, 'days', page, pageSize] as const,
  plantCrews: (id: number, page: number, pageSize: number) =>
    ['plants', id, 'crews', page, pageSize] as const,
  crews: (scope: Scope, page: number, pageSize: number) =>
    ['crews', scope, page, pageSize] as const,
  crew: (id: number) => ['crews', id] as const,
  crewPlants: (id: number, page: number, pageSize: number) =>
    ['crews', id, 'plants', page, pageSize] as const,
  crewAssignments: (id: number, page: number, pageSize: number) =>
    ['crews', id, 'assignments', page, pageSize] as const,
  assignments: (scope: Scope, page: number, pageSize: number) =>
    ['assignments', scope, page, pageSize] as const,
  fleetAnalytics: ['analytics', 'mine'] as const,
  plantAiSummary: (plantId: number) => ['analytics', 'plants', plantId, 'ai-summary'] as const,
}

export const DEFAULT_PAGE_SIZE = 20

function pageQuery({ page, page_size = DEFAULT_PAGE_SIZE }: PageParams) {
  return { page, page_size }
}

function scopedPath(base: string, scope: Scope) {
  return scope === 'mine' ? `${base}mine/` : base
}

// GET on the login endpoint is the session probe: the cookie's user when it is valid, 401 when not.
export function useSession() {
  return useQuery({
    queryKey: queryKeys.session,
    queryFn: (): Promise<User | null> => apiFetch<User>('/auth/login/'),
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
}

export function usePlants(scope: Scope, params: PageParams) {
  return useQuery({
    queryKey: queryKeys.plants(scope, params.page, params.page_size ?? DEFAULT_PAGE_SIZE),
    queryFn: () =>
      apiFetch<Paginated<Plant>>(scopedPath('/plants/', scope), { query: pageQuery(params) }),
    placeholderData: keepPreviousData,
  })
}

export function usePlant(id: number) {
  return useQuery({
    queryKey: queryKeys.plant(id),
    queryFn: () => apiFetch<Plant>(`/plants/${id}/`),
  })
}

export function usePlantDays(id: number, params: PageParams) {
  return useQuery({
    queryKey: queryKeys.plantDays(id, params.page, params.page_size ?? DEFAULT_PAGE_SIZE),
    queryFn: () =>
      apiFetch<Paginated<PlantDay>>(`/plants/${id}/days/`, { query: pageQuery(params) }),
    placeholderData: keepPreviousData,
  })
}

export function usePlantCrews(id: number, params: PageParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.plantCrews(id, params.page, params.page_size ?? DEFAULT_PAGE_SIZE),
    queryFn: () => apiFetch<Paginated<Crew>>(`/plants/${id}/crews/`, { query: pageQuery(params) }),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useCrews(scope: Scope, params: PageParams) {
  return useQuery({
    queryKey: queryKeys.crews(scope, params.page, params.page_size ?? DEFAULT_PAGE_SIZE),
    queryFn: () =>
      apiFetch<Paginated<Crew>>(scopedPath('/crews/', scope), { query: pageQuery(params) }),
    placeholderData: keepPreviousData,
  })
}

export function useCrew(id: number) {
  return useQuery({
    queryKey: queryKeys.crew(id),
    queryFn: () => apiFetch<Crew>(`/crews/${id}/`),
  })
}

export function useCrewPlants(id: number, params: PageParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.crewPlants(id, params.page, params.page_size ?? DEFAULT_PAGE_SIZE),
    queryFn: () => apiFetch<Paginated<Plant>>(`/crews/${id}/plants/`, { query: pageQuery(params) }),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useCrewAssignments(id: number, params: PageParams) {
  return useQuery({
    queryKey: queryKeys.crewAssignments(id, params.page, params.page_size ?? DEFAULT_PAGE_SIZE),
    queryFn: () =>
      apiFetch<Paginated<CrewAssignment>>('/assignments/', {
        query: { ...pageQuery(params), crew_id: id },
      }),
    placeholderData: keepPreviousData,
  })
}

export function useAssignments(scope: Scope, params: PageParams) {
  return useQuery({
    queryKey: queryKeys.assignments(scope, params.page, params.page_size ?? DEFAULT_PAGE_SIZE),
    queryFn: () =>
      apiFetch<Paginated<CrewAssignment>>(scopedPath('/assignments/', scope), {
        query: pageQuery(params),
      }),
    placeholderData: keepPreviousData,
  })
}

export interface CreateAssignmentInput {
  crew: number
  plant: number
  date: string
  estimate_days: number
  estimate_cost: string
}

// Assignments feed the top-level tab, a crew's own list, a plant's crew list and the
// analytics "already dispatched" flag, so a successful create invalidates all four
// families rather than one query key.
export function useCreateAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateAssignmentInput) =>
      apiFetch<CrewAssignment>('/assignments/', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      queryClient.invalidateQueries({ queryKey: ['crews'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

const ANALYTICS_POLL_MS = 4000

// While any plant's report is still "computing", poll until the background worker
// finishes; once everything is ready, polling stops on its own.
export function useFleetAnalytics() {
  return useQuery({
    queryKey: queryKeys.fleetAnalytics,
    queryFn: () => apiFetch<FleetAnalytics>('/analytics/mine/'),
    refetchInterval: (query) =>
      query.state.data?.results?.some((result) => result.status === 'computing')
        ? ANALYTICS_POLL_MS
        : false,
  })
}

// One-and-done: no polling here on purpose, the user re-checks by refreshing or
// re-opening the plant page once the background worker has had time to run.
export function usePlantAiSummary(plantId: number) {
  return useQuery({
    queryKey: queryKeys.plantAiSummary(plantId),
    queryFn: () => apiFetch<PlantDayAiSummary>(`/analytics/plants/${plantId}/ai-summary/`),
  })
}

export function useGenerateAiSummary(plantId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      apiFetch<PlantDayAiSummary>(`/analytics/plants/${plantId}/ai-summary/`, { method: 'POST' }),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.plantAiSummary(plantId), data)
    },
  })
}
