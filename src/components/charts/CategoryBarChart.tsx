import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { CATEGORY_COLORS } from "@/lib/colors";

interface CategoryBarChartProps {
  data: { name: string; value: number }[];
  horizontal?: boolean;
  height?: number;
}

export function CategoryBarChart({
  data,
  horizontal = true,
  height = 350,
}: CategoryBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ left: horizontal ? 10 : 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        {horizontal ? (
          <>
            <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={11} />
            <YAxis
              type="category"
              dataKey="name"
              stroke="var(--color-muted-foreground)"
              fontSize={11}
              width={160}
              tick={{ fill: "var(--color-muted-foreground)" }}
            />
          </>
        ) : (
          <>
            <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} />
            <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
          </>
        )}
        <Tooltip
          contentStyle={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            fontSize: 12,
            color: "var(--color-foreground)",
          }}
        />
        <Bar dataKey="value" radius={[4, 4, 4, 4]}>
          {data.map((_, i) => (
            <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length] + "99"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
