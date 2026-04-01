import { NextRequest, NextResponse } from "next/server";
import { fetchAndStoreBtcPrices } from "@/lib/data/btc-price";
import { fetchAndStoreStockPrices } from "@/lib/data/stock-price";
import { computeAndStoreMnav } from "@/lib/data/mnav-calculator";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  // Verify cron secret or API key
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Fetch BTC prices
    const btcResult = await fetchAndStoreBtcPrices(30);

    // 2. Fetch MSTR stock prices
    const stockResult = await fetchAndStoreStockPrices("MSTR", 30);

    // 3. Compute mNAV
    const company = await prisma.company.findUnique({
      where: { ticker: "MSTR" },
    });

    let mnavResult = { computed: 0 };
    if (company) {
      mnavResult = await computeAndStoreMnav(company.id, "MSTR");
    }

    return NextResponse.json({
      success: true,
      btcPrices: btcResult.upserted,
      stockPrices: stockResult.upserted,
      mnavRecords: mnavResult.computed,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Sync failed", details: String(error) },
      { status: 500 },
    );
  }
}
