"use client";

import { useState, useMemo } from "react";
import { MnavChart } from "./MnavChart";
import { PremiumDiscountChart } from "./PremiumDiscountChart";
import { StatsCards } from "./StatsCards";
import { TimeRangeSelector } from "./TimeRangeSelector";
import { AiSummary } from "./AiSummary";
import { subDays } from "date-fns";

interface MnavDataPoint {
  date: string;
  mnav: number;
  btcPrice: number;
  marketCap: number;
  btcHoldings: number;
  premiumPct: number;
}

interface DashboardProps {
  allData: MnavDataPoint[];
}

function filterByRange(data: MnavDataPoint[], range: string): MnavDataPoint[] {
  if (range === "all") return data;

  const now = new Date();
  let startDate: Date;
  switch (range) {
    case "7d":
      startDate = subDays(now, 7);
      break;
    case "30d":
      startDate = subDays(now, 30);
      break;
    case "90d":
      startDate = subDays(now, 90);
      break;
    case "1y":
      startDate = subDays(now, 365);
      break;
    default:
      startDate = subDays(now, 365);
  }

  const startStr = startDate.toISOString().split("T")[0];
  return data.filter((d) => d.date >= startStr);
}

export function Dashboard({ allData }: DashboardProps) {
  const [range, setRange] = useState("1y");

  const filteredData = useMemo(
    () => filterByRange(allData, range),
    [allData, range],
  );

  // Get latest data point for stats
  const latest = filteredData.length > 0
    ? filteredData[filteredData.length - 1]
    : null;

  // Calculate mNAV change over the period
  const mnavChange = useMemo(() => {
    if (filteredData.length < 2) return undefined;
    const first = filteredData[0].mnav;
    const last = filteredData[filteredData.length - 1].mnav;
    return ((last - first) / first) * 100;
  }, [filteredData]);

  if (allData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-2xl border border-card-border bg-card p-10 text-center">
          <h2 className="text-xl font-semibold text-foreground">No Data Available</h2>
          <p className="mt-2 text-muted">
            Run the seed script to populate the database:
          </p>
          <code className="mt-4 block rounded-xl bg-background px-4 py-2 text-sm text-accent">
            npx prisma db seed
          </code>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <StatsCards
        currentMnav={latest?.mnav ?? 0}
        btcPrice={latest?.btcPrice ?? 0}
        marketCap={latest?.marketCap ?? 0}
        btcHoldings={latest?.btcHoldings ?? 0}
        mnavChange={mnavChange}
        premiumPct={latest?.premiumPct ?? 0}
      />

      {/* Chart Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            mNAV Over Time
          </h2>
          <TimeRangeSelector selected={range} onChange={setRange} />
        </div>
        <MnavChart data={filteredData} />
      </div>

      {/* Premium / Discount Chart */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-foreground">
          Premium / Discount to NAV
        </h2>
        <PremiumDiscountChart data={filteredData} />
      </div>

      {/* AI Insight Section */}
      <AiSummary data={filteredData} range={range} />

      {/* Info Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-card-border bg-card p-6">
          <h3 className="text-sm font-semibold text-foreground">What is mNAV?</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            mNAV (Modified Net Asset Value) measures the ratio of a company&apos;s
            market capitalization to the value of its Bitcoin holdings. An mNAV
            above 1.0x indicates the market values the company at a{" "}
            <span className="text-green-400">premium</span> to its Bitcoin, while
            below 1.0x indicates a{" "}
            <span className="text-red-400">discount</span>.
          </p>
        </div>
        <div className="rounded-2xl border border-card-border bg-card p-6">
          <h3 className="text-sm font-semibold text-foreground">Formula</h3>
          <div className="mt-3 rounded-xl bg-background px-4 py-3 font-mono text-sm">
            <span className="text-accent">mNAV</span>{" "}
            <span className="text-muted">= </span>
            <span className="text-foreground">Market Cap</span>{" "}
            <span className="text-muted">/ (</span>
            <span className="text-accent-secondary">BTC Holdings</span>{" "}
            <span className="text-muted">&times;</span>{" "}
            <span className="text-accent-secondary">BTC Price</span>
            <span className="text-muted">)</span>
          </div>
          <p className="mt-2 text-xs text-muted">
            Data source: CoinGecko (BTC) &amp; Yahoo Finance (MSTR)
          </p>
        </div>
      </div>
    </div>
  );
}
