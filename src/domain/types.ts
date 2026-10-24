import type { z } from 'zod'
import type {
  appDataSchema,
  discountTierSchema,
  hardwareItemSchema,
  hardwareLineSchema,
  materialSchema,
  materialTypes,
  packagingSchema,
  plateMaterialSchema,
  plateSchema,
  platformSchema,
  printerSchema,
  quoteSchema,
  roundingRules,
  settingsSchema,
} from './schemas'

export type PrinterProfile = z.infer<typeof printerSchema>
export type MaterialType = (typeof materialTypes)[number]
export type MaterialProfile = z.infer<typeof materialSchema>
export type HardwareItem = z.infer<typeof hardwareItemSchema>
export type PackagingProfile = z.infer<typeof packagingSchema>
export type Platform = z.infer<typeof platformSchema>
export type RoundingRule = (typeof roundingRules)[number]
export type Settings = z.infer<typeof settingsSchema>
export type PlateMaterial = z.infer<typeof plateMaterialSchema>
export type Plate = z.infer<typeof plateSchema>
export type HardwareLine = z.infer<typeof hardwareLineSchema>
export type DiscountTier = z.infer<typeof discountTierSchema>
export type Quote = z.infer<typeof quoteSchema>
export type AppData = z.infer<typeof appDataSchema>

export interface Profiles {
  printers: PrinterProfile[]
  materials: MaterialProfile[]
  packaging: PackagingProfile[]
}

/** Every amount is per unit, in MXN. */
export interface UnitBreakdown {
  material: number
  electricity: number
  machine: number
  failure: number
  labor: number
  design: number
  hardware: number
  packaging: number
  overhead: number
  /** Production cost: sum of everything above. */
  cost: number
  /** Price after markup, before discount, shipping, fees and tax. */
  basePrice: number
  discount: number
  shipping: number
  platformFee: number
  iva: number
  /** Extra added by the rounding rule. */
  rounding: number
  /** Final price the customer pays. */
  price: number
  /** What is left after cost, shipping, fees and tax. */
  profit: number
}

export type WarningLevel = 'error' | 'warning' | 'info'

export interface PricingWarning {
  level: WarningLevel
  message: string
}

export interface Breakdown {
  unit: UnitBreakdown
  quantity: number
  total: number
  totalProfit: number
  /** Profit as a share of revenue net of tax. */
  marginPercent: number
  discountPercent: number
  printMinutesPerUnit: number
  gramsPerUnit: number
  warnings: PricingWarning[]
}
