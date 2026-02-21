import { CHORO_COLORS } from "@/lib/colors";

interface LegendItem {
  color: string;
  label: string;
}

interface MapLegendProps {
  title: string;
  items?: LegendItem[];
  gradient?: boolean;
}

export function MapLegend({ title, items, gradient }: MapLegendProps) {
  return (
    <div className="absolute right-3 bottom-8 z-10 min-w-[140px] rounded-lg border border-border/60 bg-card/95 p-3 text-xs shadow-lg backdrop-blur-sm">
      <div className="mb-1.5 text-xs font-bold text-foreground">{title}</div>
      {gradient ? (
        <div className="flex flex-col gap-1">
          <div
            className="h-3 w-20 rounded-sm"
            style={{
              background: `linear-gradient(to right, ${CHORO_COLORS.join(", ")})`,
            }}
          />
          <div className="flex w-20 justify-between">
            <span className="text-muted-foreground">Low</span>
            <span className="text-muted-foreground">High</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {items?.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div
                className="h-3 w-4.5 shrink-0 rounded-sm"
                style={{ background: item.color }}
              />
              <span className="text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
