import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { animate, motion, useMotionValue } from 'motion/react'
import { useExplorer } from '@/components/explorer/ExplorerProvider'
import { ComplaintsAnalytics } from './analytics/ComplaintsAnalytics'
import { TransitAnalytics } from './analytics/TransitAnalytics'
import { VacancyAnalytics } from './analytics/VacancyAnalytics'
import { NeighborhoodAnalytics } from './analytics/NeighborhoodAnalytics'
import { ChartBuilder } from './analytics/ChartBuilder'
import { CrimeAnalytics } from './analytics/CrimeAnalytics'
import { ArpaAnalytics } from './analytics/ArpaAnalytics'
import { DemographicsAnalytics } from './analytics/DemographicsAnalytics'
import type { LayerToggles } from '@/lib/explorer-types'

interface TabDef {
  key: string
  label: string
  color?: string
  layer?: keyof LayerToggles
  node: React.ReactNode
}

const LAYER_TABS: Array<{
  key: string
  label: string
  color: string
  layer: keyof LayerToggles
  component: () => React.ReactNode
}> = [
  { key: 'complaints', label: '311 Complaints', color: 'text-indigo-400', layer: 'complaints', component: () => <ComplaintsAnalytics /> },
  { key: 'crime', label: 'Crime', color: 'text-orange-400', layer: 'crime', component: () => <CrimeAnalytics /> },
  { key: 'transit', label: 'Transit & Equity', color: 'text-blue-400', layer: 'transit', component: () => <TransitAnalytics /> },
  { key: 'vacancy', label: 'Vacancy Triage', color: 'text-amber-400', layer: 'vacancy', component: () => <VacancyAnalytics /> },
  { key: 'arpa', label: 'ARPA Funds', color: 'text-emerald-400', layer: 'arpa', component: () => <ArpaAnalytics /> },
  { key: 'demographics', label: 'Demographics', color: 'text-purple-400', layer: 'demographics', component: () => <DemographicsAnalytics /> },
]

export function AnalyticsPanel() {
  const { state, dispatch } = useExplorer()
  const [activeTab, setActiveTab] = useState<string>('')
  const dragRef = useRef<{ startY: number; startH: number } | null>(null)
  const heightRef = useRef(state.analyticsPanelHeight)
  const contentRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const clipHeight = useMotionValue(state.analyticsPanelExpanded ? state.analyticsPanelHeight : 0)

  // Build available tabs from active layers + chart builder
  const tabs = useMemo<Array<TabDef>>(() => {
    const result: Array<TabDef> = []
    for (const lt of LAYER_TABS) {
      if (state.layers[lt.layer]) {
        result.push({ key: lt.key, label: lt.label, color: lt.color, layer: lt.layer, node: lt.component() })
      }
    }
    result.push({ key: 'chart', label: 'Chart Builder', node: <ChartBuilder /> })
    return result
  }, [state.layers])

  // Auto-select first tab when active layers change
  useEffect(() => {
    if (tabs.length > 0 && !tabs.find((t) => t.key === activeTab)) {
      setActiveTab(tabs[0].key)
    }
  }, [tabs, activeTab])

  useEffect(() => {
    heightRef.current = state.analyticsPanelHeight
  }, [state.analyticsPanelHeight])

  useEffect(() => {
    return () => {
      dragRef.current = null
    }
  }, [])

  const onDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      isDragging.current = true
      dragRef.current = { startY: e.clientY, startH: heightRef.current }

      const onMove = (ev: MouseEvent) => {
        if (!dragRef.current) return
        const delta = dragRef.current.startY - ev.clientY
        const next = Math.min(800, Math.max(150, dragRef.current.startH + delta))
        clipHeight.jump(next)
        if (contentRef.current) contentRef.current.style.height = `${next}px`
      }

      const onUp = () => {
        const final = Math.round(clipHeight.get())
        isDragging.current = false
        dispatch({ type: 'SET_ANALYTICS_HEIGHT', height: final })
        dragRef.current = null
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }

      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [dispatch, clipHeight],
  )

  const showNeighborhood = state.selected?.type === 'neighborhood'
  const expanded = state.analyticsPanelExpanded
  const currentTab = tabs.find((t) => t.key === activeTab)

  return (
    <div className="bg-card">
      {/* Drag handle */}
      <div
        onMouseDown={expanded ? onDragStart : undefined}
        className={`group flex items-center justify-center overflow-hidden hover:bg-accent/30 `}
        style={{
          height: expanded ? 8 : 0,
          cursor: expanded ? 'row-resize' : undefined,
        }}
      >
        <div className="h-0.5 w-8 rounded-full bg-muted-foreground/30 transition-colors group-hover:bg-muted-foreground/60" />
      </div>

      {/* Toggle button */}
      <button
        onClick={() => {
          const next = !expanded
          dispatch({ type: 'TOGGLE_ANALYTICS' })
          animate(clipHeight, next ? state.analyticsPanelHeight : 0, {
            type: 'tween',
            duration: 0.25,
            ease: 'easeOut',
          })
        }}
        className={`flex w-full items-center justify-between px-4 py-2 text-xs font-semibold transition-colors ${
          expanded
            ? 'border-t border-brand/30 border-b border-b-border/60 text-brand'
            : 'border-t border-brand/20 text-brand-light hover:border-brand/40 hover:text-brand'
        }`}
      >
        <span className="uppercase tracking-widest">Analytics</span>
        <span className="text-[0.6rem]">
          {expanded ? 'Collapse' : 'Expand'}
        </span>
      </button>

      {/* Tab bar */}
      {expanded && !showNeighborhood && tabs.length > 0 && (
        <div className="flex items-center gap-1 overflow-x-auto border-b border-border/40 px-4 py-1.5">
          {tabs.map((tab) => (
            <TabPill
              key={tab.key}
              active={activeTab === tab.key}
              activeColor={tab.color}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </TabPill>
          ))}
        </div>
      )}

      {/* Content */}
      <motion.div
        style={{ height: clipHeight }}
        className="overflow-hidden"
      >
        <div
          ref={contentRef}
          className="overflow-y-scroll px-4 py-3"
          style={{ height: state.analyticsPanelHeight }}
        >
          {showNeighborhood ? (
            <NeighborhoodAnalytics
              id={(state.selected as { type: 'neighborhood'; id: string }).id}
            />
          ) : currentTab ? (
            currentTab.node
          ) : (
            <div className="flex h-[120px] flex-col items-center justify-center gap-1 text-muted-foreground">
              <span className="text-xs">No layers active</span>
              <span className="text-[0.65rem]">
                Toggle layers in the left panel to see analytics
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

function TabPill({
  active,
  activeColor,
  onClick,
  children,
}: {
  active: boolean
  activeColor?: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-md px-2.5 py-1 text-[0.65rem] font-medium transition-colors ${
        active
          ? `bg-accent ${activeColor ?? 'text-accent-foreground'}`
          : 'text-muted-foreground hover:bg-accent/30 hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}
