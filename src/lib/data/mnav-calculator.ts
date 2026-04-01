import { prisma } from "@/lib/prisma";

export async function computeAndStoreMnav(
  companyId: string,
  ticker: string = "MSTR",
) {
  // Get all stock prices
  const stockPrices = await prisma.stockPrice.findMany({
    where: { ticker },
    orderBy: { date: "asc" },
  });

  // Get all BTC prices
  const btcPrices = await prisma.btcPrice.findMany({
    orderBy: { date: "asc" },
  });

  // Get all BTC holdings for this company, sorted by date
  const holdings = await prisma.btcHolding.findMany({
    where: { companyId },
    orderBy: { date: "asc" },
  });

  if (holdings.length === 0) {
    throw new Error("No BTC holdings data found");
  }

  // Create a map of BTC prices by date string
  const btcPriceMap = new Map<string, number>();
  for (const bp of btcPrices) {
    btcPriceMap.set(bp.date.toISOString().split("T")[0], bp.priceUsd);
  }

  // For each stock price date, compute mNAV
  let computed = 0;
  for (const sp of stockPrices) {
    if (!sp.marketCap) continue;

    const dateStr = sp.date.toISOString().split("T")[0];
    const btcPrice = btcPriceMap.get(dateStr);
    if (!btcPrice) continue;

    // Forward-fill: find the most recent holding <= this date
    let currentHolding = 0;
    for (const h of holdings) {
      if (h.date <= sp.date) {
        currentHolding = h.totalBtc;
      } else {
        break;
      }
    }

    if (currentHolding === 0) continue;

    const btcValue = currentHolding * btcPrice;
    const mnav = sp.marketCap / btcValue;

    await prisma.mnavRecord.upsert({
      where: { companyId_date: { companyId, date: sp.date } },
      update: { mnav, marketCap: sp.marketCap, btcHoldings: currentHolding, btcPrice },
      create: {
        companyId,
        date: sp.date,
        mnav,
        marketCap: sp.marketCap,
        btcHoldings: currentHolding,
        btcPrice,
      },
    });
    computed++;
  }

  return { computed };
}
