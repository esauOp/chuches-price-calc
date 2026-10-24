import { AlertTriangleIcon, CheckIcon, CircleXIcon, ClipboardCopyIcon, InfoIcon } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { InfoTip } from '@/components/ui/tooltip'
import type { Breakdown } from '@/domain/types'
import { formatMinutes, formatMoney, formatNumber, formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { BreakdownChart } from './BreakdownChart'
import { priceSlices } from './slices'
import { useBreakdown } from './useBreakdown'

function summaryText(name: string, client: string, b: Breakdown): string {
  const lines = [
    name ? `Quote: ${name}` : 'Quote',
    client ? `Client: ${client}` : '',
    `Quantity: ${b.quantity}`,
    `Price per unit: ${formatMoney(b.unit.price)}`,
    b.discountPercent > 0 ? `Volume discount applied: ${b.discountPercent}%` : '',
    b.quantity > 1 ? `Total: ${formatMoney(b.total)}` : '',
    b.unit.iva > 0 ? 'IVA included' : '',
  ]
  return lines.filter(Boolean).join('\n')
}

const warningStyles = {
  error: { icon: CircleXIcon, className: 'border-destructive/30 bg-destructive/8 text-destructive' },
  warning: { icon: AlertTriangleIcon, className: 'border-warning/40 bg-warning/10' },
  info: { icon: InfoIcon, className: 'bg-muted text-muted-foreground' },
}

export function SummaryCard() {
  const b = useBreakdown()
  const name = useAppStore((s) => s.draft.name)
  const client = useAppStore((s) => s.draft.client)
  const [copied, setCopied] = useState(false)
  const u = b.unit
  const slices = priceSlices(u)
  const valid = Number.isFinite(u.price)

  async function copy() {
    try {
      await navigator.clipboard.writeText(summaryText(name, client, b))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard blocked; nothing else to do
    }
  }

  const marginVariant = !valid || u.profit <= 0 ? 'destructive' : b.marginPercent < 20 ? 'warning' : 'success'

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-5">
        <p className="text-sm text-muted-foreground">Suggested price per unit</p>
        <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums">{formatMoney(u.price)}</p>
        {b.quantity > 1 && (
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            × {b.quantity} units = <span className="font-semibold text-foreground">{formatMoney(b.total)}</span>
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant={marginVariant}>Margin {formatPercent(b.marginPercent)}</Badge>
          <Badge variant="secondary">Profit {formatMoney(u.profit)}/u</Badge>
          {b.discountPercent > 0 && <Badge>−{b.discountPercent}% volume</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x border-y text-center">
        <Stat label="Cost / unit" value={formatMoney(u.cost)} />
        <Stat label="Print time" value={formatMinutes(b.printMinutesPerUnit)} />
        <Stat label="Filament" value={`${formatNumber(b.gramsPerUnit)} g`} />
      </div>

      {b.warnings.length > 0 && (
        <div className="flex flex-col gap-2 p-4 pb-0">
          {b.warnings.map((w, i) => {
            const style = warningStyles[w.level]
            const Icon = style.icon
            return (
              <div key={i} className={cn('flex items-start gap-2 rounded-lg border px-3 py-2 text-sm', style.className)}>
                <Icon className="mt-0.5 size-4 shrink-0" />
                {w.message}
              </div>
            )
          })}
        </div>
      )}

      {valid && (
        <div className="p-5">
          <BreakdownChart slices={slices} centerLabel="Profit" centerValue={formatMoney(u.profit)} />
          <table className="mt-5 w-full text-sm">
            <tbody>
              {slices
                .filter((s) => s.group === 'cost' && s.value > 0.005)
                .map((s) => (
                  <Row key={s.key} color={s.color} label={s.label} value={s.value} price={u.price} />
                ))}
              <tr className="border-t font-medium">
                <td className="py-1.5">Production cost</td>
                <td className="py-1.5 text-right tabular-nums">{formatMoney(u.cost)}</td>
                <td />
              </tr>
              <tr>
                <td className="py-1.5 text-muted-foreground">Markup</td>
                <td className="py-1.5 text-right tabular-nums">{formatMoney(u.basePrice - u.cost)}</td>
                <td />
              </tr>
              {u.discount > 0 && <Plain label={`Volume discount (${b.discountPercent}%)`} value={-u.discount} />}
              {u.shipping > 0 && <Row color="#14b8a6" label="Shipping" value={u.shipping} price={u.price} />}
              {u.platformFee > 0 && <Row color="#64748b" label="Platform fees" value={u.platformFee} price={u.price} />}
              {u.iva > 0 && <Row color="#475569" label="IVA" value={u.iva} price={u.price} />}
              {u.rounding > 0.005 && <Plain label="Rounding" value={u.rounding} hint="Extra from rounding the price up; it becomes profit." />}
              <tr className="border-t text-base font-semibold">
                <td className="pt-2">Price</td>
                <td className="pt-2 text-right tabular-nums">{formatMoney(u.price)}</td>
                <td />
              </tr>
              <tr className="text-success">
                <td className="py-1 flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-[#16a34a]" />
                  Your profit
                </td>
                <td className="py-1 text-right font-semibold tabular-nums">{formatMoney(u.profit)}</td>
                <td className="w-12 py-1 text-right text-xs tabular-nums">{formatPercent((u.profit / u.price) * 100)}</td>
              </tr>
              {b.quantity > 1 && (
                <tr className="text-muted-foreground">
                  <td className="py-1">Profit for the order</td>
                  <td className="py-1 text-right tabular-nums">{formatMoney(b.totalProfit)}</td>
                  <td />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="border-t p-4">
        <Button variant="outline" className="w-full" onClick={copy} disabled={!valid}>
          {copied ? <CheckIcon /> : <ClipboardCopyIcon />}
          {copied ? 'Copied!' : 'Copy quote for customer'}
        </Button>
      </div>
    </Card>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function Row({ color, label, value, price }: { color: string; label: string; value: number; price: number }) {
  return (
    <tr>
      <td className="py-1.5">
        <span className="flex items-center gap-2">
          <span className="size-2.5 shrink-0 rounded-full" style={{ background: color }} />
          {label}
        </span>
      </td>
      <td className="py-1.5 text-right tabular-nums">{formatMoney(value)}</td>
      <td className="w-12 py-1.5 text-right text-xs text-muted-foreground tabular-nums">{price > 0 ? formatPercent((value / price) * 100) : ''}</td>
    </tr>
  )
}

function Plain({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <tr>
      <td className="py-1.5 text-muted-foreground">
        <span className="flex items-center gap-1.5">
          {label}
          {hint && <InfoTip>{hint}</InfoTip>}
        </span>
      </td>
      <td className="py-1.5 text-right tabular-nums">{formatMoney(value)}</td>
      <td />
    </tr>
  )
}
