export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { fetchAndStoreBtcPrices } from "@/lib/data/btc-price";
import { fetchAndStoreStockPrices } from "@/lib/data/stock-price";
import { computeAndStoreMnav } from "@/lib/data/mnav-calculator";

/**
 * Auto-sync: if the latest mNAV record is older than yesterday,
 * fetch the last 7 days of data from CoinGecko + Yahoo Finance and recompute.
 * Runs silently — errors are logged but never break the page render.
 */
async function syncIfStale() {
  const latest = await prisma.mnavRecord.findFirst({
    orderBy: { date: "desc" },
    select: { date: true },
  });

  // Consider data stale if it's from 2+ days ago (allows for yesterday's close)
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  yesterday.setUTCHours(0, 0, 0, 0);

  if (!latest || latest.date < yesterday) {
    console.log("[auto-sync] Data is stale, fetching latest 7 days…");
    try {
      await fetchAndStoreBtcPrices(7);
      await fetchAndStoreStockPrices("MSTR", 7);
      const company = await prisma.company.findUnique({
        where: { ticker: "MSTR" },
      });
      if (company) {
        await computeAndStoreMnav(company.id, "MSTR");
      }
      console.log("[auto-sync] Done.");
    } catch (err) {
      console.error("[auto-sync] Failed:", err);
      // Don't throw — show whatever data is already in the DB
    }
  }
}

async function getMnavData() {
  const company = await prisma.company.findUnique({
    where: { ticker: "MSTR" },
  });

  if (!company) {
    return { company: null, data: [] };
  }

  const records = await prisma.mnavRecord.findMany({
    where: { companyId: company.id },
    orderBy: { date: "asc" },
    select: {
      date: true,
      mnav: true,
      marketCap: true,
      btcHoldings: true,
      btcPrice: true,
    },
  });

  return {
    company: { ticker: company.ticker, name: company.name },
    data: records.map((r) => {
      const mnav = Math.round(r.mnav * 100) / 100;
      return {
        date: r.date.toISOString().split("T")[0],
        mnav,
        btcPrice: Math.round(r.btcPrice),
        marketCap: r.marketCap,
        btcHoldings: r.btcHoldings,
        premiumPct: Math.round((mnav - 1) * 10000) / 100,
      };
    }),
  };
}

export default async function Home() {
  await syncIfStale();
  const { data } = await getMnavData();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <Dashboard allData={data} />
      </main>
      <footer className="border-t border-card-border py-4 text-center text-xs text-muted">
        FinTec mNAV Monitor &middot; Data: CoinGecko &amp; Yahoo Finance
      </footer>
    </div>
  );
}
