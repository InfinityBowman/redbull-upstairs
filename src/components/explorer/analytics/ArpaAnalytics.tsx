import { useMemo } from 'react'
import { useData, useFailedDatasets } from '../ExplorerProvider'
import { MiniKpi } from './MiniKpi'
import { TimeSeriesChart } from '@/components/charts/TimeSeriesChart'
import { CategoryBarChart } from '@/components/charts/CategoryBarChart'

export function ArpaAnalytics() {
  const data = useData()
  const failed = useFailedDatasets()

  const kpis = useMemo(() => {
    if (!data.arpaData) return null
    const d = data.arpaData
    const months = Object.keys(d.monthlySpending)
    const dateRange =
      months.length > 0
        ? `${months[0]} - ${months[months.length - 1]}`
        : 'N/A'
    return {
      totalSpent: d.totalSpent,
      transactions: d.transactionCount,
      projects: d.projects.length,
      dateRange,
    }
  }, [data.arpaData])

  const spendingChart = useMemo(() => {
    if (!data.arpaData) return []
    return Object.entries(data.arpaData.monthlySpending)
      .sort()
      .map(([date, value]) => ({
        date,
        value: Math.round(value / 1000), // in thousands
        ma7: Math.round((data.arpaData!.cumulativeSpending[date] ?? 0) / 1000000), // cumulative in millions
      }))
  }, [data.arpaData])

  const categoryChart = useMemo(
    () =>
      data.arpaData
        ? Object.entries(data.arpaData.categoryBreakdown)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, value]) => ({
              name,
              value: Math.round(value / 1000),
            }))
        : [],
    [data.arpaData],
  )

  if (!data.arpaData || !kpis) {
    if (failed.has('arpa')) {
      return (
        <div className="text-xs text-muted-foreground">ARPA data unavailable.</div>
      )
    }
    return (
      <div className="text-xs text-muted-foreground">Loading ARPA data...</div>
    )
  }

  const fmt = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
    return `$${n}`
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-4 gap-2">
        <MiniKpi label="Total Spent" value={fmt(kpis.totalSpent)} />
        <MiniKpi label="Transactions" value={kpis.transactions.toLocaleString()} />
        <MiniKpi label="Projects" value={String(kpis.projects)} />
        <MiniKpi label="Period" value={kpis.dateRange} />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr]">
        <div className="h-[180px] overflow-hidden">
          <TimeSeriesChart
            data={spendingChart}
            barLabel="Monthly ($K)"
            lineLabel="Cumulative ($M)"
            height={180}
            dualAxis
          />
        </div>
        <div className="h-[180px] overflow-hidden">
          <CategoryBarChart data={categoryChart} horizontal height={180} valueLabel="Spent ($K)" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <div className="mb-1 text-[0.6rem] font-semibold text-muted-foreground">
            Top Vendors
          </div>
          <div className="flex flex-col gap-1">
            {data.arpaData.topVendors.slice(0, 8).map((v) => (
              <div
                key={v.name}
                className="flex items-center justify-between text-[0.6rem]"
              >
                <span className="truncate mr-2">{v.name}</span>
                <span className="font-bold text-emerald-400 shrink-0">
                  {fmt(v.totalSpent)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1 text-[0.6rem] font-semibold text-muted-foreground">
            Top Projects
          </div>
          <div className="flex flex-col gap-1">
            {data.arpaData.projects.slice(0, 8).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between text-[0.6rem]"
              >
                <span className="truncate mr-2">{p.title || `Project #${p.id}`}</span>
                <span className="font-bold text-emerald-400 shrink-0">
                  {fmt(p.totalSpent)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

