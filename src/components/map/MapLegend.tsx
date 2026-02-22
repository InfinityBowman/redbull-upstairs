import type { ReactNode } from 'react'
import { CHORO_COLORS } from '@/lib/colors'

/* ── Section building blocks ──────────────────────────────────── */

interface GradientSectionProps {
  title: string
  colors?: Array<string>
  lowLabel?: string
  highLabel?: string
}

export function GradientSection({
  title,
  colors = CHORO_COLORS,
  lowLabel = 'Low',
  highLabel = 'High',
}: GradientSectionProps) {
  return (
    <div>
      <div className="mb-1 font-semibold text-foreground">{title}</div>
      <div
        className="h-2.5 w-full rounded-sm"
        style={{
          background: `linear-gradient(to right, ${colors.join(', ')})`,
        }}
      />
      <div className="mt-0.5 flex justify-between">
        <span className="text-muted-foreground">{lowLabel}</span>
        <span className="text-muted-foreground">{highLabel}</span>
      </div>
    </div>
  )
}

export interface SwatchItem {
  color: string
  label: string
}

interface SwatchSectionProps {
  title: string
  items: Array<SwatchItem>
}

export function SwatchSection({ title, items }: SwatchSectionProps) {
  return (
    <div>
      <div className="mb-1 font-semibold text-foreground">{title}</div>
      <div className="flex flex-col gap-0.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-4 shrink-0 rounded-sm border border-black/10"
              style={{ background: item.color }}
            />
            <span className="text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface SymbolItem {
  node: ReactNode
  label: string
}

interface SymbolSectionProps {
  title: string
  items: Array<SymbolItem>
}

export function SymbolSection({ title, items }: SymbolSectionProps) {
  return (
    <div>
      <div className="mb-1 font-semibold text-foreground">{title}</div>
      <div className="flex items-center gap-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-1">
            {item.node}
            <span className="text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Container ────────────────────────────────────────────────── */

interface MapLegendProps {
  children: ReactNode
}

export function MapLegend({ children }: MapLegendProps) {
  return (
    <div className="absolute right-3 bottom-8 z-10 flex max-h-[60vh] min-w-[155px] max-w-[190px] flex-col gap-2.5 overflow-y-auto rounded-lg border border-border/60 bg-card/95 p-3 text-xs shadow-lg backdrop-blur-sm">
      {children}
    </div>
  )
}
