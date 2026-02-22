import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  SparklesIcon,
  CheckmarkCircle02Icon,
  AlertDiamondIcon,
  InformationCircleIcon,
} from '@hugeicons/core-free-icons'

interface InsightMetric {
  value: number
  change: number
  trend: 'up' | 'down' | 'stable'
}

interface NeighborhoodInsightData {
  name: string
  complaints: InsightMetric & {
    topCategory: string
    resolutionDays: number
    resolutionChange: number
  }
  transit: InsightMetric & { routesNearby: number }
  vacancy: InsightMetric & { hotspots: number }
  foodAccess: InsightMetric & { nearestGrocery: number }
  compositeScore: number
  scoreChange: number
}

function generateInsights(data: NeighborhoodInsightData): {
  summary: string
  highlights: Array<{ type: 'positive' | 'negative' | 'neutral'; text: string }>
} {
  const highlights: Array<{
    type: 'positive' | 'negative' | 'neutral'
    text: string
  }> = []

  // Score trend analysis
  if (data.scoreChange > 5) {
    highlights.push({
      type: 'positive',
      text: `Composite score up ${data.scoreChange}% from last year`,
    })
  } else if (data.scoreChange < -5) {
    highlights.push({
      type: 'negative',
      text: `Composite score down ${Math.abs(data.scoreChange)}% from last year`,
    })
  }

  // Complaints analysis
  if (data.complaints.resolutionChange > 20) {
    highlights.push({
      type: 'positive',
      text: `${data.complaints.resolutionChange}% faster resolution time for ${data.complaints.topCategory.toLowerCase()}`,
    })
  }
  if (data.complaints.change > 10) {
    highlights.push({
      type: 'negative',
      text: `${data.complaints.change}% increase in ${data.complaints.topCategory.toLowerCase()} reports`,
    })
  } else if (data.complaints.change < -10) {
    highlights.push({
      type: 'positive',
      text: `${Math.abs(data.complaints.change)}% fewer complaints this period`,
    })
  }

  // Transit analysis
  if (data.transit.routesNearby >= 5) {
    highlights.push({
      type: 'positive',
      text: `Strong transit connectivity with ${data.transit.routesNearby} routes`,
    })
  } else if (data.transit.routesNearby <= 2) {
    highlights.push({
      type: 'negative',
      text:
        'Limited transit access - only ' +
        data.transit.routesNearby +
        ' routes nearby',
    })
  }

  // Vacancy analysis
  if (data.vacancy.hotspots > 3) {
    highlights.push({
      type: 'negative',
      text: `${data.vacancy.hotspots} high-priority vacancy hotspots identified`,
    })
  } else if (data.vacancy.hotspots === 0) {
    highlights.push({
      type: 'positive',
      text: 'No critical vacancy hotspots detected',
    })
  }

  // Food access
  if (data.foodAccess.nearestGrocery > 1.5) {
    highlights.push({
      type: 'negative',
      text: 'Food access concern - nearest grocery over 1.5 miles away',
    })
  } else if (data.foodAccess.nearestGrocery <= 0.5) {
    highlights.push({
      type: 'positive',
      text: 'Excellent food access with grocery within walking distance',
    })
  }

  // Generate narrative summary
  const positiveCount = highlights.filter((h) => h.type === 'positive').length
  const negativeCount = highlights.filter((h) => h.type === 'negative').length

  let summary = ''
  if (positiveCount > negativeCount + 1) {
    summary = `${data.name} is trending positively. `
  } else if (negativeCount > positiveCount + 1) {
    summary = `${data.name} faces several challenges. `
  } else {
    summary = `${data.name} shows mixed indicators. `
  }

  // Add top insight to summary
  if (highlights.length > 0) {
    summary += highlights[0].text + '.'
  }

  return { summary, highlights }
}

function getMockInsightData(
  name: string,
  compositeScore: number,
  totalComplaints: number,
  stopsNearby: number,
  nearestGroceryDist: number,
  vacancyCount: number,
): NeighborhoodInsightData {
  // Generate deterministic but varied mock data based on neighborhood name
  const seed = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const rand = (min: number, max: number) => min + ((seed * 7) % (max - min))

  const topCategories = [
    'Street Debris',
    'Potholes',
    'Vacant Buildings',
    'Illegal Dumping',
    'Street Lights',
  ]
  const topCategory = topCategories[seed % topCategories.length]

  return {
    name,
    compositeScore,
    scoreChange: rand(-15, 20),
    complaints: {
      value: totalComplaints,
      change: rand(-25, 30),
      trend: totalComplaints > 500 ? 'up' : 'down',
      topCategory,
      resolutionDays: rand(3, 14),
      resolutionChange: rand(-30, 25),
    },
    transit: {
      value: stopsNearby,
      change: rand(-5, 10),
      trend: 'stable',
      routesNearby: stopsNearby > 5 ? rand(4, 8) : rand(1, 4),
    },
    vacancy: {
      value: vacancyCount,
      change: rand(-20, 15),
      trend: vacancyCount > 5 ? 'up' : 'down',
      hotspots: Math.max(0, vacancyCount - rand(0, 5)),
    },
    foodAccess: {
      value: nearestGroceryDist,
      change: rand(-10, 10),
      trend: 'stable',
      nearestGrocery: nearestGroceryDist,
    },
  }
}

export function AIInsightNarrative({
  name,
  compositeScore,
  totalComplaints,
  stopsNearby,
  nearestGroceryDist,
  vacancyCount,
}: {
  name: string
  compositeScore: number
  totalComplaints: number
  stopsNearby: number
  nearestGroceryDist: number
  vacancyCount: number
}) {
  const insightData = useMemo(
    () =>
      getMockInsightData(
        name,
        compositeScore,
        totalComplaints,
        stopsNearby,
        nearestGroceryDist,
        vacancyCount,
      ),
    [
      name,
      compositeScore,
      totalComplaints,
      stopsNearby,
      nearestGroceryDist,
      vacancyCount,
    ],
  )

  const insights = useMemo(() => generateInsights(insightData), [insightData])

  if (!name) return null

  return (
    <div className="rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-3">
      <div className="mb-2 flex items-center gap-1.5">
        <HugeiconsIcon
          icon={SparklesIcon}
          className="h-3.5 w-3.5 text-primary"
          stroke="currentColor"
        />
        <span className="text-[0.65rem] font-bold uppercase tracking-wider text-primary">
          AI Insights
        </span>
      </div>

      <p className="mb-2 text-xs leading-relaxed text-foreground/90">
        {insights.summary}
      </p>

      <div className="space-y-1">
        {insights.highlights.slice(0, 3).map((highlight, i) => (
          <div
            key={i}
            className={cn(
              'flex items-start gap-1.5 text-[0.65rem]',
              highlight.type === 'positive' &&
                'text-emerald-600 dark:text-emerald-400',
              highlight.type === 'negative' && 'text-red-600 dark:text-red-400',
              highlight.type === 'neutral' && 'text-muted-foreground',
            )}
          >
            <span className="mt-0.5 shrink-0">
              {highlight.type === 'positive' && (
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} />
              )}
              {highlight.type === 'negative' && (
                <HugeiconsIcon icon={AlertDiamondIcon} size={12} />
              )}
              {highlight.type === 'neutral' && (
                <HugeiconsIcon icon={InformationCircleIcon} size={12} />
              )}
            </span>
            <span>{highlight.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
