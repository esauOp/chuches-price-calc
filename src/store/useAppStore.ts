import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createDefaultData, createQuote } from '@/domain/defaults'
import { appDataSchema } from '@/domain/schemas'
import type { AppData, HardwareItem, MaterialProfile, PackagingProfile, PrinterProfile, Quote, Settings } from '@/domain/types'
import { uid } from '@/lib/utils'

type Collection = 'printers' | 'materials' | 'hardwareItems' | 'packaging'
type CollectionItem = {
  printers: PrinterProfile
  materials: MaterialProfile
  hardwareItems: HardwareItem
  packaging: PackagingProfile
}

interface AppState extends AppData {
  draft: Quote
  updateSettings: (patch: Partial<Settings>) => void
  upsert: <K extends Collection>(key: K, item: CollectionItem[K]) => void
  remove: (key: Collection, id: string) => void
  updateDraft: (patch: Partial<Quote>) => void
  newDraft: () => void
  /** Saves the draft, overwriting the stored quote with the same id. */
  saveDraft: (name?: string) => void
  /** Saves the draft as a new quote with a fresh id. */
  saveDraftAsNew: (name?: string) => void
  loadQuote: (id: string) => void
  duplicateQuote: (id: string) => void
  deleteQuote: (id: string) => void
  importData: (raw: unknown) => { ok: true } | { ok: false; error: string }
  resetAll: () => void
}

function upsertById<T extends { id: string }>(list: T[], item: T): T[] {
  const i = list.findIndex((x) => x.id === item.id)
  if (i === -1) return [...list, item]
  const next = list.slice()
  next[i] = item
  return next
}

function stamp(quote: Quote, name?: string): Quote {
  return { ...quote, name: name ?? quote.name, updatedAt: new Date().toISOString() }
}

const initial = createDefaultData()

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initial,
      draft: createQuote(initial.settings),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      upsert: (key, item) => set((s) => ({ [key]: upsertById(s[key] as { id: string }[], item) })),

      remove: (key, id) => set((s) => ({ [key]: (s[key] as { id: string }[]).filter((x) => x.id !== id) })),

      updateDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),

      newDraft: () => set((s) => ({ draft: createQuote(s.settings) })),

      saveDraft: (name) =>
        set((s) => {
          const saved = stamp(s.draft, name)
          return { draft: saved, quotes: upsertById(s.quotes, saved) }
        }),

      saveDraftAsNew: (name) =>
        set((s) => {
          const now = new Date().toISOString()
          const saved = { ...stamp(s.draft, name), id: uid(), createdAt: now }
          return { draft: saved, quotes: [...s.quotes, saved] }
        }),

      loadQuote: (id) => {
        const q = get().quotes.find((x) => x.id === id)
        if (q) set({ draft: structuredClone(q) })
      },

      duplicateQuote: (id) =>
        set((s) => {
          const q = s.quotes.find((x) => x.id === id)
          if (!q) return {}
          const now = new Date().toISOString()
          const copy: Quote = { ...structuredClone(q), id: uid(), name: `${q.name || 'Untitled'} (copy)`, createdAt: now, updatedAt: now }
          return { quotes: [...s.quotes, copy] }
        }),

      deleteQuote: (id) => set((s) => ({ quotes: s.quotes.filter((x) => x.id !== id) })),

      importData: (raw) => {
        const parsed = appDataSchema.safeParse(raw)
        if (!parsed.success) {
          const issue = parsed.error.issues[0]
          return { ok: false, error: issue ? `${issue.path.join('.')}: ${issue.message}` : 'Invalid file' }
        }
        set({ ...parsed.data, draft: createQuote(parsed.data.settings) })
        return { ok: true }
      },

      resetAll: () => {
        const data = createDefaultData()
        set({ ...data, draft: createQuote(data.settings) })
      },
    }),
    {
      name: 'chuches-price-calc',
      version: 1,
      partialize: ({ settings, printers, materials, hardwareItems, packaging, quotes, draft }) => ({
        settings,
        printers,
        materials,
        hardwareItems,
        packaging,
        quotes,
        draft,
      }),
    },
  ),
)

export function exportData(): AppData {
  const { settings, printers, materials, hardwareItems, packaging, quotes } = useAppStore.getState()
  return { settings, printers, materials, hardwareItems, packaging, quotes }
}
