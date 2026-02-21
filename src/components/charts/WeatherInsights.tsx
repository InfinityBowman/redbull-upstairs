import type { weatherInsights } from '@/lib/analysis'

export function WeatherInsights({
  weather,
}: {
  weather: ReturnType<typeof weatherInsights>
}) {
  const items = [
    {
      title: 'Rain Day Effect',
      text: `Rainy days average ${weather.rain.avgRainy} complaints vs ${weather.rain.avgDry} on dry days (${weather.rain.diff > 0 ? '+' : ''}${weather.rain.diff}%).`,
    },
    {
      title: 'Day-After Heavy Rain',
      text: `After heavy rain (>0.5 in), complaints average ${weather.afterRain.avgAfterHeavy} vs ${weather.afterRain.avgNormal} normally (${weather.afterRain.diff > 0 ? '+' : ''}${weather.afterRain.diff}%).`,
    },
    {
      title: 'Temperature Effect',
      text: `Days above 90\u00b0F average ${weather.temp.avgHot} complaints vs ${weather.temp.avgCool} below 70\u00b0F (${weather.temp.diff > 0 ? '+' : ''}${weather.temp.diff}%).`,
    },
  ]

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <div key={item.title} className="rounded-lg bg-muted p-3">
          <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">
            {item.title}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {item.text}
          </div>
        </div>
      ))}
    </div>
  )
}
