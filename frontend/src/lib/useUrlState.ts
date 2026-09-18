import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

// List state lives in the URL so paging and filters survive refresh, back/forward and sharing.
export function useUrlState() {
  const [searchParams, setSearchParams] = useSearchParams()

  const setValues = useCallback(
    (values: Record<string, string | null>) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          for (const [key, value] of Object.entries(values)) {
            if (value === null) next.delete(key)
            else next.set(key, value)
          }
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const getPage = (key: string) => {
    const parsed = Number(searchParams.get(key))
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
  }

  // Flags default to on, so "mine" is the opt-out rather than the opt-in.
  const getFlag = (key: string) => searchParams.get(key) !== '0'

  return { getPage, getFlag, setValues }
}
