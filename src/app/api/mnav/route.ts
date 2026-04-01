import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const ticker = searchParams.get("ticker") || "MSTR";
  const range = searchParams.get("range") || "1y";

  // Calculate start date based on range
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
    case "all":
      startDate = new Date("2020-01-01");
      break;
    default:
      startDate = subDays(now, 365);
  }

  const company = await prisma.company.findUnique({
    where: { ticker },
  });

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const data = await prisma.mnavRecord.findMany({
    where: {
      companyId: company.id,
      date: { gte: startDate },
    },
    orderBy: { date: "asc" },
    select: {
      date: true,
      mnav: true,
      marketCap: true,
      btcHoldings: true,
      btcPrice: true,
    },
  });

  return NextResponse.json({
    company: { ticker: company.ticker, name: company.name },
    data: data.map((d) => ({
      date: d.date.toISOString().split("T")[0],
      mnav: Math.round(d.mnav * 100) / 100,
      btcPrice: Math.round(d.btcPrice),
      marketCap: d.marketCap,
      btcHoldings: d.btcHoldings,
    })),
  });
}
