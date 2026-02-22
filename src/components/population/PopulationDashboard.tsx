<<<<<<< HEAD
=======
import { useState } from 'react'
>>>>>>> 32296c2 (your commit message)
import { Link } from '@tanstack/react-router'
import { EducationCard } from './EducationCard'
import { DemographicsCard } from './DemographicsCard'
import { HousingCard } from './HousingCard'
import { InfrastructureCard } from './InfrastructureCard'
<<<<<<< HEAD

export function PopulationDashboard() {
  return (
    <div className="flex flex-col">
      <div className="border-b border-border/60 bg-gradient-to-r from-card to-card/50 px-6 py-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          STL Population: The Exodus & The Offset
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Understanding the drivers of population change in St. Louis
        </p>
      </div>

      <div className="relative p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <EducationCard />
          <DemographicsCard />
          <HousingCard />
          <InfrastructureCard />
        </div>

        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <MigrationBadge />
        </div>
=======
import { MigrationReasonsCard } from './MigrationReasonsCard'
import { DestinationsCard } from './DestinationsCard'
import { PopulationHistoryChart } from './PopulationHistoryChart'
import { MigrationFlowChart } from './MigrationFlowChart'
import {
  getPopulationStats,
  decadeSummaries,
  keyMilestones,
} from '@/lib/population-history'
import { cn } from '@/lib/utils'

type TabView = 'overview' | 'history' | 'migration'

export function PopulationDashboard() {
  const [activeTab, setActiveTab] = useState<TabView>('overview')
  const stats = getPopulationStats()

  return (
    <div className="flex flex-col">
      <div className="border-b border-border/60 bg-gradient-to-r from-card to-card/50 px-6 py-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              STL Population: The Exodus & The Offset
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Understanding the drivers of population change in St. Louis
            </p>
          </div>
          <div className="flex gap-0.5 rounded-lg bg-muted/50 p-0.5">
            {(['overview', 'history', 'migration'] as TabView[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-colors capitalize',
                  activeTab === tab
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'migration' && <MigrationTab />}
>>>>>>> 32296c2 (your commit message)
      </div>

      <div className="border-t border-border/60 bg-muted/30 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground">
<<<<<<< HEAD
            Data sources: US Census Bureau, SLMPD, SLPS, 311 Service Center
=======
            Data sources: US Census Bureau (1790-2024), IRS Migration Data,
            SLPS, SLMPD, Missouri Dept. of Education
>>>>>>> 32296c2 (your commit message)
          </div>
          <Link
            to="/"
            search={{ highlight: 'outflow' }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle
                cx="8"
                cy="8"
                r="6"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M8 5v3l2 2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            See Affected Neighborhoods
          </Link>
        </div>
      </div>
    </div>
  )
}

<<<<<<< HEAD
function MigrationBadge() {
  return (
    <div className="pointer-events-auto flex flex-col items-center rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/90 to-emerald-900/80 px-4 py-3 shadow-lg backdrop-blur-sm">
=======
function OverviewTab() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MigrationReasonsCard />
        <EducationCard />
        <DemographicsCard />
        <HousingCard />
        <InfrastructureCard className="lg:col-span-2" />
      </div>
      <div className="flex flex-col gap-4">
        <DestinationsCard />
        <QuickStats />
      </div>
    </div>
  )
}

function HistoryTab() {
  const stats = getPopulationStats()

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <PopulationHistoryChart />
        <DecadeBreakdown />
      </div>
      <div className="space-y-4">
        <QuickStats />
        <KeyMilestones />
      </div>
    </div>
  )
}

function MigrationTab() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <MigrationFlowChart />
      <MigrationReasonsCard />
      <DestinationsCard />
      <QuickStats />
    </div>
  )
}

function QuickStats() {
  const stats = getPopulationStats()

  return (
    <div className="flex flex-col items-center rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/90 to-emerald-900/80 px-4 py-4 shadow-lg backdrop-blur-sm">
>>>>>>> 32296c2 (your commit message)
      <div className="flex items-center gap-1.5 text-[0.6rem] font-bold uppercase tracking-wider text-emerald-400/80">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 2L14 8L8 14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 8H14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        International Migration Offset
      </div>
<<<<<<< HEAD
      <div className="mt-1 text-xl font-extrabold tabular-nums text-emerald-400">
        +12,375
      </div>
      <div className="text-[0.55rem] text-emerald-400/60">
        Preventing total population crash
=======
      <div className="mt-1 text-2xl font-extrabold tabular-nums text-emerald-400">
        +{stats.current.year === 2024 ? '4,125' : '3,475'}
      </div>
      <div className="text-[0.55rem] text-center text-emerald-400/60">
        Only factor preventing total population crash
      </div>
      <div className="mt-2 rounded bg-red-500/20 px-2 py-1 text-[0.6rem] text-red-300">
        Domestic outflow: -4,850/yr
      </div>
      <div className="mt-3 grid w-full grid-cols-2 gap-2 border-t border-emerald-500/20 pt-3">
        <div className="text-center">
          <div className="text-lg font-bold text-white">
            {stats.peak.population.toLocaleString()}
          </div>
          <div className="text-[0.5rem] text-emerald-400/60">
            Peak ({stats.peak.year})
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-white">
            {stats.current.population.toLocaleString()}
          </div>
          <div className="text-[0.5rem] text-emerald-400/60">Current</div>
        </div>
      </div>
      <div className="mt-2 w-full rounded bg-white/10 px-2 py-1.5 text-center">
        <div className="text-sm font-bold text-red-400">
          -{stats.declinePercent}%
        </div>
        <div className="text-[0.5rem] text-white/60">
          Decline from peak ({stats.yearsSincePeak} years)
        </div>
      </div>
    </div>
  )
}

function DecadeBreakdown() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <h3 className="mb-3 text-sm font-bold">Decade Summary</h3>
      <div className="space-y-2">
        {decadeSummaries
          .slice()
          .reverse()
          .map((decade) => (
            <div
              key={decade.decade}
              className={cn(
                'flex items-center gap-3 rounded-lg p-2',
                decade.change < 0 ? 'bg-red-500/5' : 'bg-emerald-500/5',
              )}
            >
              <div className="w-14 text-[0.65rem] font-semibold">
                {decade.decade}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded bg-muted/50">
                    <div
                      className={cn(
                        'h-full rounded',
                        decade.change < 0 ? 'bg-red-500' : 'bg-emerald-500',
                      )}
                      style={{
                        width: `${Math.min(Math.abs(decade.changePercent), 100)}%`,
                      }}
                    />
                  </div>
                  <span
                    className={cn(
                      'w-16 text-right text-[0.6rem] font-semibold tabular-nums',
                      decade.change < 0 ? 'text-red-400' : 'text-emerald-400',
                    )}
                  >
                    {decade.change > 0 ? '+' : ''}
                    {decade.changePercent.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-0.5 text-[0.55rem] text-muted-foreground">
                  {decade.keyEvents.slice(0, 2).join(' • ')}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}

function KeyMilestones() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <h3 className="mb-3 text-sm font-bold">Key Milestones</h3>
      <div className="space-y-2">
        {keyMilestones.slice(-8).map((m) => (
          <div key={m.year} className="flex gap-2">
            <div className="w-10 shrink-0 text-[0.6rem] font-semibold text-primary">
              {m.year}
            </div>
            <div className="text-[0.6rem] text-muted-foreground">{m.event}</div>
          </div>
        ))}
>>>>>>> 32296c2 (your commit message)
      </div>
    </div>
  )
}
