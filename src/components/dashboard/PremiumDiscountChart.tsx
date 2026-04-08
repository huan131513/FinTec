"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from "recharts";

interface DataPoint {
  date: string;
  premiumPct: number;
}

interface PremiumDiscountChartProps {
  data: DataPoint[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const val = payload[0].value;
  const isPremium = val >= 0;
  return (
    <div className="rounded-xl border border-card-border bg-[#1e1e2e] px-4 py-3 shadow-xl">
      <p className="mb-1 text-sm font-medium text-foreground">{label}</p>
      <p className="text-sm">
        <span className="text-muted">{isPremium ? "Premium: " : "Discount: "}</span>
        <span className={`font-semibold ${isPremium ? "text-green-400" : "text-red-400"}`}>
          {isPremium ? "+" : ""}
          {val.toFixed(2)}%
        </span>
      </p>
    </div>
  );
}

export function PremiumDiscountChart({ data }: PremiumDiscountChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-2xl border border-card-border bg-card">
        <p className="text-muted">No data available</p>
      </div>
    );
  }

  const values = data.map((d) => d.premiumPct);
  const absMax = Math.ceil(Math.max(...values.map(Math.abs)) / 10) * 10 + 5;

  return (
    <div className="rounded-2xl border border-card-border bg-card p-4">
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />

          <XAxis
            dataKey="date"
            tick={{ fill: "#6b7280", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "#1f2937" }}
            tickFormatter={(value: string) => {
              const d = new Date(value);
              return `${d.getMonth() + 1}/${d.getDate()}`;
            }}
            interval="preserveStartEnd"
            minTickGap={50}
          />

          <YAxis
            domain={[-absMax, absMax]}
            tick={{ fill: "#6b7280", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${v.toFixed(0)}%`}
            width={55}
          />

          <Tooltip content={<CustomTooltip />} />

          <ReferenceLine y={0} stroke="#374151" strokeWidth={1.5} />

          <Bar dataKey="premiumPct" name="Premium/Discount" radius={[2, 2, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.premiumPct >= 0 ? "#22c55e" : "#ef4444"}
                fillOpacity={0.8}
              />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
