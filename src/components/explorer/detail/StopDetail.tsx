import { useMemo } from 'react'
import { useData } from '../ExplorerProvider'

export function StopDetail({ id }: { id: string }) {
  const data = useData()

  const stop = useMemo(
    () => data.stops?.features.find((f) => f.properties.stop_id === id) ?? null,
    [data.stops, id],
  )

  const stats = data.stopStats?.[id]

  const routeDetails = useMemo(() => {
    if (!stats?.routes || !data.routes) return []
    return data.routes.filter((r) => stats.routes.includes(r.route_id))
  }, [stats, data.routes])

  if (!stop) {
    return <div className="text-xs text-muted-foreground">Stop not found</div>
  }

  const [lon, lat] = stop.geometry.coordinates as Array<number>

  return (
    <div className="flex flex-col gap-2 text-xs">
      <div className="text-base font-bold">
        {stop.properties.stop_name || `Stop ${id}`}
      </div>

      <DetailRow label="Stop ID" value={id} />
      <DetailRow
        label="Location"
        value={`${lat.toFixed(4)}, ${lon.toFixed(4)}`}
      />
      <DetailRow label="Daily Trips" value={String(stats?.trip_count ?? 0)} />
      <DetailRow label="Routes Served" value={String(routeDetails.length)} />

      {routeDetails.length > 0 && (
        <div className="mt-2 rounded-lg bg-muted p-3">
          <div className="mb-2 text-xs font-semibold">Routes</div>
          <div className="flex flex-col gap-1.5">
            {routeDetails.map((r) => (
              <div key={r.route_id} className="flex items-center gap-2">
                <span
                  className="flex h-5 w-8 items-center justify-center rounded text-[0.6rem] font-bold text-white"
                  style={{
                    background: r.route_color ? `#${r.route_color}` : '#a78bfa',
                  }}
                >
                  {r.route_short_name || r.route_id}
                </span>
                <span className="text-[0.65rem] text-muted-foreground">
                  {r.route_long_name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border/50 py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
