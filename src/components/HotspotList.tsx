import { cn } from '@/lib/utils'

interface HotspotItem {
  name: string
  total: number
  ratio: number
  avgResolutionDays?: number
  topCategories?: Record<string, number>
}

interface HotspotListProps {
  title: string
  items: Array<HotspotItem>
  type: 'volume' | 'slow'
}

export function HotspotList({ title, items, type }: HotspotListProps) {
  return (
    <div>
      <div
        className={cn(
          'mb-2 text-xs font-bold uppercase tracking-wider',
          type === 'volume' ? 'text-red-500' : 'text-amber-500',
        )}
      >
        {title}
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const topCat = item.topCategories
            ? Object.entries(item.topCategories).sort((a, b) => b[1] - a[1])[0]
            : null

          return (
            <div
              key={item.name}
              className={cn(
                'rounded-lg bg-muted p-3',
                type === 'volume'
                  ? 'border-l-[3px] border-l-red-500'
                  : 'border-l-[3px] border-l-amber-500',
              )}
            >
              <div className="text-sm font-semibold">{item.name}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {type === 'volume' ? (
                  <>
                    {item.total.toLocaleString()} complaints &mdash;{' '}
                    {item.ratio}x city avg
                    {topCat && (
                      <div>
                        Top issue: {topCat[0]} ({topCat[1]})
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {item.avgResolutionDays}d avg resolution &mdash;{' '}
                    {item.ratio}x city avg
                    <div>{item.total} total, closed status tracked</div>
                  </>
                )}
              </div>
              <span
                className={cn(
                  'mt-1 inline-block rounded px-2 py-0.5 text-[0.65rem] font-bold',
                  type === 'volume'
                    ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
                )}
              >
                {item.ratio}x AVG {type === 'volume' ? 'VOLUME' : 'WAIT'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
