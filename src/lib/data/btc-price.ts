import { prisma } from "@/lib/prisma";

interface CoinGeckoMarketChart {
  prices: [number, number][];
}

export async function fetchAndStoreBtcPrices(days: number = 365) {
  const url = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}&interval=daily`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }

  const data: CoinGeckoMarketChart = await response.json();

  const records = data.prices.map(([timestamp, price]) => {
    const date = new Date(timestamp);
    date.setUTCHours(0, 0, 0, 0);
    return { date, priceUsd: price };
  });

  let upserted = 0;
  for (const record of records) {
    await prisma.btcPrice.upsert({
      where: { date: record.date },
      update: { priceUsd: record.priceUsd },
      create: record,
    });
    upserted++;
  }

  return { upserted };
}

export async function getLatestBtcPrice() {
  return prisma.btcPrice.findFirst({
    orderBy: { date: "desc" },
  });
}
