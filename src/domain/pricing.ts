import type { Breakdown, PricingWarning, Profiles, Quote, RoundingRule, Settings, UnitBreakdown } from './types'

const EPSILON = 1e-9

/** Rounds up so the rounding rule never costs money. */
export function applyRounding(value: number, rule: RoundingRule): number {
  if (!Number.isFinite(value) || value <= 0) return value
  const v = value - EPSILON
  switch (rule) {
    case 'none':
      return value
    case '1':
      return Math.ceil(v)
    case '5':
      return Math.ceil(v / 5) * 5
    case '10':
      return Math.ceil(v / 10) * 10
    case 'ending9':
      return Math.ceil((v + 1) / 10) * 10 - 1
  }
}

/** Highest tier whose minimum quantity is reached. */
export function discountFor(quote: Pick<Quote, 'quantity' | 'discountTiers'>): number {
  let best: { minQty: number; discountPercent: number } | undefined
  for (const tier of quote.discountTiers) {
    if (quote.quantity >= tier.minQty && (!best || tier.minQty > best.minQty)) best = tier
  }
  return best?.discountPercent ?? 0
}

export function calculateQuote(quote: Quote, profiles: Profiles, settings: Settings): Breakdown {
  const warnings: PricingWarning[] = []
  const qty = Math.max(1, Math.floor(quote.quantity) || 1)

  let material = 0
  let electricity = 0
  let machine = 0
  let printMinutes = 0
  let grams = 0

  for (const plate of quote.plates) {
    const hours = plate.minutes / 60
    printMinutes += plate.minutes

    const printer = profiles.printers.find((p) => p.id === plate.printerId)
    if (!printer) {
      warnings.push({ level: 'error', message: `${plate.name || 'A plate'} has no printer selected.` })
    } else {
      electricity += (hours * printer.powerWatts * settings.electricityPrice) / 1000
      const depreciationPerHour = printer.lifetimeHours > 0 ? printer.purchasePrice / printer.lifetimeHours : 0
      machine += hours * (depreciationPerHour + printer.maintenancePerHour)
    }

    for (const line of plate.materials) {
      grams += line.grams
      const mat = profiles.materials.find((m) => m.id === line.materialId)
      if (!mat) {
        warnings.push({ level: 'error', message: `${plate.name || 'A plate'} has a filament line without material.` })
        continue
      }
      if (mat.spoolWeightGrams <= 0) {
        warnings.push({ level: 'error', message: `${mat.name} has a spool weight of 0 g.` })
        continue
      }
      material += line.grams * (mat.spoolPrice / mat.spoolWeightGrams) * (1 + mat.wastePercent / 100)
    }
  }

  const failure = ((material + electricity + machine) * quote.failurePercent) / 100
  const labor = ((quote.setupMinutes / qty + quote.postMinutes) / 60) * settings.laborRate
  const design = quote.designFee / qty
  const hardware = quote.hardware.reduce((sum, h) => sum + h.qty * h.unitCost, 0)

  let packaging = 0
  if (quote.packagingId) {
    const pack = profiles.packaging.find((p) => p.id === quote.packagingId)
    if (pack) packaging = pack.cost
    else warnings.push({ level: 'warning', message: 'Selected packaging no longer exists.' })
  }

  const subtotal = material + electricity + machine + failure + labor + design + hardware + packaging
  const overhead = (subtotal * settings.overheadPercent) / 100
  const cost = subtotal + overhead

  const basePrice = cost * (1 + quote.markupPercent / 100)
  const discountPercent = discountFor({ quantity: qty, discountTiers: quote.discountTiers })
  const discount = (basePrice * discountPercent) / 100
  const shipping = quote.shippingCost / qty

  // Amount the seller must keep after fees and tax.
  const net = basePrice - discount + shipping

  const platform = settings.platforms.find((p) => p.id === quote.platformId)
  if (quote.platformId && !platform) warnings.push({ level: 'warning', message: 'Selected sales channel no longer exists.' })
  const feeRate = (platform?.feePercent ?? 0) / 100
  const fixedFee = (platform?.fixedFee ?? 0) / qty
  const ivaRate = quote.ivaEnabled ? settings.ivaPercent / 100 : 0
  // Platform commission is charged on the final (tax-included) price, so solve:
  // price - feeRate*price - fixedFee - price*ivaRate/(1+ivaRate) = net
  const taxShare = ivaRate / (1 + ivaRate)
  const denominator = 1 - feeRate - taxShare

  let price: number
  let priceBeforeRounding: number
  if (denominator <= 0) {
    warnings.push({ level: 'error', message: 'Fees plus tax take 100% or more of the price.' })
    price = priceBeforeRounding = Number.NaN
  } else {
    priceBeforeRounding = (net + fixedFee) / denominator
    price = applyRounding(priceBeforeRounding, settings.rounding)
  }

  const platformFee = price * feeRate + fixedFee
  const iva = price * taxShare
  const profit = price - platformFee - iva - cost - shipping
  const revenueNetOfTax = price - iva
  const marginPercent = revenueNetOfTax > 0 ? (profit / revenueNetOfTax) * 100 : 0

  if (quote.plates.length === 0) warnings.push({ level: 'info', message: 'Add at least one plate to price the print.' })
  if (Number.isFinite(profit)) {
    if (profit <= 0) warnings.push({ level: 'error', message: 'You are selling at or below cost.' })
    else if (marginPercent < 20) warnings.push({ level: 'warning', message: 'Margin is below 20%. Consider raising the markup.' })
  }

  const unit: UnitBreakdown = {
    material,
    electricity,
    machine,
    failure,
    labor,
    design,
    hardware,
    packaging,
    overhead,
    cost,
    basePrice,
    discount,
    shipping,
    platformFee,
    iva,
    rounding: price - priceBeforeRounding,
    price,
    profit,
  }

  return {
    unit,
    quantity: qty,
    total: price * qty,
    totalProfit: profit * qty,
    marginPercent,
    discountPercent,
    printMinutesPerUnit: printMinutes,
    gramsPerUnit: grams,
    warnings,
  }
}
