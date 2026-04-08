import { Card } from "@/components/ui/Card";

interface StatsCardsProps {
  currentMnav: number;
  btcPrice: number;
  marketCap: number;
  btcHoldings: number;
  mnavChange?: number;
  premiumPct: number;
}

function formatNumber(num: number): string {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toLocaleString()}`;
}

function formatBtc(num: number): string {
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

export function StatsCards({
  currentMnav,
  btcPrice,
  marketCap,
  btcHoldings,
  mnavChange,
  premiumPct,
}: StatsCardsProps) {
  const isPremium = premiumPct >= 0;
  const stats = [
    {
      label: "mNAV",
      value: currentMnav.toFixed(2) + "x",
      change: mnavChange,
      description: isPremium ? "Trading at premium" : "Trading at discount",
      color: isPremium ? "text-green-400" : "text-red-400",
    },
    {
      label: "Premium to NAV",
      value: isPremium ? `+${premiumPct.toFixed(2)}%` : "—",
      description: "Above BTC NAV",
      color: "text-green-400",
    },
    {
      label: "Discount to NAV",
      value: !isPremium ? `${Math.abs(premiumPct).toFixed(2)}%` : "—",
      description: "Below BTC NAV",
      color: "text-red-400",
    },
    {
      label: "BTC Price",
      value: formatNumber(btcPrice),
      description: "Bitcoin USD",
      color: "text-accent-secondary",
    },
    {
      label: "Market Cap",
      value: formatNumber(marketCap),
      description: "MSTR",
      color: "text-accent",
    },
    {
      label: "BTC Holdings",
      value: formatBtc(btcHoldings) + " BTC",
      description: "Total held",
      color: "text-accent-secondary",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <p className="text-sm text-muted">{stat.label}</p>
          <p className={`mt-1 text-2xl font-bold ${stat.color}`}>
            {stat.value}
          </p>
          <div className="mt-1 flex items-center gap-2">
            {stat.change !== undefined && (
              <span
                className={`text-sm font-medium ${
                  stat.change >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {stat.change >= 0 ? "+" : ""}
                {stat.change.toFixed(1)}%
              </span>
            )}
            <span className="text-xs text-muted">{stat.description}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}
