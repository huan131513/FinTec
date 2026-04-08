export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { Dashboard } from "@/components/dashboard/Dashboard";

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
