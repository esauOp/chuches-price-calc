import type { UnitBreakdown } from '@/domain/types'

export interface BreakdownSlice {
  key: string
  label: string
  value: number
  color: string
  group: 'cost' | 'profit' | 'passthrough'
}

/** How the final unit price splits up. Slices sum to the price (minus any discount, already netted out). */
export function priceSlices(u: UnitBreakdown): BreakdownSlice[] {
  return [
    { key: 'material', label: 'Filament', value: u.material, color: '#f97316', group: 'cost' },
    { key: 'electricity', label: 'Electricity', value: u.electricity, color: '#eab308', group: 'cost' },
    { key: 'machine', label: 'Machine wear', value: u.machine, color: '#a16207', group: 'cost' },
    { key: 'failure', label: 'Failure allowance', value: u.failure, color: '#ef4444', group: 'cost' },
    { key: 'labor', label: 'Labor', value: u.labor, color: '#3b82f6', group: 'cost' },
    { key: 'design', label: 'Design', value: u.design, color: '#6366f1', group: 'cost' },
    { key: 'hardware', label: 'Hardware', value: u.hardware, color: '#8b5cf6', group: 'cost' },
    { key: 'packaging', label: 'Packaging', value: u.packaging, color: '#ec4899', group: 'cost' },
    { key: 'overhead', label: 'Overhead', value: u.overhead, color: '#94a3b8', group: 'cost' },
    { key: 'profit', label: 'Profit', value: Math.max(0, u.profit), color: '#16a34a', group: 'profit' },
    { key: 'shipping', label: 'Shipping', value: u.shipping, color: '#14b8a6', group: 'passthrough' },
    { key: 'fees', label: 'Platform fees', value: u.platformFee, color: '#64748b', group: 'passthrough' },
    { key: 'iva', label: 'IVA', value: u.iva, color: '#475569', group: 'passthrough' },
  ]
}
