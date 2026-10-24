import { CopyIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { DurationInput, Field, NumberInput } from '@/components/fields'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Tooltip } from '@/components/ui/tooltip'
import type { Plate, PlateMaterial } from '@/domain/types'
import { formatMoney } from '@/lib/format'
import { uid } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'

export function PlateEditor({
  plate,
  index,
  canRemove,
  onChange,
  onRemove,
  onDuplicate,
}: {
  plate: Plate
  index: number
  canRemove: boolean
  onChange: (plate: Plate) => void
  onRemove: () => void
  onDuplicate: () => void
}) {
  const printers = useAppStore((s) => s.printers)
  const materials = useAppStore((s) => s.materials)
  const defaultMaterialId = useAppStore((s) => s.settings.defaultMaterialId)

  const patch = (p: Partial<Plate>) => onChange({ ...plate, ...p })
  const patchLine = (id: string, p: Partial<PlateMaterial>) =>
    patch({ materials: plate.materials.map((l) => (l.id === id ? { ...l, ...p } : l)) })

  const materialOptions = materials.map((m) => ({
    value: m.id,
    label: (
      <span className="flex min-w-0 items-center gap-2">
        <span className="size-3 shrink-0 rounded-full border border-black/10" style={{ background: m.color }} />
        <span className="truncate">{m.name}</span>
        <span className="hidden text-xs text-muted-foreground sm:inline">{formatMoney(m.spoolWeightGrams > 0 ? (m.spoolPrice / m.spoolWeightGrams) * 1000 : 0)}/kg</span>
      </span>
    ),
  }))

  return (
    <div className="rounded-xl border bg-background/60 p-4">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold">{index + 1}</span>
        <Input
          value={plate.name}
          onChange={(e) => patch({ name: e.target.value })}
          className="h-8 max-w-56 border-transparent bg-transparent px-1.5 font-medium shadow-none hover:border-input"
          aria-label="Plate name"
        />
        <div className="ml-auto flex gap-1">
          <Tooltip content="Duplicate plate">
            <Button variant="ghost" size="icon-sm" onClick={onDuplicate} aria-label="Duplicate plate">
              <CopyIcon />
            </Button>
          </Tooltip>
          {canRemove && (
            <Tooltip content="Remove plate">
              <Button variant="ghost" size="icon-sm" onClick={onRemove} aria-label="Remove plate">
                <Trash2Icon />
              </Button>
            </Tooltip>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Printer">
          <Select
            value={plate.printerId}
            onValueChange={(printerId) => patch({ printerId })}
            placeholder="Choose a printer"
            options={printers.map((p) => ({ value: p.id, label: p.name }))}
          />
        </Field>
        <Field label="Print time" hint="Estimated time from your slicer (Bambu Studio, Orca, Cura, PrusaSlicer).">
          <DurationInput minutes={plate.minutes} onChange={(minutes) => patch({ minutes })} />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Filament used" hint="Grams per material from your slicer. Multi-color / AMS prints: add one line per filament.">
          <div className="flex flex-col gap-2">
            {plate.materials.map((line) => (
              <div key={line.id} className="flex items-center gap-2">
                <Select
                  className="flex-1"
                  value={line.materialId}
                  onValueChange={(materialId) => patchLine(line.id, { materialId })}
                  placeholder="Choose a material"
                  options={materialOptions}
                />
                <NumberInput
                  className="w-28 shrink-0"
                  value={line.grams}
                  step={0.1}
                  suffix="g"
                  aria-label="Grams"
                  onChange={(grams) => patchLine(line.id, { grams })}
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={plate.materials.length === 1}
                  onClick={() => patch({ materials: plate.materials.filter((l) => l.id !== line.id) })}
                  aria-label="Remove material"
                >
                  <Trash2Icon />
                </Button>
              </div>
            ))}
          </div>
        </Field>
        <Button
          variant="link"
          size="sm"
          className="mt-1 px-0"
          onClick={() => patch({ materials: [...plate.materials, { id: uid(), materialId: defaultMaterialId, grams: 0 }] })}
        >
          <PlusIcon /> Add filament
        </Button>
      </div>
    </div>
  )
}
