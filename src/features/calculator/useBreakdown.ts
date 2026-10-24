import { useMemo } from 'react'
import { calculateQuote } from '@/domain/pricing'
import { useAppStore } from '@/store/useAppStore'

export function useBreakdown() {
  const draft = useAppStore((s) => s.draft)
  const printers = useAppStore((s) => s.printers)
  const materials = useAppStore((s) => s.materials)
  const packaging = useAppStore((s) => s.packaging)
  const settings = useAppStore((s) => s.settings)
  return useMemo(
    () => calculateQuote(draft, { printers, materials, packaging }, settings),
    [draft, printers, materials, packaging, settings],
  )
}
