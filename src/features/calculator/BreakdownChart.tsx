import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import type { BreakdownSlice } from './slices'

export function BreakdownChart({ slices, centerLabel, centerValue }: { slices: BreakdownSlice[]; centerLabel: string; centerValue: string }) {
  const data = slices.filter((s) => s.value > 0.005)
  return (
    <div className="relative mx-auto aspect-square w-full max-w-56">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius="68%"
            outerRadius="100%"
            paddingAngle={data.length > 1 ? 1.5 : 0}
            stroke="none"
            isAnimationActive={false}
          >
            {data.map((s) => (
              <Cell key={s.key} fill={s.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xs text-muted-foreground">{centerLabel}</span>
        <span className="text-lg font-semibold tabular-nums">{centerValue}</span>
      </div>
    </div>
  )
}
