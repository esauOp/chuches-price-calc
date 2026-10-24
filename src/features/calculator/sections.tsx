import { BoxIcon, HandIcon, PlusIcon, PrinterIcon, TagIcon, Trash2Icon } from 'lucide-react'
import { DurationInput, Field, NumberField, NumberInput } from '@/components/fields'
import { Section } from '@/components/Section'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { InfoTip } from '@/components/ui/tooltip'
import type { HardwareLine, Plate } from '@/domain/types'
import { formatMinutes, formatMoney, formatNumber } from '@/lib/format'
import { cn, uid } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { PlateEditor } from './PlateEditor'
import { useBreakdown } from './useBreakdown'

export function PrintSection() {
  const plates = useAppStore((s) => s.draft.plates)
  const updateDraft = useAppStore((s) => s.updateDraft)
  const settings = useAppStore((s) => s.settings)
  const { printMinutesPerUnit, gramsPerUnit } = useBreakdown()

  const setPlates = (next: Plate[]) => updateDraft({ plates: next })

  return (
    <Section
      step={1}
      icon={PrinterIcon}
      title="Print"
      summary={`${formatMinutes(printMinutesPerUnit)} · ${formatNumber(gramsPerUnit)} g`}
    >
      <p className="mb-4 text-sm text-muted-foreground">
        Enter what it takes to print <strong className="text-foreground">one unit</strong>. If the part needs several build plates, add one plate each.
      </p>
      <div className="flex flex-col gap-3">
        {plates.map((plate, i) => (
          <PlateEditor
            key={plate.id}
            plate={plate}
            index={i}
            canRemove={plates.length > 1}
            onChange={(p) => setPlates(plates.map((x) => (x.id === p.id ? p : x)))}
            onRemove={() => setPlates(plates.filter((x) => x.id !== plate.id))}
            onDuplicate={() =>
              setPlates([
                ...plates,
                { ...plate, id: uid(), name: `Plate ${plates.length + 1}`, materials: plate.materials.map((m) => ({ ...m, id: uid() })) },
              ])
            }
          />
        ))}
      </div>
      <Button
        variant="outline"
        className="mt-3 w-full border-dashed"
        onClick={() =>
          setPlates([
            ...plates,
            {
              id: uid(),
              name: `Plate ${plates.length + 1}`,
              printerId: settings.defaultPrinterId,
              minutes: 60,
              materials: [{ id: uid(), materialId: settings.defaultMaterialId, grams: 0 }],
            },
          ])
        }
      >
        <PlusIcon /> Add plate
      </Button>
    </Section>
  )
}

export function LaborSection() {
  const draft = useAppStore((s) => s.draft)
  const updateDraft = useAppStore((s) => s.updateDraft)
  const laborRate = useAppStore((s) => s.settings.laborRate)
  const { unit } = useBreakdown()

  return (
    <Section step={2} icon={HandIcon} title="Labor & risk" summary={formatMoney(unit.labor + unit.design + unit.failure)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Setup per order"
          hint="One-time work for the whole order: slicing, preparing the bed, loading filament. Split across all units."
        >
          <DurationInput minutes={draft.setupMinutes} onChange={(setupMinutes) => updateDraft({ setupMinutes })} />
        </Field>
        <Field label="Post-processing per unit" hint="Removing supports, sanding, painting, assembly, quality check — for each unit.">
          <DurationInput minutes={draft.postMinutes} onChange={(postMinutes) => updateDraft({ postMinutes })} />
        </Field>
        <NumberField
          label="Design / modeling fee"
          hint="One-time fee for custom modeling, split across all units. Leave 0 for existing designs."
          prefix="$"
          value={draft.designFee}
          onChange={(designFee) => updateDraft({ designFee })}
        />
        <NumberField
          label="Failure rate"
          hint="Share of prints that fail and must be reprinted. Adds that share of material, electricity and machine cost."
          suffix="%"
          max={100}
          value={draft.failurePercent}
          onChange={(failurePercent) => updateDraft({ failurePercent })}
        />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Labor rate: {formatMoney(laborRate)}/h — change it in Settings.</p>
    </Section>
  )
}

export function ExtrasSection() {
  const draft = useAppStore((s) => s.draft)
  const updateDraft = useAppStore((s) => s.updateDraft)
  const catalog = useAppStore((s) => s.hardwareItems)
  const packaging = useAppStore((s) => s.packaging)
  const { unit } = useBreakdown()

  const setHardware = (hardware: HardwareLine[]) => updateDraft({ hardware })
  const patchLine = (id: string, p: Partial<HardwareLine>) => setHardware(draft.hardware.map((h) => (h.id === id ? { ...h, ...p } : h)))

  return (
    <Section step={3} icon={BoxIcon} title="Hardware & packaging" summary={formatMoney(unit.hardware + unit.packaging)}>
      <Field label="Additional hardware per unit" hint="Magnets, inserts, screws, keyrings, LEDs… anything you add to each unit.">
        {draft.hardware.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hardware added.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {draft.hardware.map((h) => (
              <div key={h.id} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2">
                <Input value={h.name} placeholder="Item" onChange={(e) => patchLine(h.id, { name: e.target.value })} aria-label="Item name" />
                <NumberInput className="w-20" value={h.qty} integer suffix="×" aria-label="Quantity" onChange={(qty) => patchLine(h.id, { qty })} />
                <NumberInput className="w-28" value={h.unitCost} step={0.5} prefix="$" aria-label="Unit cost" onChange={(unitCost) => patchLine(h.id, { unitCost })} />
                <Button variant="ghost" size="icon-sm" onClick={() => setHardware(draft.hardware.filter((x) => x.id !== h.id))} aria-label="Remove item">
                  <Trash2Icon />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Field>
      <div className="mt-3 flex flex-wrap gap-2">
        {catalog.map((item) => (
          <Button
            key={item.id}
            variant="secondary"
            size="sm"
            onClick={() => setHardware([...draft.hardware, { id: uid(), name: item.name, qty: 1, unitCost: item.unitCost }])}
          >
            <PlusIcon /> {item.name}
          </Button>
        ))}
        <Button variant="outline" size="sm" onClick={() => setHardware([...draft.hardware, { id: uid(), name: '', qty: 1, unitCost: 0 }])}>
          <PlusIcon /> Custom item
        </Button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Packaging per unit">
          <Select
            value={draft.packagingId}
            onValueChange={(packagingId) => updateDraft({ packagingId })}
            options={[{ value: '', label: 'No packaging' }, ...packaging.map((p) => ({ value: p.id, label: `${p.name} — ${formatMoney(p.cost)}` }))]}
          />
        </Field>
        <NumberField
          label="Shipping per order"
          hint="Charged to the customer at cost (no markup). Split across all units; platform fees and tax still apply."
          prefix="$"
          value={draft.shippingCost}
          onChange={(shippingCost) => updateDraft({ shippingCost })}
        />
      </div>
    </Section>
  )
}

const MARKUP_PRESETS = [30, 50, 100, 150, 200]

export function PricingSection() {
  const draft = useAppStore((s) => s.draft)
  const updateDraft = useAppStore((s) => s.updateDraft)
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const { discountPercent } = useBreakdown()

  const tiers = draft.discountTiers

  return (
    <Section step={4} icon={TagIcon} title="Pricing">
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          label="Quantity"
          hint="Units in this order. Setup, design fee, shipping and fixed platform fees are split across them."
          integer
          min={1}
          value={draft.quantity}
          onChange={(quantity) => updateDraft({ quantity })}
        />
        <Field label="Sales channel" hint="Platform commission is built into the price so you keep your profit. Edit channels in Settings.">
          <Select
            value={draft.platformId}
            onValueChange={(platformId) => updateDraft({ platformId })}
            options={settings.platforms.map((p) => ({
              value: p.id,
              label: `${p.name}${p.feePercent || p.fixedFee ? ` — ${p.feePercent}%${p.fixedFee ? ` + ${formatMoney(p.fixedFee)}` : ''}` : ''}`,
            }))}
          />
        </Field>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <Label className="text-muted-foreground">
            Markup over cost
            <InfoTip>100% markup = price is 2× cost (50% margin). Markup is not the same as margin.</InfoTip>
          </Label>
          <NumberInput className="w-28" value={draft.markupPercent} max={1000} suffix="%" aria-label="Markup" onChange={(markupPercent) => updateDraft({ markupPercent })} />
        </div>
        <Slider value={[Math.min(draft.markupPercent, 300)]} max={300} step={5} onValueChange={([v]) => updateDraft({ markupPercent: v })} />
        <div className="mt-3 flex flex-wrap gap-2">
          {MARKUP_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => updateDraft({ markupPercent: p })}
              className={cn(
                'cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:bg-accent',
                draft.markupPercent === p && 'border-primary bg-primary/10 text-primary',
              )}
            >
              {p}%
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Add IVA ({settings.ivaPercent}%)</p>
            <p className="text-xs text-muted-foreground">Tax added on top of the price</p>
          </div>
          <Switch checked={draft.ivaEnabled} onCheckedChange={(ivaEnabled) => updateDraft({ ivaEnabled })} aria-label="Add IVA" />
        </div>
        <Field label="Round final price up to" hint="Always rounds up, so rounding only ever adds profit.">
          <Select
            value={settings.rounding}
            onValueChange={(v) => updateSettings({ rounding: v as typeof settings.rounding })}
            options={[
              { value: 'none', label: 'No rounding' },
              { value: '1', label: 'Whole peso' },
              { value: '5', label: 'Multiple of $5' },
              { value: '10', label: 'Multiple of $10' },
              { value: 'ending9', label: 'Ending in 9 (e.g. $149)' },
            ]}
          />
        </Field>
      </div>

      <div className="mt-5">
        <Field label="Quantity discounts" hint="Discount on the price (before fees and tax) once the order reaches a minimum quantity. The highest matching tier applies.">
          {tiers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No volume discounts.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {tiers.map((t) => (
                <div key={t.id} className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">From</span>
                  <NumberInput
                    className="w-24"
                    integer
                    min={1}
                    value={t.minQty}
                    suffix="pcs"
                    aria-label="Minimum quantity"
                    onChange={(minQty) => updateDraft({ discountTiers: tiers.map((x) => (x.id === t.id ? { ...x, minQty } : x)) })}
                  />
                  <span className="text-muted-foreground">get</span>
                  <NumberInput
                    className="w-24"
                    max={100}
                    value={t.discountPercent}
                    suffix="%"
                    aria-label="Discount"
                    onChange={(discountPercent) => updateDraft({ discountTiers: tiers.map((x) => (x.id === t.id ? { ...x, discountPercent } : x)) })}
                  />
                  <span className="text-muted-foreground">off</span>
                  {discountPercent === t.discountPercent && draft.quantity >= t.minQty && (
                    <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">active</span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="ml-auto"
                    onClick={() => updateDraft({ discountTiers: tiers.filter((x) => x.id !== t.id) })}
                    aria-label="Remove tier"
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Field>
        <Button
          variant="link"
          size="sm"
          className="mt-1 px-0"
          onClick={() => {
            const last = tiers.at(-1)
            updateDraft({
              discountTiers: [...tiers, { id: uid(), minQty: last ? last.minQty * 2 : 10, discountPercent: last ? last.discountPercent + 5 : 5 }],
            })
          }}
        >
          <PlusIcon /> Add discount tier
        </Button>
      </div>
    </Section>
  )
}
