import { PencilIcon, PlusIcon, StarIcon, Trash2Icon } from 'lucide-react'
import { useEffect, useId, useState, type ReactNode } from 'react'
import { Field, NumberInput } from '@/components/fields'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input, Textarea } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type Entity = { id: string; name: string }

export type FieldConfig<T> =
  | { key: keyof T & string; label: string; type: 'text' | 'textarea' | 'color'; hint?: string; full?: boolean }
  | {
      key: keyof T & string
      label: string
      type: 'number'
      hint?: string
      prefix?: string
      suffix?: string
      step?: number
      max?: number
      full?: boolean
    }
  | { key: keyof T & string; label: string; type: 'select'; options: readonly string[]; hint?: string; full?: boolean }

export function EntityManager<T extends Entity>({
  title,
  description,
  noun,
  items,
  fields,
  create,
  describe,
  leading,
  onSave,
  onDelete,
  defaultId,
  onSetDefault,
}: {
  title: string
  description: string
  noun: string
  items: T[]
  fields: FieldConfig<T>[]
  create: () => T
  describe: (item: T) => ReactNode
  leading?: (item: T) => ReactNode
  onSave: (item: T) => void
  onDelete: (id: string) => void
  defaultId?: string
  onSetDefault?: (id: string) => void
}) {
  const [editing, setEditing] = useState<T | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button
          onClick={() => {
            setEditing(create())
            setIsNew(true)
          }}
        >
          <PlusIcon /> Add {noun}
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">Nothing here yet.</p>
      ) : (
        <Card className="divide-y">
          {items.map((item) => {
            const isDefault = defaultId === item.id
            return (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                {leading?.(item)}
                <button
                  type="button"
                  className="min-w-0 flex-1 cursor-pointer text-left"
                  onClick={() => {
                    setEditing(item)
                    setIsNew(false)
                  }}
                >
                  <p className="flex items-center gap-2 truncate font-medium">
                    {item.name || <span className="text-muted-foreground">Unnamed</span>}
                    {isDefault && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">default</span>}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">{describe(item)}</p>
                </button>
                {onSetDefault && (
                  <Tooltip content={isDefault ? 'Default for new quotes' : 'Make default for new quotes'}>
                    <Button variant="ghost" size="icon-sm" onClick={() => onSetDefault(item.id)} aria-label="Make default">
                      <StarIcon className={cn(isDefault && 'fill-primary text-primary')} />
                    </Button>
                  </Tooltip>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    setEditing(item)
                    setIsNew(false)
                  }}
                  aria-label="Edit"
                >
                  <PencilIcon />
                </Button>
                {confirmId === item.id ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      onDelete(item.id)
                      setConfirmId(null)
                    }}
                    onBlur={() => setConfirmId(null)}
                    autoFocus
                  >
                    Delete?
                  </Button>
                ) : (
                  <Button variant="ghost" size="icon-sm" onClick={() => setConfirmId(item.id)} aria-label="Delete">
                    <Trash2Icon />
                  </Button>
                )}
              </div>
            )
          })}
        </Card>
      )}

      <EditDialog
        key={editing?.id}
        item={editing}
        isNew={isNew}
        noun={noun}
        fields={fields}
        onClose={() => setEditing(null)}
        onSave={(item) => {
          onSave(item)
          setEditing(null)
        }}
      />
    </div>
  )
}

function EditDialog<T extends Entity>({
  item,
  isNew,
  noun,
  fields,
  onClose,
  onSave,
}: {
  item: T | null
  isNew: boolean
  noun: string
  fields: FieldConfig<T>[]
  onClose: () => void
  onSave: (item: T) => void
}) {
  const [form, setForm] = useState<T | null>(item)
  const baseId = useId()
  useEffect(() => setForm(item), [item])

  const set = (key: keyof T, value: unknown) => setForm((f) => (f ? { ...f, [key]: value } : f))

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isNew ? `New ${noun}` : `Edit ${noun}`}</DialogTitle>
          <DialogDescription>Changes apply to every quote that uses this {noun}.</DialogDescription>
        </DialogHeader>
        {form && (
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault()
              onSave({ ...form, name: form.name.trim() || `Unnamed ${noun}` })
            }}
          >
            {fields.map((f) => {
              const id = `${baseId}-${f.key}`
              const value = form[f.key]
              let control: ReactNode
              switch (f.type) {
                case 'text':
                  control = <Input id={id} value={String(value ?? '')} onChange={(e) => set(f.key, e.target.value)} autoFocus={f.key === 'name'} />
                  break
                case 'textarea':
                  control = <Textarea id={id} value={String(value ?? '')} onChange={(e) => set(f.key, e.target.value)} />
                  break
                case 'color':
                  control = (
                    <div className="flex items-center gap-2">
                      <input
                        id={id}
                        type="color"
                        value={String(value)}
                        onChange={(e) => set(f.key, e.target.value)}
                        className="h-9 w-12 cursor-pointer rounded-lg border bg-card p-1"
                      />
                      <span className="text-sm text-muted-foreground uppercase">{String(value)}</span>
                    </div>
                  )
                  break
                case 'number':
                  control = (
                    <NumberInput id={id} value={Number(value)} prefix={f.prefix} suffix={f.suffix} step={f.step} max={f.max} onChange={(n) => set(f.key, n)} />
                  )
                  break
                case 'select':
                  control = <Select id={id} value={String(value)} onValueChange={(v) => set(f.key, v)} options={f.options.map((o) => ({ value: o, label: o }))} />
                  break
              }
              return (
                <Field key={f.key} label={f.label} hint={f.hint} htmlFor={id} className={cn(f.full && 'sm:col-span-2')}>
                  {control}
                </Field>
              )
            })}
            <DialogFooter className="sm:col-span-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">{isNew ? `Add ${noun}` : 'Save'}</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
