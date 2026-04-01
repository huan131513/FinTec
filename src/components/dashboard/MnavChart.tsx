"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Legend,
} from "recharts";

interface MnavDataPoint {
  date: string;
  mnav: number;
  btcPrice: number;
  marketCap: number;
  btcHoldings: number;
}

interface MnavChartProps {
  data: MnavDataPoint[];
}

function formatNumber(num: number): string {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
  return `$${num.toLocaleString()}`;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const mnavEntry = payload.find((p) => p.name === "mNAV");
  const btcEntry = payload.find((p) => p.name === "BTC Price");

  return (
    <div className="rounded-xl border border-card-border bg-[#1e1e2e] px-4 py-3 shadow-xl">
      <p className="mb-2 text-sm font-medium text-foreground">{label}</p>
      {mnavEntry && (
        <p className="text-sm">
          <span className="text-muted">mNAV: </span>
          <span className="font-semibold text-accent">
            {mnavEntry.value.toFixed(2)}x
          </span>
        </p>
      )}
      {btcEntry && (
        <p className="text-sm">
          <span className="text-muted">BTC: </span>
          <span className="font-semibold text-accent-secondary">
            ${btcEntry.value.toLocaleString()}
          </span>
        </p>
      )}
    </div>
  );
}

export function MnavChart({ data }: MnavChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-2xl border border-card-border bg-card">
        <p className="text-muted">No data available</p>
      </div>
    );
  }

  // Calculate Y-axis domains
  const mnavValues = data.map((d) => d.mnav);
  const mnavMin = Math.max(0, Math.floor(Math.min(...mnavValues) * 10) / 10 - 0.2);
  const mnavMax = Math.ceil(Math.max(...mnavValues) * 10) / 10 + 0.2;

  return (
    <div className="rounded-2xl border border-card-border bg-card p-4">
      <ResponsiveContainer width="100%" height={420}>
        <ComposedChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="mnavGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#1f2937"
            vertical={false}
          />

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
            yAxisId="mnav"
            domain={[mnavMin, mnavMax]}
            tick={{ fill: "#3b82f6", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v.toFixed(1)}x`}
            width={55}
          />

          <YAxis
            yAxisId="btc"
            orientation="right"
            tick={{ fill: "#f59e0b", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`}
            width={60}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            wrapperStyle={{ paddingTop: 16 }}
            formatter={(value: string) => (
              <span className="text-sm text-muted">{value}</span>
            )}
          />

          <ReferenceLine
            yAxisId="mnav"
            y={1}
            stroke="#ef4444"
            strokeDasharray="6 4"
            strokeWidth={1.5}
            label={{
              value: "NAV = 1.0x",
              position: "insideTopRight",
              fill: "#ef4444",
              fontSize: 11,
            }}
          />

          <Area
            yAxisId="mnav"
            type="monotone"
            dataKey="mnav"
            stroke="transparent"
            fill="url(#mnavGradient)"
            name="mNAV"
          />

          <Line
            yAxisId="mnav"
            type="monotone"
            dataKey="mnav"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, fill: "#3b82f6", stroke: "#0a0a0f", strokeWidth: 2 }}
            name="mNAV"
          />

          <Line
            yAxisId="btc"
            type="monotone"
            dataKey="btcPrice"
            stroke="#f59e0b"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 5, fill: "#f59e0b", stroke: "#0a0a0f", strokeWidth: 2 }}
            name="BTC Price"
            strokeDasharray="4 2"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
