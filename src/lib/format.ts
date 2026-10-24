const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
const percent = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 })
const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 })

export function formatMoney(value: number): string {
  return Number.isFinite(value) ? money.format(value) : '—'
}

export function formatPercent(value: number): string {
  return Number.isFinite(value) ? `${percent.format(value)}%` : '—'
}

export function formatNumber(value: number): string {
  return Number.isFinite(value) ? number.format(value) : '—'
}

export function formatMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
  const m = Math.round(totalMinutes % 60)
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
