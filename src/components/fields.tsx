import { useEffect, useId, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Label } from './ui/label'
import { InfoTip } from './ui/tooltip'

export function Field({
  label,
  hint,
  htmlFor,
  className,
  children,
}: {
  label: ReactNode
  hint?: ReactNode
  htmlFor?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <Label htmlFor={htmlFor} className="text-muted-foreground">
        {label}
        {hint && <InfoTip>{hint}</InfoTip>}
      </Label>
      {children}
    </div>
  )
}

interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  prefix?: ReactNode
  suffix?: ReactNode
  min?: number
  max?: number
  step?: number
  integer?: boolean
  id?: string
  className?: string
  'aria-label'?: string
}

/**
 * Keeps its own text state so partially typed values ("1.", "") don't get clobbered,
 * and only reports valid, clamped numbers upward.
 */
export function NumberInput({ value, onChange, prefix, suffix, min = 0, max, step = 1, integer, id, className, ...rest }: NumberInputProps) {
  const [text, setText] = useState(String(value))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) setText(String(value))
  }, [value, focused])

  function commit(raw: string) {
    setText(raw)
    if (raw.trim() === '') return
    let n = Number(raw)
    if (!Number.isFinite(n)) return
    if (integer) n = Math.trunc(n)
    if (n < min) n = min
    if (max !== undefined && n > max) n = max
    onChange(n)
  }

  return (
    <div
      className={cn(
        'flex h-9 w-full min-w-0 items-center rounded-lg border border-input bg-card text-sm shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/40',
        className,
      )}
    >
      {prefix && <span className="pl-3 text-muted-foreground select-none">{prefix}</span>}
      <input
        id={id}
        type="number"
        inputMode="decimal"
        className="h-full w-full min-w-0 bg-transparent px-3 tabular-nums outline-none"
        value={text}
        min={min}
        max={max}
        step={step}
        onFocus={(e) => {
          setFocused(true)
          e.currentTarget.select()
        }}
        onBlur={() => {
          setFocused(false)
          setText(String(value))
        }}
        onChange={(e) => commit(e.target.value)}
        aria-label={rest['aria-label']}
      />
      {suffix && <span className="pr-3 whitespace-nowrap text-muted-foreground select-none">{suffix}</span>}
    </div>
  )
}

export function NumberField({ label, hint, className, ...props }: NumberInputProps & { label: ReactNode; hint?: ReactNode }) {
  const id = useId()
  return (
    <Field label={label} hint={hint} htmlFor={id} className={className}>
      <NumberInput id={id} {...props} />
    </Field>
  )
}

/** Hours + minutes editor backed by a total-minutes number. */
export function DurationInput({ minutes, onChange }: { minutes: number; onChange: (minutes: number) => void }) {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes - h * 60)
  return (
    <div className="grid grid-cols-2 gap-2">
      <NumberInput value={h} integer suffix="h" aria-label="Hours" onChange={(nh) => onChange(nh * 60 + m)} />
      <NumberInput value={m} integer max={59} suffix="min" aria-label="Minutes" onChange={(nm) => onChange(h * 60 + nm)} />
    </div>
  )
}
