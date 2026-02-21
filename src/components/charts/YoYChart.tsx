import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

interface YoYChartProps {
  yearlyMonthly: Record<string, Record<string, number>>;
  height?: number;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const YEAR_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444"];

export function YoYChart({ yearlyMonthly, height = 300 }: YoYChartProps) {
  const years = Object.keys(yearlyMonthly).sort();

  const chartData = MONTHS.map((month, mi) => {
    const point: Record<string, string | number> = { month };
    for (const year of years) {
      const key = `${year}-${String(mi + 1).padStart(2, "0")}`;
      point[year] = yearlyMonthly[year][key] || 0;
    }
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={11} />
        <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
        <Tooltip
          contentStyle={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            fontSize: 12,
            color: "var(--color-foreground)",
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {years.map((year, i) => (
          <Line
            key={year}
            dataKey={year}
            stroke={YEAR_COLORS[i % YEAR_COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
