import { prisma } from "@/lib/prisma";
import { YahooFinance } from "yahoo-finance2";
const yahooFinance = new YahooFinance();

export async function fetchAndStoreStockPrices(
  ticker: string = "MSTR",
  days: number = 365,
) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = await yahooFinance.chart(ticker, {
    period1: startDate.toISOString().split("T")[0],
    period2: endDate.toISOString().split("T")[0],
    interval: "1d",
  });

  if (!result.quotes || result.quotes.length === 0) {
    throw new Error(`No stock data returned for ${ticker}`);
  }

  // Get current shares outstanding for market cap calculation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const quote: any = await yahooFinance.quote(ticker);
  const sharesOutstanding = (quote?.sharesOutstanding as number) ?? 0;

  let upserted = 0;
  for (const q of result.quotes) {
    if (!q.date || q.close == null) continue;

    const date = new Date(q.date);
    date.setUTCHours(0, 0, 0, 0);
    const closePrice = q.close;
    const marketCap = sharesOutstanding > 0 ? closePrice * sharesOutstanding : null;

    await prisma.stockPrice.upsert({
      where: { ticker_date: { ticker, date } },
      update: { closePrice, marketCap },
      create: { ticker, date, closePrice, marketCap },
    });
    upserted++;
  }

  return { upserted, sharesOutstanding };
}

export async function getLatestStockPrice(ticker: string = "MSTR") {
  return prisma.stockPrice.findFirst({
    where: { ticker },
    orderBy: { date: "desc" },
  });
}
