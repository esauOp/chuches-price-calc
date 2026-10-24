import { BoxIcon, DatabaseIcon, MagnetIcon, PrinterIcon, SlidersHorizontalIcon, SpoolIcon, StoreIcon } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { materialTypes } from '@/domain/schemas'
import type { HardwareItem, MaterialProfile, PackagingProfile, Platform, PrinterProfile } from '@/domain/types'
import { formatMoney } from '@/lib/format'
import { uid } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { DataBackup } from './DataBackup'
import { EntityManager } from './EntityManager'
import { GeneralSettings } from './GeneralSettings'

export function SettingsPage() {
  const s = useAppStore()

  return (
    <Tabs defaultValue="general" className="flex flex-col gap-6 md:flex-row">
      <TabsList className="h-auto w-full flex-wrap justify-start md:w-52 md:shrink-0 md:flex-col md:items-stretch md:self-start">
        <TabsTrigger value="general" className="justify-start">
          <SlidersHorizontalIcon /> General
        </TabsTrigger>
        <TabsTrigger value="printers" className="justify-start">
          <PrinterIcon /> Printers
        </TabsTrigger>
        <TabsTrigger value="materials" className="justify-start">
          <SpoolIcon /> Materials
        </TabsTrigger>
        <TabsTrigger value="hardware" className="justify-start">
          <MagnetIcon /> Hardware
        </TabsTrigger>
        <TabsTrigger value="packaging" className="justify-start">
          <BoxIcon /> Packaging
        </TabsTrigger>
        <TabsTrigger value="channels" className="justify-start">
          <StoreIcon /> Sales channels
        </TabsTrigger>
        <TabsTrigger value="data" className="justify-start">
          <DatabaseIcon /> Data & backup
        </TabsTrigger>
      </TabsList>

      <div className="min-w-0 flex-1">
        <TabsContent value="general">
          <GeneralSettings />
        </TabsContent>

        <TabsContent value="printers">
          <EntityManager<PrinterProfile>
            title="Printers"
            description="Purchase price and lifetime are used to charge machine wear per printing hour."
            noun="printer"
            items={s.printers}
            defaultId={s.settings.defaultPrinterId}
            onSetDefault={(defaultPrinterId) => s.updateSettings({ defaultPrinterId })}
            create={() => ({ id: uid(), name: '', purchasePrice: 8000, lifetimeHours: 5000, powerWatts: 120, maintenancePerHour: 1.5, notes: '' })}
            describe={(p) =>
              `${p.powerWatts} W · ${formatMoney(p.lifetimeHours > 0 ? p.purchasePrice / p.lifetimeHours + p.maintenancePerHour : p.maintenancePerHour)}/h wear`
            }
            fields={[
              { key: 'name', label: 'Name', type: 'text', full: true },
              { key: 'purchasePrice', label: 'Purchase price', type: 'number', prefix: '$' },
              {
                key: 'lifetimeHours',
                label: 'Expected lifetime',
                type: 'number',
                suffix: 'h',
                hint: 'Printing hours before the printer is worn out or replaced. 3,000–8,000 h is typical for hobby machines.',
              },
              {
                key: 'powerWatts',
                label: 'Average power draw',
                type: 'number',
                suffix: 'W',
                hint: 'Average while printing, not the PSU rating. Bed-slinger PLA prints are often 80–150 W; enclosed ABS prints more.',
              },
              {
                key: 'maintenancePerHour',
                label: 'Maintenance',
                type: 'number',
                prefix: '$',
                suffix: '/h',
                step: 0.1,
                hint: 'Nozzles, belts, PTFE tubes, build plates, lubricant… spread per printing hour.',
              },
              { key: 'notes', label: 'Notes', type: 'textarea', full: true },
            ]}
            onSave={(item) => s.upsert('printers', item)}
            onDelete={(id) => s.remove('printers', id)}
          />
        </TabsContent>

        <TabsContent value="materials">
          <EntityManager<MaterialProfile>
            title="Materials"
            description="Filament spools. Cost per gram is spool price ÷ spool weight."
            noun="material"
            items={s.materials}
            defaultId={s.settings.defaultMaterialId}
            onSetDefault={(defaultMaterialId) => s.updateSettings({ defaultMaterialId })}
            create={() => ({ id: uid(), name: '', type: 'PLA', color: '#f97316', spoolPrice: 350, spoolWeightGrams: 1000, wastePercent: 5 })}
            leading={(m) => <span className="size-4 shrink-0 rounded-full border border-black/10" style={{ background: m.color }} />}
            describe={(m) =>
              `${m.type} · ${formatMoney(m.spoolPrice)} / ${m.spoolWeightGrams} g · ${formatMoney(m.spoolWeightGrams > 0 ? (m.spoolPrice / m.spoolWeightGrams) * 1000 : 0)}/kg`
            }
            fields={[
              { key: 'name', label: 'Name', type: 'text', full: true },
              { key: 'type', label: 'Type', type: 'select', options: materialTypes },
              { key: 'color', label: 'Color', type: 'color' },
              { key: 'spoolPrice', label: 'Spool price', type: 'number', prefix: '$', hint: 'Include shipping if you paid for it.' },
              { key: 'spoolWeightGrams', label: 'Spool weight', type: 'number', suffix: 'g', hint: 'Net filament weight (usually 1000 g).' },
              {
                key: 'wastePercent',
                label: 'Waste',
                type: 'number',
                suffix: '%',
                max: 100,
                hint: 'Purge, poop, skirts and spool ends not counted by the slicer. AMS color changes can add a lot.',
              },
            ]}
            onSave={(item) => s.upsert('materials', item)}
            onDelete={(id) => s.remove('materials', id)}
          />
        </TabsContent>

        <TabsContent value="hardware">
          <EntityManager<HardwareItem>
            title="Hardware catalog"
            description="Common parts you add to prints. They appear as quick-add buttons in the calculator."
            noun="item"
            items={s.hardwareItems}
            create={() => ({ id: uid(), name: '', unitCost: 1 })}
            describe={(h) => `${formatMoney(h.unitCost)} each`}
            fields={[
              { key: 'name', label: 'Name', type: 'text', full: true },
              { key: 'unitCost', label: 'Unit cost', type: 'number', prefix: '$', step: 0.1 },
            ]}
            onSave={(item) => s.upsert('hardwareItems', item)}
            onDelete={(id) => s.remove('hardwareItems', id)}
          />
        </TabsContent>

        <TabsContent value="packaging">
          <EntityManager<PackagingProfile>
            title="Packaging"
            description="Box, bag, tape, labels, filler, thank-you card — total cost per unit shipped."
            noun="packaging"
            items={s.packaging}
            create={() => ({ id: uid(), name: '', cost: 10 })}
            describe={(p) => formatMoney(p.cost)}
            fields={[
              { key: 'name', label: 'Name', type: 'text', full: true },
              { key: 'cost', label: 'Cost per unit', type: 'number', prefix: '$', step: 0.5 },
            ]}
            onSave={(item) => s.upsert('packaging', item)}
            onDelete={(id) => s.remove('packaging', id)}
          />
        </TabsContent>

        <TabsContent value="channels">
          <EntityManager<Platform>
            title="Sales channels"
            description="Marketplaces and payment methods. Their commission is built into the price. Check current fees — they change often."
            noun="channel"
            items={s.settings.platforms}
            defaultId={s.settings.defaultPlatformId}
            onSetDefault={(defaultPlatformId) => s.updateSettings({ defaultPlatformId })}
            create={() => ({ id: uid(), name: '', feePercent: 0, fixedFee: 0 })}
            describe={(p) => (p.feePercent || p.fixedFee ? `${p.feePercent}%${p.fixedFee ? ` + ${formatMoney(p.fixedFee)} per order` : ''}` : 'No fees')}
            fields={[
              { key: 'name', label: 'Name', type: 'text', full: true },
              { key: 'feePercent', label: 'Commission', type: 'number', suffix: '%', step: 0.1, max: 99, hint: 'Percentage taken from the final price.' },
              { key: 'fixedFee', label: 'Fixed fee per order', type: 'number', prefix: '$', step: 0.5 },
            ]}
            onSave={(item) => {
              const exists = s.settings.platforms.some((p) => p.id === item.id)
              s.updateSettings({
                platforms: exists ? s.settings.platforms.map((p) => (p.id === item.id ? item : p)) : [...s.settings.platforms, item],
              })
            }}
            onDelete={(id) => s.updateSettings({ platforms: s.settings.platforms.filter((p) => p.id !== id) })}
          />
        </TabsContent>

        <TabsContent value="data">
          <DataBackup />
        </TabsContent>
      </div>
    </Tabs>
  )
}
