import { ChevronDownIcon, type LucideIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Card } from './ui/card'

export function Section({
  step,
  icon: Icon,
  title,
  summary,
  defaultOpen = true,
  children,
}: {
  step: number
  icon: LucideIcon
  title: string
  summary?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center gap-3 rounded-xl p-4 text-left sm:p-5"
        aria-expanded={open}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
          <Icon className="size-[18px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-medium tracking-wide text-muted-foreground uppercase">Step {step}</span>
          <span className="block font-semibold">{title}</span>
        </span>
        {summary && <span className="hidden text-sm text-muted-foreground tabular-nums sm:block">{summary}</span>}
        <ChevronDownIcon className={cn('size-5 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="border-t px-4 py-4 sm:px-5 sm:py-5">{children}</div>}
    </Card>
  )
}

export function EmptyState({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <p className="font-medium">{title}</p>
      {children && <div className="text-sm text-muted-foreground">{children}</div>}
    </div>
  )
}
