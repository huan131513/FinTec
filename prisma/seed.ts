import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { mstrHoldings } from "./seed-data/mstr-holdings";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // 1. Create or update the MSTR company
  const company = await prisma.company.upsert({
    where: { ticker: "MSTR" },
    update: {},
    create: {
      ticker: "MSTR",
      name: "Strategy (MicroStrategy)",
      description:
        "Strategy is the largest corporate holder of Bitcoin, led by Michael Saylor.",
    },
  });
  console.log(`Company: ${company.name} (${company.id})`);

  // 2. Insert BTC holdings
  let holdingsCount = 0;
  for (const h of mstrHoldings) {
    const date = new Date(h.date + "T00:00:00.000Z");
    await prisma.btcHolding.upsert({
      where: { companyId_date: { companyId: company.id, date } },
      update: { totalBtc: h.totalBtc, source: h.source },
      create: {
        companyId: company.id,
        date,
        totalBtc: h.totalBtc,
        source: h.source,
      },
    });
    holdingsCount++;
  }
  console.log(`Inserted ${holdingsCount} BTC holding records`);

  // 3. Fetch BTC prices from CoinGecko (365 days)
  console.log("Fetching BTC prices from CoinGecko...");
  const btcRes = await fetch(
    "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=365&interval=daily",
  );
  if (!btcRes.ok) {
    console.error(`CoinGecko error: ${btcRes.status}. Skipping BTC price fetch.`);
  } else {
    const btcData = await btcRes.json();
    let btcCount = 0;
    for (const [timestamp, price] of btcData.prices) {
      const date = new Date(timestamp);
      date.setUTCHours(0, 0, 0, 0);
      await prisma.btcPrice.upsert({
        where: { date },
        update: { priceUsd: price },
        create: { date, priceUsd: price },
      });
      btcCount++;
    }
    console.log(`Inserted ${btcCount} BTC price records`);
  }

  // 4. Fetch MSTR stock prices from Yahoo Finance
  console.log("Fetching MSTR stock prices from Yahoo Finance...");
  try {
    const YahooFinance = (await import("yahoo-finance2")).default;
    const yahooFinance = new YahooFinance();
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 365);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await yahooFinance.chart("MSTR", {
      period1: startDate.toISOString().split("T")[0],
      period2: endDate.toISOString().split("T")[0],
      interval: "1d",
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quote: any = await yahooFinance.quote("MSTR");
    const sharesOutstanding = (quote?.sharesOutstanding as number) ?? 0;

    let stockCount = 0;
    for (const q of result.quotes) {
      if (!q.date || q.close == null) continue;
      const date = new Date(q.date);
      date.setUTCHours(0, 0, 0, 0);
      const closePrice = q.close;
      const marketCap =
        sharesOutstanding > 0 ? closePrice * sharesOutstanding : null;

      await prisma.stockPrice.upsert({
        where: { ticker_date: { ticker: "MSTR", date } },
        update: { closePrice, marketCap },
        create: { ticker: "MSTR", date, closePrice, marketCap },
      });
      stockCount++;
    }
    console.log(
      `Inserted ${stockCount} MSTR stock price records (shares: ${sharesOutstanding})`,
    );
  } catch (err) {
    console.error("Yahoo Finance error:", err);
  }

  // 5. Compute mNAV
  console.log("Computing mNAV...");
  const stockPrices = await prisma.stockPrice.findMany({
    where: { ticker: "MSTR" },
    orderBy: { date: "asc" },
  });
  const btcPrices = await prisma.btcPrice.findMany({
    orderBy: { date: "asc" },
  });
  const holdings = await prisma.btcHolding.findMany({
    where: { companyId: company.id },
    orderBy: { date: "asc" },
  });

  const btcPriceMap = new Map<string, number>();
  for (const bp of btcPrices) {
    btcPriceMap.set(bp.date.toISOString().split("T")[0], bp.priceUsd);
  }

  let mnavCount = 0;
  for (const sp of stockPrices) {
    if (!sp.marketCap) continue;
    const dateStr = sp.date.toISOString().split("T")[0];
    const btcPrice = btcPriceMap.get(dateStr);
    if (!btcPrice) continue;

    let currentHolding = 0;
    for (const h of holdings) {
      if (h.date <= sp.date) {
        currentHolding = h.totalBtc;
      } else {
        break;
      }
    }
    if (currentHolding === 0) continue;

    const mnav = sp.marketCap / (currentHolding * btcPrice);

    await prisma.mnavRecord.upsert({
      where: { companyId_date: { companyId: company.id, date: sp.date } },
      update: { mnav, marketCap: sp.marketCap, btcHoldings: currentHolding, btcPrice },
      create: {
        companyId: company.id,
        date: sp.date,
        mnav,
        marketCap: sp.marketCap,
        btcHoldings: currentHolding,
        btcPrice,
      },
    });
    mnavCount++;
  }
  console.log(`Computed ${mnavCount} mNAV records`);

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
