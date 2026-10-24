import { CheckIcon, ChevronDownIcon, FilePlusIcon, SaveIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatMoney, formatPercent } from '@/lib/format'
import { useAppStore } from '@/store/useAppStore'
import { ExtrasSection, LaborSection, PricingSection, PrintSection } from './sections'
import { SummaryCard } from './SummaryCard'
import { useBreakdown } from './useBreakdown'

function sameContent(a: object, b: object) {
  const strip = ({ updatedAt: _u, ...rest }: { updatedAt?: string }) => rest
  return JSON.stringify(strip(a)) === JSON.stringify(strip(b))
}

export function CalculatorPage() {
  const draft = useAppStore((s) => s.draft)
  const stored = useAppStore((s) => s.quotes.find((q) => q.id === s.draft.id))
  const updateDraft = useAppStore((s) => s.updateDraft)
  const saveDraft = useAppStore((s) => s.saveDraft)
  const saveDraftAsNew = useAppStore((s) => s.saveDraftAsNew)
  const newDraft = useAppStore((s) => s.newDraft)
  const [justSaved, setJustSaved] = useState(false)

  useEffect(() => {
    if (!justSaved) return
    const t = setTimeout(() => setJustSaved(false), 1500)
    return () => clearTimeout(t)
  }, [justSaved])

  const dirty = stored ? !sameContent(stored, draft) : false
  const name = draft.name.trim() || 'Untitled quote'

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="flex min-w-0 flex-col gap-4">
        <Card className="p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              value={draft.name}
              onChange={(e) => updateDraft({ name: e.target.value })}
              placeholder="What are you printing? e.g. Dragon keychain"
              className="h-10 text-base font-medium"
              aria-label="Quote name"
            />
            <Input value={draft.client} onChange={(e) => updateDraft({ client: e.target.value })} placeholder="Client (optional)" className="h-10" aria-label="Client" />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              onClick={() => {
                saveDraft(name)
                setJustSaved(true)
              }}
            >
              {justSaved ? <CheckIcon /> : <SaveIcon />}
              {justSaved ? 'Saved' : stored ? 'Save changes' : 'Save quote'}
            </Button>
            {stored && (
              <Button
                variant="outline"
                onClick={() => {
                  saveDraftAsNew(name)
                  setJustSaved(true)
                }}
              >
                Save as new
              </Button>
            )}
            <Button variant="ghost" onClick={newDraft}>
              <FilePlusIcon /> New quote
            </Button>
            <span className="ml-auto text-xs text-muted-foreground">
              {stored ? (dirty ? 'Unsaved changes' : 'All changes saved') : 'Not saved yet'}
            </span>
          </div>
        </Card>
        <PrintSection />
        <LaborSection />
        <ExtrasSection />
        <PricingSection />
      </div>
      <aside id="summary" className="scroll-mt-20 pb-20 lg:sticky lg:top-20 lg:pb-0">
        <SummaryCard />
      </aside>
      <MobilePriceBar />
    </div>
  )
}

/** On small screens the summary sits below the form, so keep the price visible. */
function MobilePriceBar() {
  const { unit, marginPercent, quantity, total } = useBreakdown()
  return (
    <button
      type="button"
      onClick={() => document.getElementById('summary')?.scrollIntoView({ behavior: 'smooth' })}
      className="fixed inset-x-0 bottom-0 z-30 flex cursor-pointer items-center gap-3 border-t bg-card/95 px-4 py-3 text-left shadow-[0_-4px_16px_rgb(0_0_0/0.06)] backdrop-blur lg:hidden"
    >
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">Price per unit{quantity > 1 && ` · ${formatMoney(total)} total`}</p>
        <p className="text-xl font-bold tabular-nums">{formatMoney(unit.price)}</p>
      </div>
      <div className="text-right text-xs">
        <p className="text-muted-foreground">Margin</p>
        <p className="font-semibold tabular-nums">{formatPercent(marginPercent)}</p>
      </div>
      <ChevronDownIcon className="size-5 text-muted-foreground" />
    </button>
  )
}
