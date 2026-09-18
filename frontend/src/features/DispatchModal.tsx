import { useCreateAssignment } from '../api/queries'
import type { PlantAnalytics } from '../api/types'
import { estimateCleaning } from '../lib/estimate'
import { crewLabel, formatCurrency, plantLabel } from '../lib/format'
import { Button, Modal } from '../ui'

interface DispatchModalProps {
  open: boolean
  onClose: () => void
  entry: PlantAnalytics | null
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10)
}

// A wrapper that gates on `open`: mounting/unmounting DispatchConfirm on every open
// resets the mutation state for free, same trick as AssignmentModal.
export function DispatchModal({ open, onClose, entry }: DispatchModalProps) {
  const crew = entry?.recommend_crew ?? null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Dispatch crew"
      description={
        entry && crew
          ? `By clicking this you will dispatch ${crewLabel(crew.id)} to ${plantLabel(entry.plant)}. Are you sure?`
          : undefined
      }
    >
      {open && entry && crew ? (
        <DispatchConfirm entry={entry} crewId={crew.id} onClose={onClose} />
      ) : null}
    </Modal>
  )
}

function DispatchConfirm({
  entry,
  crewId,
  onClose,
}: {
  entry: PlantAnalytics
  crewId: number
  onClose: () => void
}) {
  const crew = entry.recommend_crew
  const estimate = crew ? estimateCleaning(entry.plant, crew) : null
  const createAssignment = useCreateAssignment()

  function handleConfirm() {
    if (!estimate) return
    createAssignment.mutate(
      {
        plant: entry.plant.id,
        crew: crewId,
        date: `${todayInputValue()}T00:00:00Z`,
        estimate_days: estimate.days,
        estimate_cost: estimate.cost.toFixed(2),
      },
      { onSuccess: () => onClose() },
    )
  }

  return (
    <div className="space-y-4">
      {estimate ? (
        <div className="rounded-lg bg-muted/50 p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Estimated duration</span>
            <span className="font-medium text-foreground">
              {estimate.days} day{estimate.days === 1 ? '' : 's'}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-muted-foreground">Estimated cost</span>
            <span className="font-medium text-foreground">{formatCurrency(estimate.cost)}</span>
          </div>
        </div>
      ) : null}

      {createAssignment.isError ? (
        <p className="text-sm text-destructive">{createAssignment.error.message}</p>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleConfirm}
          loading={createAssignment.isPending}
          disabled={!estimate}
        >
          Yes, dispatch
        </Button>
      </div>
    </div>
  )
}
