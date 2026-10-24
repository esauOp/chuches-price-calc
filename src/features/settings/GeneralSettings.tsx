import { NumberField } from '@/components/fields'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { useAppStore } from '@/store/useAppStore'

export function GeneralSettings() {
  const settings = useAppStore((s) => s.settings)
  const update = useAppStore((s) => s.updateSettings)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">General</h2>
        <p className="text-sm text-muted-foreground">Business-wide rates and defaults for new quotes.</p>
      </div>
      <Card className="grid gap-5 p-5 sm:grid-cols-2">
        <NumberField
          label="Electricity price"
          hint="What you pay per kWh. Check your CFE bill: total amount ÷ kWh consumed gives your real average."
          prefix="$"
          suffix="/kWh"
          step={0.1}
          value={settings.electricityPrice}
          onChange={(electricityPrice) => update({ electricityPrice })}
        />
        <NumberField
          label="Labor rate"
          hint="What your hands-on time is worth per hour."
          prefix="$"
          suffix="/h"
          value={settings.laborRate}
          onChange={(laborRate) => update({ laborRate })}
        />
        <NumberField
          label="Overhead"
          hint="Covers indirect costs: rent, software, tools, nozzles, build plates, marketing. Applied on top of production cost."
          suffix="%"
          value={settings.overheadPercent}
          onChange={(overheadPercent) => update({ overheadPercent })}
        />
        <NumberField
          label="IVA rate"
          suffix="%"
          value={settings.ivaPercent}
          onChange={(ivaPercent) => update({ ivaPercent })}
        />
      </Card>

      <div className="mt-2">
        <h3 className="font-semibold">Defaults for new quotes</h3>
        <p className="text-sm text-muted-foreground">Each quote can still override these.</p>
      </div>
      <Card className="grid gap-5 p-5 sm:grid-cols-2">
        <NumberField
          label="Failure rate"
          suffix="%"
          max={100}
          value={settings.failurePercent}
          onChange={(failurePercent) => update({ failurePercent })}
        />
        <NumberField
          label="Markup"
          suffix="%"
          max={1000}
          value={settings.markupPercent}
          onChange={(markupPercent) => update({ markupPercent })}
        />
        <div className="flex items-center justify-between gap-3 rounded-lg border p-3 sm:col-span-2">
          <div>
            <p className="text-sm font-medium">Add IVA by default</p>
            <p className="text-xs text-muted-foreground">Turn on if you usually invoice with tax.</p>
          </div>
          <Switch checked={settings.ivaEnabled} onCheckedChange={(ivaEnabled) => update({ ivaEnabled })} aria-label="Add IVA by default" />
        </div>
      </Card>
    </div>
  )
}
