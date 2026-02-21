import { CategoryBarChart } from './CategoryBarChart'

export function WeekdayChart({
  weekday,
  height = 300,
}: {
  weekday: Record<string, number>
  height?: number
}) {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const pythonOrder = [6, 0, 1, 2, 3, 4, 5]
  const data = dayNames.map((name, i) => ({
    name,
    value: weekday[String(pythonOrder[i])] || 0,
  }))

  return <CategoryBarChart data={data} horizontal={false} height={height} />
}
