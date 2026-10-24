import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { InfoIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export const TooltipProvider = TooltipPrimitive.Provider

export function Tooltip({ content, children }: { content: ReactNode; children: ReactNode }) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          sideOffset={6}
          className="z-50 max-w-64 rounded-lg bg-foreground px-3 py-2 text-xs leading-relaxed text-background shadow-lg"
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-foreground" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}

export function InfoTip({ children }: { children: ReactNode }) {
  return (
    <Tooltip content={children}>
      <button type="button" className="cursor-help text-muted-foreground hover:text-foreground" aria-label="More info">
        <InfoIcon className="size-3.5" />
      </button>
    </Tooltip>
  )
}
