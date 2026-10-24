import { describe, expect, it } from 'vitest'
import { applyRounding, calculateQuote, discountFor } from './pricing'
import type { Profiles, Quote, Settings } from './types'

const profiles: Profiles = {
  printers: [{ id: 'pr', name: 'Printer', purchasePrice: 10000, lifetimeHours: 5000, powerWatts: 100, maintenancePerHour: 1, notes: '' }],
  materials: [
    { id: 'm1', name: 'PLA', type: 'PLA', color: '#000', spoolPrice: 400, spoolWeightGrams: 1000, wastePercent: 10 },
    { id: 'm2', name: 'PETG', type: 'PETG', color: '#fff', spoolPrice: 500, spoolWeightGrams: 1000, wastePercent: 0 },
    { id: 'm0', name: 'Broken', type: 'Other', color: '#fff', spoolPrice: 500, spoolWeightGrams: 0, wastePercent: 0 },
  ],
  packaging: [{ id: 'pk', name: 'Box', cost: 10 }],
}

const settings: Settings = {
  electricityPrice: 2,
  laborRate: 120,
  failurePercent: 10,
  overheadPercent: 0,
  markupPercent: 100,
  ivaPercent: 16,
  ivaEnabled: false,
  defaultPlatformId: 'direct',
  defaultPrinterId: 'pr',
  defaultMaterialId: 'm1',
  rounding: 'none',
  platforms: [
    { id: 'direct', name: 'Direct', feePercent: 0, fixedFee: 0 },
    { id: 'market', name: 'Market', feePercent: 10, fixedFee: 0 },
    { id: 'fixed', name: 'Fixed', feePercent: 0, fixedFee: 20 },
    { id: 'greedy', name: 'Greedy', feePercent: 95, fixedFee: 0 },
  ],
}

function quote(overrides: Partial<Quote> = {}): Quote {
  return {
    id: 'q',
    name: 'Test',
    client: '',
    notes: '',
    createdAt: '',
    updatedAt: '',
    quantity: 1,
    plates: [{ id: 'p1', name: 'Plate 1', printerId: 'pr', minutes: 120, materials: [{ id: 'l1', materialId: 'm1', grams: 100 }] }],
    setupMinutes: 30,
    postMinutes: 30,
    designFee: 0,
    hardware: [{ id: 'h', name: 'Magnet', qty: 2, unitCost: 5 }],
    packagingId: 'pk',
    shippingCost: 0,
    failurePercent: 10,
    markupPercent: 100,
    platformId: 'direct',
    ivaEnabled: false,
    discountTiers: [],
    ...overrides,
  }
}

describe('calculateQuote', () => {
  it('computes each cost component for a single unit', () => {
    const { unit, warnings } = calculateQuote(quote(), profiles, settings)
    expect(unit.material).toBeCloseTo(44) // 100 g * 0.4 * 1.1
    expect(unit.electricity).toBeCloseTo(0.4) // 2 h * 0.1 kW * 2
    expect(unit.machine).toBeCloseTo(6) // 2 h * (2 + 1)
    expect(unit.failure).toBeCloseTo(5.04) // 10% of 50.4
    expect(unit.labor).toBeCloseTo(120) // 60 min * 120/h
    expect(unit.hardware).toBeCloseTo(10)
    expect(unit.packaging).toBeCloseTo(10)
    expect(unit.cost).toBeCloseTo(195.44)
    expect(unit.price).toBeCloseTo(390.88)
    expect(unit.profit).toBeCloseTo(195.44)
    expect(warnings).toHaveLength(0)
  })

  it('applies overhead on top of the subtotal', () => {
    const { unit } = calculateQuote(quote(), profiles, { ...settings, overheadPercent: 10 })
    expect(unit.overhead).toBeCloseTo(19.544)
    expect(unit.cost).toBeCloseTo(214.984)
  })

  it('sums multiple plates and materials', () => {
    const q = quote({
      plates: [
        { id: 'a', name: 'A', printerId: 'pr', minutes: 60, materials: [{ id: 'x', materialId: 'm1', grams: 50 }] },
        {
          id: 'b',
          name: 'B',
          printerId: 'pr',
          minutes: 60,
          materials: [
            { id: 'y', materialId: 'm1', grams: 50 },
            { id: 'z', materialId: 'm2', grams: 20 },
          ],
        },
      ],
    })
    const r = calculateQuote(q, profiles, settings)
    expect(r.unit.material).toBeCloseTo(44 + 10) // 100 g PLA + 20 g * 0.5
    expect(r.unit.machine).toBeCloseTo(6)
    expect(r.printMinutesPerUnit).toBe(120)
    expect(r.gramsPerUnit).toBe(120)
  })

  it('amortizes setup, design and shipping across the batch', () => {
    const r = calculateQuote(quote({ quantity: 10, designFee: 500, shippingCost: 150 }), profiles, settings)
    expect(r.unit.labor).toBeCloseTo(66) // (3 + 30) min * 2/min
    expect(r.unit.design).toBeCloseTo(50)
    expect(r.unit.shipping).toBeCloseTo(15)
    expect(r.total).toBeCloseTo(r.unit.price * 10)
  })

  it('grosses up the price so platform fees do not eat profit', () => {
    const r = calculateQuote(quote({ platformId: 'market' }), profiles, settings)
    expect(r.unit.price).toBeCloseTo(390.88 / 0.9)
    expect(r.unit.platformFee).toBeCloseTo(r.unit.price * 0.1)
    expect(r.unit.profit).toBeCloseTo(195.44)
  })

  it('handles fixed fees per order', () => {
    const r = calculateQuote(quote({ platformId: 'fixed', quantity: 2 }), profiles, settings)
    expect(r.unit.platformFee).toBeCloseTo(10)
  })

  it('adds IVA on top and keeps profit intact', () => {
    const r = calculateQuote(quote({ ivaEnabled: true }), profiles, settings)
    expect(r.unit.price).toBeCloseTo(390.88 * 1.16)
    expect(r.unit.iva).toBeCloseTo(390.88 * 0.16)
    expect(r.unit.profit).toBeCloseTo(195.44)
    expect(r.marginPercent).toBeCloseTo(50)
  })

  it('keeps profit intact with fees and IVA combined', () => {
    const r = calculateQuote(quote({ ivaEnabled: true, platformId: 'market', shippingCost: 100 }), profiles, settings)
    expect(r.unit.profit).toBeCloseTo(195.44)
  })

  it('rounding only adds profit', () => {
    const r = calculateQuote(quote(), profiles, { ...settings, rounding: '10' })
    expect(r.unit.price).toBe(400)
    expect(r.unit.rounding).toBeCloseTo(9.12)
    expect(r.unit.profit).toBeCloseTo(204.56)
  })

  it('applies quantity discount tiers', () => {
    const tiers = [
      { id: 't1', minQty: 5, discountPercent: 5 },
      { id: 't2', minQty: 10, discountPercent: 10 },
    ]
    const r = calculateQuote(quote({ quantity: 12, discountTiers: tiers }), profiles, settings)
    expect(r.discountPercent).toBe(10)
    expect(r.unit.discount).toBeCloseTo(r.unit.basePrice * 0.1)
    expect(r.unit.price).toBeCloseTo(r.unit.basePrice * 0.9)
  })

  it('flags missing references instead of crashing', () => {
    const q = quote({ plates: [{ id: 'p', name: 'P', printerId: 'gone', minutes: 60, materials: [{ id: 'l', materialId: 'gone', grams: 10 }] }] })
    const r = calculateQuote(q, profiles, settings)
    expect(r.warnings.filter((w) => w.level === 'error')).toHaveLength(2)
    expect(r.unit.material).toBe(0)
    expect(r.unit.machine).toBe(0)
  })

  it('guards zero-weight spools', () => {
    const q = quote({ plates: [{ id: 'p', name: 'P', printerId: 'pr', minutes: 60, materials: [{ id: 'l', materialId: 'm0', grams: 10 }] }] })
    const r = calculateQuote(q, profiles, settings)
    expect(Number.isFinite(r.unit.material)).toBe(true)
    expect(r.warnings.some((w) => w.message.includes('spool weight'))).toBe(true)
  })

  it('reports impossible fee + tax combinations', () => {
    const r = calculateQuote(quote({ platformId: 'greedy', ivaEnabled: true }), profiles, settings)
    expect(Number.isNaN(r.unit.price)).toBe(true)
    expect(r.warnings.some((w) => w.level === 'error')).toBe(true)
  })

  it('warns when selling below cost', () => {
    const r = calculateQuote(quote({ markupPercent: 0 }), profiles, settings)
    expect(r.warnings.some((w) => w.message.includes('below cost'))).toBe(true)
  })

  it('treats invalid quantity as 1', () => {
    const r = calculateQuote(quote({ quantity: 0 }), profiles, settings)
    expect(r.quantity).toBe(1)
  })
})

describe('applyRounding', () => {
  it.each([
    ['none', 12.34, 12.34],
    ['1', 12.01, 13],
    ['1', 12, 12],
    ['5', 12.5, 15],
    ['5', 15, 15],
    ['10', 101, 110],
    ['ending9', 140.5, 149],
    ['ending9', 149, 149],
    ['ending9', 149.2, 159],
  ] as const)('%s rounds %d to %d', (rule, input, expected) => {
    expect(applyRounding(input, rule)).toBeCloseTo(expected)
  })
})

describe('discountFor', () => {
  it('returns 0 without matching tier', () => {
    expect(discountFor({ quantity: 2, discountTiers: [{ id: 't', minQty: 5, discountPercent: 10 }] })).toBe(0)
  })
})
