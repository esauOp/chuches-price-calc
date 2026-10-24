import { CopyIcon, FolderOpenIcon, HistoryIcon, SearchIcon, Trash2Icon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EmptyState } from '@/components/Section'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Tooltip } from '@/components/ui/tooltip'
import { calculateQuote } from '@/domain/pricing'
import type { Quote } from '@/domain/types'
import { formatDate, formatMinutes, formatMoney } from '@/lib/format'
import { useAppStore } from '@/store/useAppStore'

export function QuotesPage({ onOpen }: { onOpen: () => void }) {
  const quotes = useAppStore((s) => s.quotes)
  const printers = useAppStore((s) => s.printers)
  const materials = useAppStore((s) => s.materials)
  const packaging = useAppStore((s) => s.packaging)
  const settings = useAppStore((s) => s.settings)
  const loadQuote = useAppStore((s) => s.loadQuote)
  const duplicateQuote = useAppStore((s) => s.duplicateQuote)
  const deleteQuote = useAppStore((s) => s.deleteQuote)
  const [query, setQuery] = useState('')
  const [toDelete, setToDelete] = useState<Quote | null>(null)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return quotes
      .filter((x) => !q || x.name.toLowerCase().includes(q) || x.client.toLowerCase().includes(q))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((quote) => ({ quote, breakdown: calculateQuote(quote, { printers, materials, packaging }, settings) }))
  }, [quotes, query, printers, materials, packaging, settings])

  if (quotes.length === 0) {
    return (
      <EmptyState icon={HistoryIcon} title="No saved quotes yet">
        Price something in the Calculator and hit <strong>Save quote</strong>.
      </EmptyState>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Saved quotes</h1>
          <p className="text-sm text-muted-foreground">Prices are recalculated with your current costs and settings.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or client" className="pl-9" />
        </div>
      </div>

      {rows.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No quotes match “{query}”.</p>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(({ quote, breakdown }) => (
          <Card key={quote.id} className="flex flex-col p-4 transition-shadow hover:shadow-md">
            <button
              type="button"
              className="flex-1 cursor-pointer text-left"
              onClick={() => {
                loadQuote(quote.id)
                onOpen()
              }}
            >
              <p className="truncate font-semibold">{quote.name || 'Untitled quote'}</p>
              <p className="truncate text-sm text-muted-foreground">{quote.client || 'No client'} · {formatDate(quote.updatedAt)}</p>
              <p className="mt-3 text-2xl font-bold tabular-nums">{formatMoney(breakdown.unit.price)}</p>
              <p className="text-sm text-muted-foreground tabular-nums">
                per unit · {breakdown.quantity} pcs{breakdown.quantity > 1 && ` · ${formatMoney(breakdown.total)} total`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {quote.plates.length} plate{quote.plates.length === 1 ? '' : 's'} · {formatMinutes(breakdown.printMinutesPerUnit)}
              </p>
            </button>
            <div className="mt-3 flex gap-1 border-t pt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  loadQuote(quote.id)
                  onOpen()
                }}
              >
                <FolderOpenIcon /> Open
              </Button>
              <Tooltip content="Duplicate">
                <Button variant="ghost" size="icon-sm" className="ml-auto" onClick={() => duplicateQuote(quote.id)} aria-label="Duplicate">
                  <CopyIcon />
                </Button>
              </Tooltip>
              <Tooltip content="Delete">
                <Button variant="ghost" size="icon-sm" onClick={() => setToDelete(quote)} aria-label="Delete">
                  <Trash2Icon />
                </Button>
              </Tooltip>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete quote?</DialogTitle>
            <DialogDescription>“{toDelete?.name || 'Untitled quote'}” will be removed permanently.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                if (toDelete) deleteQuote(toDelete.id)
                setToDelete(null)
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
