import type { ReactNode } from 'react'

import { EmptyState, ErrorState } from './States'
import { TBody, THead, Table, TableMessage, TableSkeleton, Td, Th, Tr } from './Table'

export interface Column<T> {
  key: string
  header: string
  align?: 'left' | 'right' | 'center'
  render: (row: T) => ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[] | undefined
  rowKey: (row: T) => string | number
  onRowClick?: (row: T) => void
  isLoading: boolean
  isError?: boolean
  onRetry?: () => void
  emptyTitle: string
  emptyDescription?: string
}

// One table body for every list in the app: skeleton, error and empty states included.
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  isLoading,
  isError,
  onRetry,
  emptyTitle,
  emptyDescription,
}: DataTableProps<T>) {
  const body = () => {
    if (isLoading) return <TableSkeleton columns={columns.length} />
    if (isError)
      return (
        <TableMessage columns={columns.length}>
          <ErrorState description="The request failed. Check the API is running." onRetry={onRetry} />
        </TableMessage>
      )
    if (!rows?.length)
      return (
        <TableMessage columns={columns.length}>
          <EmptyState title={emptyTitle} description={emptyDescription} />
        </TableMessage>
      )

    return (
      <TBody>
        {rows.map((row) => (
          <Tr key={rowKey(row)} onActivate={onRowClick ? () => onRowClick(row) : undefined}>
            {columns.map((column) => (
              <Td key={column.key} align={column.align}>
                {column.render(row)}
              </Td>
            ))}
          </Tr>
        ))}
      </TBody>
    )
  }

  return (
    <Table>
      <THead>
        <tr>
          {columns.map((column) => (
            <Th key={column.key} align={column.align}>
              {column.header}
            </Th>
          ))}
        </tr>
      </THead>
      {body()}
    </Table>
  )
}
