import { uid } from '@/lib/utils'
import type { AppData, Quote, Settings } from './types'

/**
 * Seed data. Prices are rough MXN references meant to be edited in Settings.
 */
export function createDefaultData(): AppData {
  const p1s = uid()
  const ender = uid()
  const pla = uid()
  const direct = uid()

  const settings: Settings = {
    electricityPrice: 3,
    laborRate: 100,
    failurePercent: 10,
    overheadPercent: 5,
    markupPercent: 100,
    ivaPercent: 16,
    ivaEnabled: false,
    defaultPlatformId: direct,
    defaultPrinterId: p1s,
    defaultMaterialId: pla,
    rounding: '5',
    platforms: [
      { id: direct, name: 'Direct sale', feePercent: 0, fixedFee: 0 },
      { id: uid(), name: 'Mercado Libre', feePercent: 15, fixedFee: 0 },
      { id: uid(), name: 'Mercado Pago link', feePercent: 3.5, fixedFee: 4 },
      { id: uid(), name: 'Etsy', feePercent: 10, fixedFee: 4 },
    ],
  }

  return {
    settings,
    printers: [
      { id: p1s, name: 'Bambu Lab P1S', purchasePrice: 14000, lifetimeHours: 5000, powerWatts: 110, maintenancePerHour: 2, notes: '' },
      { id: ender, name: 'Creality Ender 3 V3', purchasePrice: 6000, lifetimeHours: 4000, powerWatts: 120, maintenancePerHour: 1.5, notes: '' },
    ],
    materials: [
      { id: pla, name: 'PLA Generic', type: 'PLA', color: '#f97316', spoolPrice: 350, spoolWeightGrams: 1000, wastePercent: 5 },
      { id: uid(), name: 'PETG Generic', type: 'PETG', color: '#0ea5e9', spoolPrice: 380, spoolWeightGrams: 1000, wastePercent: 5 },
      { id: uid(), name: 'TPU 95A', type: 'TPU', color: '#22c55e', spoolPrice: 500, spoolWeightGrams: 1000, wastePercent: 8 },
      { id: uid(), name: 'ABS Generic', type: 'ABS', color: '#64748b', spoolPrice: 380, spoolWeightGrams: 1000, wastePercent: 8 },
    ],
    hardwareItems: [
      { id: uid(), name: 'Neodymium magnet 6x3 mm', unitCost: 2 },
      { id: uid(), name: 'M3 heat-set insert', unitCost: 1.5 },
      { id: uid(), name: 'M3 screw', unitCost: 1 },
      { id: uid(), name: 'Keyring', unitCost: 5 },
    ],
    packaging: [
      { id: uid(), name: 'Bag + label', cost: 8 },
      { id: uid(), name: 'Small box', cost: 20 },
      { id: uid(), name: 'Medium box', cost: 35 },
    ],
    quotes: [],
  }
}

export function createQuote(settings: Settings): Quote {
  const now = new Date().toISOString()
  return {
    id: uid(),
    name: '',
    client: '',
    notes: '',
    createdAt: now,
    updatedAt: now,
    quantity: 1,
    plates: [
      {
        id: uid(),
        name: 'Plate 1',
        printerId: settings.defaultPrinterId,
        minutes: 120,
        materials: [{ id: uid(), materialId: settings.defaultMaterialId, grams: 50 }],
      },
    ],
    setupMinutes: 10,
    postMinutes: 10,
    designFee: 0,
    hardware: [],
    packagingId: '',
    shippingCost: 0,
    failurePercent: settings.failurePercent,
    markupPercent: settings.markupPercent,
    platformId: settings.defaultPlatformId,
    ivaEnabled: settings.ivaEnabled,
    discountTiers: [],
  }
}
