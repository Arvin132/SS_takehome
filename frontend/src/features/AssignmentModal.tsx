import { useMemo, useState, type FormEvent } from 'react'

import { useCreateAssignment, useCrewPlants, usePlantCrews } from '../api/queries'
import type { Crew, Plant } from '../api/types'
import { estimateCleaning } from '../lib/estimate'
import { crewLabel, formatCurrency, plantLabel } from '../lib/format'
import { Button, Input, Modal, Select } from '../ui'

export type AssignmentSubject =
  | { type: 'plant'; plant: Plant }
  | { type: 'crew'; crew: Crew }

interface AssignmentModalProps {
  open: boolean
  onClose: () => void
  subject: AssignmentSubject
}

const OPTIONS_PAGE = { page: 1, page_size: 100 }

function todayInputValue() {
  return new Date().toISOString().slice(0, 10)
}

// A wrapper that gates on `open`: mounting/unmounting AssignmentForm on every open
// resets its local state for free, no effect needed to clear a stale selection.
export function AssignmentModal({ open, onClose, subject }: AssignmentModalProps) {
  const isPlantSubject = subject.type === 'plant'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isPlantSubject ? 'Assign crew' : 'Assign to plant'}
      description={
        isPlantSubject
          ? `Schedule a crew to clean ${plantLabel(subject.plant)}.`
          : `Schedule ${crewLabel(subject.crew.id)} to clean a plant.`
      }
    >
      {open ? <AssignmentForm subject={subject} onClose={onClose} /> : null}
    </Modal>
  )
}

function AssignmentForm({
  subject,
  onClose,
}: {
  subject: AssignmentSubject
  onClose: () => void
}) {
  const isPlantSubject = subject.type === 'plant'
  const [otherId, setOtherId] = useState('')
  const [date, setDate] = useState(todayInputValue)

  const crewOptions = usePlantCrews(
    isPlantSubject ? subject.plant.id : 0,
    OPTIONS_PAGE,
    isPlantSubject,
  )
  const plantOptions = useCrewPlants(
    !isPlantSubject ? subject.crew.id : 0,
    OPTIONS_PAGE,
    !isPlantSubject,
  )

  const plant = isPlantSubject
    ? subject.plant
    : plantOptions.data?.results.find((candidate) => candidate.id === Number(otherId))
  const crew = isPlantSubject
    ? crewOptions.data?.results.find((candidate) => candidate.id === Number(otherId))
    : subject.crew

  const estimate = useMemo(() => {
    if (!plant || !crew) return null
    return estimateCleaning(plant, crew)
  }, [plant, crew])

  const createAssignment = useCreateAssignment()

  const optionsLoading = isPlantSubject ? crewOptions.isLoading : plantOptions.isLoading
  const options = isPlantSubject
    ? (crewOptions.data?.results ?? []).map((option) => ({
        value: String(option.id),
        label: crewLabel(option.id),
      }))
    : (plantOptions.data?.results ?? []).map((option) => ({
        value: String(option.id),
        label: plantLabel(option),
      }))
  const noOptions = !optionsLoading && options.length === 0

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!plant || !crew || !estimate) return

    createAssignment.mutate(
      {
        plant: plant.id,
        crew: crew.id,
        date: `${date}T00:00:00Z`,
        estimate_days: estimate.days,
        estimate_cost: estimate.cost.toFixed(2),
      },
      { onSuccess: () => onClose() },
    )
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-foreground">
          {isPlantSubject ? 'Crew' : 'Plant'}
        </label>
        <Select
          className="w-full"
          value={otherId}
          onChange={(event) => setOtherId(event.target.value)}
          disabled={optionsLoading || noOptions}
          options={[
            {
              value: '',
              label: optionsLoading
                ? 'Loading…'
                : noOptions
                  ? isPlantSubject
                    ? 'No crews service this plant'
                    : 'No plants for this crew'
                  : isPlantSubject
                    ? 'Select a crew'
                    : 'Select a plant',
            },
            ...options,
          ]}
        />
      </div>

      <Input
        label="Date"
        type="date"
        value={date}
        onChange={(event) => setDate(event.target.value)}
        required
      />

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

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={!estimate} loading={createAssignment.isPending}>
          Confirm assignment
        </Button>
      </div>
    </form>
  )
}
