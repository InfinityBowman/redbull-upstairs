import { useMemo, useState } from 'react'
import { MapProvider } from '@/components/map/MapProvider'
import { Layer, Source } from 'react-map-gl/mapbox'
import {
  leavingReasons,
  annualMigration,
  topDestinations,
  vacancyHotspots,
} from '@/lib/migration-data'
import { cn } from '@/lib/utils'

export function AffectedNeighborhoodsDashboard() {
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<
    string | null
  >(null)

  const affectedNeighborhoods = useMemo(() => {
    return vacancyHotspots.slice(0, 5).map((v) => ({
      name: v.neighborhood,
      vacancyRate: v.rate,
      homes: v.homes,
    }))
  }, [])

  const latestMigration = annualMigration[annualMigration.length - 1]

  const handleNeighborhoodClick = (name: string) => {
    setSelectedNeighborhood(selectedNeighborhood === name ? null : name)
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center justify-between border-b border-border/60 bg-card/60 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            See Affected Neighborhoods
          </span>
        </div>
        <div className="flex items-center gap-2">
          {selectedNeighborhood && (
            <button
              onClick={() => setSelectedNeighborhood(null)}
              className="rounded bg-red-500/20 px-2 py-0.5 text-xs text-red-400 hover:bg-red-500/30"
            >
              Clear: {selectedNeighborhood}
            </button>
          )}
          <span className="text-xs text-muted-foreground">
            Migration Impact Dashboard
          </span>
        </div>
      </div>

      <div className="flex flex-1">
        <div className="relative w-1/2 min-w-[320px] border-r border-border/60">
          <MapProvider className="h-full w-full">
            <AffectedNeighborhoodsMapLayer
              selectedNeighborhood={selectedNeighborhood}
            />
          </MapProvider>

          <div className="absolute bottom-4 left-4 rounded-lg border border-border/60 bg-card/95 p-3 backdrop-blur-sm">
            <div className="mb-1 text-[0.6rem] font-semibold uppercase text-muted-foreground">
              Vacancy Rate
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-20 rounded bg-gradient-to-r from-red-300 to-red-600" />
              <span className="text-[0.55rem] text-muted-foreground">
                20% - 45%
              </span>
            </div>
          </div>
        </div>

        <div className="w-1/2 overflow-y-auto p-4">
          <div className="space-y-4">
            <MigrationSummaryCard migration={latestMigration} />
            <TopReasonsCard reasons={leavingReasons} />
            <VacancyHotspotsCard
              neighborhoods={affectedNeighborhoods}
              selectedNeighborhood={selectedNeighborhood}
              onNeighborhoodClick={handleNeighborhoodClick}
            />
            <DestinationsCard destinations={topDestinations} />
          </div>
        </div>
      </div>
    </div>
  )
}

function AffectedNeighborhoodsMapLayer({
  selectedNeighborhood,
}: {
  selectedNeighborhood: string | null
}) {
  const neighborhoodsUrl = '/data/neighborhoods.geojson'

  const affectedNames = vacancyHotspots.map((v) => v.neighborhood.toLowerCase())
  const selectedName = selectedNeighborhood?.toLowerCase()

  return (
    <>
      <Source id="affected-base" type="geojson" data={neighborhoodsUrl}>
        <Layer
          id="affected-base-fill"
          type="fill"
          beforeId="waterway-label"
          paint={{
            'fill-color': [
              'case',
              ['==', ['downcase', ['get', 'NHD_NAME']], selectedName ?? ''],
              'rgba(239, 68, 68, 0.65)',
              [
                'in',
                ['downcase', ['get', 'NHD_NAME']],
                ['literal', affectedNames],
              ],
              'rgba(239, 68, 68, 0.35)',
              'rgba(50, 50, 50, 0.15)',
            ],
            'fill-opacity': 0.8,
          }}
        />
        <Layer
          id="affected-base-outline"
          type="line"
          paint={{
            'line-color': [
              'case',
              ['==', ['downcase', ['get', 'NHD_NAME']], selectedName ?? ''],
              '#ef4444',
              [
                'in',
                ['downcase', ['get', 'NHD_NAME']],
                ['literal', affectedNames],
              ],
              'rgba(239, 68, 68, 0.6)',
              'rgba(100, 100, 100, 0.3)',
            ],
            'line-width': [
              'case',
              ['==', ['downcase', ['get', 'NHD_NAME']], selectedName ?? ''],
              3,
              [
                'in',
                ['downcase', ['get', 'NHD_NAME']],
                ['literal', affectedNames],
              ],
              1.5,
              0.5,
            ],
          }}
        />
        <Layer
          id="affected-labels"
          type="symbol"
          layout={{
            'text-field': [
              'case',
              [
                'in',
                ['downcase', ['get', 'NHD_NAME']],
                ['literal', affectedNames],
              ],
              ['get', 'NHD_NAME'],
              '',
            ],
            'text-size': 9,
            'text-anchor': 'center',
            'text-allow-overlap': false,
          }}
          paint={{
            'text-color': 'rgba(255, 255, 255, 0.9)',
            'text-halo-color': 'rgba(0, 0, 0, 0.7)',
            'text-halo-width': 1.5,
          }}
        />
      </Source>
    </>
  )
}

function MigrationSummaryCard({
  migration,
}: {
  migration: (typeof annualMigration)[0]
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
        2024 Migration Summary
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-red-500/10 p-2 text-center">
          <div className="text-lg font-bold text-red-400">
            {migration.domesticOutflow.toLocaleString()}
          </div>
          <div className="text-[0.55rem] text-muted-foreground">
            Domestic Out
          </div>
        </div>
        <div className="rounded-lg bg-emerald-500/10 p-2 text-center">
          <div className="text-lg font-bold text-emerald-400">
            +{migration.internationalInflow.toLocaleString()}
          </div>
          <div className="text-[0.55rem] text-muted-foreground">Int'l In</div>
        </div>
        <div className="rounded-lg bg-orange-500/10 p-2 text-center">
          <div className="text-lg font-bold text-orange-400">
            {migration.netChange}
          </div>
          <div className="text-[0.55rem] text-muted-foreground">Net Change</div>
        </div>
      </div>
    </div>
  )
}

function TopReasonsCard({ reasons }: { reasons: typeof leavingReasons }) {
  const topReasons = reasons.slice(0, 5)
  const maxPercentage = Math.max(...topReasons.map((r) => r.percentage))

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
        Why People Leave
      </div>
      <div className="space-y-2">
        {topReasons.map((reason) => (
          <div key={reason.reason} className="flex items-center gap-2">
            <div className="w-28 truncate text-[0.6rem] text-muted-foreground">
              {reason.reason}
            </div>
            <div className="flex-1">
              <div className="h-3 rounded bg-muted/50">
                <div
                  className="h-full rounded bg-gradient-to-r from-red-500 to-orange-400"
                  style={{
                    width: `${(reason.percentage / maxPercentage) * 100}%`,
                  }}
                />
              </div>
            </div>
            <span className="text-[0.55rem] font-semibold tabular-nums">
              {reason.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function VacancyHotspotsCard({
  neighborhoods,
  selectedNeighborhood,
  onNeighborhoodClick,
}: {
  neighborhoods: Array<{ name: string; vacancyRate: number; homes: number }>
  selectedNeighborhood: string | null
  onNeighborhoodClick: (name: string) => void
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
        Vacancy Hotspots
      </div>
      <div className="mb-2 text-[0.55rem] text-muted-foreground">
        Click a neighborhood to highlight on map
      </div>
      <div className="space-y-2">
        {neighborhoods.map((n, i) => (
          <button
            key={n.name}
            onClick={() => onNeighborhoodClick(n.name)}
            className={cn(
              'flex w-full items-center gap-2 rounded-lg p-2 text-left transition-colors',
              selectedNeighborhood === n.name
                ? 'bg-red-500/20 ring-1 ring-red-500/50'
                : 'hover:bg-muted/50',
            )}
          >
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-red-500/20 text-[0.55rem] font-bold text-red-400">
              {i + 1}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="truncate text-[0.6rem] font-medium">
                  {n.name}
                </span>
                <span className="text-[0.55rem] tabular-nums text-muted-foreground">
                  {n.homes.toLocaleString()} homes
                </span>
              </div>
              <div className="h-1.5 rounded bg-muted/50">
                <div
                  className="h-full rounded bg-red-500"
                  style={{ width: `${n.vacancyRate}%` }}
                />
              </div>
            </div>
            <span className="w-8 text-right text-[0.55rem] text-red-400">
              {n.vacancyRate}%
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function DestinationsCard({
  destinations,
}: {
  destinations: typeof topDestinations
}) {
  const maxMovers = Math.max(...destinations.map((d) => d.movers))

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
        Where They Go
      </div>
      <div className="space-y-2">
        {destinations.slice(0, 4).map((dest) => (
          <div key={dest.destination} className="flex items-center gap-2">
            <span className="w-28 truncate text-[0.6rem]">
              {dest.destination}
            </span>
            <div className="flex-1">
              <div className="h-2 rounded bg-muted/50">
                <div
                  className="h-full rounded bg-gradient-to-r from-blue-500 to-cyan-400"
                  style={{ width: `${(dest.movers / maxMovers) * 100}%` }}
                />
              </div>
            </div>
            <span className="text-[0.55rem] tabular-nums text-muted-foreground">
              {dest.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
