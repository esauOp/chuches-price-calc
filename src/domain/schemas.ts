import { z } from 'zod'

const id = z.string().min(1)
const nonNeg = z.number().finite().min(0)
const pct = z.number().finite().min(0).max(1000)

export const printerSchema = z.object({
  id,
  name: z.string(),
  purchasePrice: nonNeg,
  lifetimeHours: nonNeg,
  powerWatts: nonNeg,
  maintenancePerHour: nonNeg,
  notes: z.string().default(''),
})

export const materialTypes = ['PLA', 'PETG', 'ABS', 'ASA', 'TPU', 'Nylon', 'PC', 'Resin', 'Other'] as const

export const materialSchema = z.object({
  id,
  name: z.string(),
  type: z.enum(materialTypes),
  color: z.string(),
  spoolPrice: nonNeg,
  spoolWeightGrams: nonNeg,
  wastePercent: pct,
})

export const hardwareItemSchema = z.object({
  id,
  name: z.string(),
  unitCost: nonNeg,
})

export const packagingSchema = z.object({
  id,
  name: z.string(),
  cost: nonNeg,
})

export const platformSchema = z.object({
  id,
  name: z.string(),
  feePercent: z.number().finite().min(0).max(99),
  fixedFee: nonNeg,
})

export const roundingRules = ['none', '1', '5', '10', 'ending9'] as const

export const settingsSchema = z.object({
  electricityPrice: nonNeg,
  laborRate: nonNeg,
  failurePercent: pct,
  overheadPercent: pct,
  markupPercent: pct,
  ivaPercent: pct,
  ivaEnabled: z.boolean(),
  defaultPlatformId: z.string(),
  defaultPrinterId: z.string(),
  defaultMaterialId: z.string(),
  rounding: z.enum(roundingRules),
  platforms: z.array(platformSchema),
})

export const plateMaterialSchema = z.object({
  id,
  materialId: z.string(),
  grams: nonNeg,
})

export const plateSchema = z.object({
  id,
  name: z.string(),
  printerId: z.string(),
  minutes: nonNeg,
  materials: z.array(plateMaterialSchema),
})

export const hardwareLineSchema = z.object({
  id,
  name: z.string(),
  qty: nonNeg,
  unitCost: nonNeg,
})

export const discountTierSchema = z.object({
  id,
  minQty: z.number().int().min(1),
  discountPercent: z.number().finite().min(0).max(100),
})

export const quoteSchema = z.object({
  id,
  name: z.string(),
  client: z.string(),
  notes: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  quantity: z.number().int().min(1),
  plates: z.array(plateSchema),
  setupMinutes: nonNeg,
  postMinutes: nonNeg,
  designFee: nonNeg,
  hardware: z.array(hardwareLineSchema),
  packagingId: z.string(),
  shippingCost: nonNeg,
  failurePercent: pct,
  markupPercent: pct,
  platformId: z.string(),
  ivaEnabled: z.boolean(),
  discountTiers: z.array(discountTierSchema),
})

export const appDataSchema = z.object({
  settings: settingsSchema,
  printers: z.array(printerSchema),
  materials: z.array(materialSchema),
  hardwareItems: z.array(hardwareItemSchema),
  packaging: z.array(packagingSchema),
  quotes: z.array(quoteSchema),
})
