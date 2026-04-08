import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient } from "@/lib/gemini";

interface DataPoint {
  date: string;
  mnav: number;
  btcPrice: number;
  marketCap: number;
  btcHoldings: number;
  premiumPct: number;
}

function computeStats(data: DataPoint[]) {
  const mnavValues = data.map((d) => d.mnav);
  const min = Math.min(...mnavValues);
  const max = Math.max(...mnavValues);
  const avg = mnavValues.reduce((a, b) => a + b, 0) / mnavValues.length;

  // Find the lowest mNAV point (potential historical buy zone)
  const minIdx = mnavValues.indexOf(min);
  const maxIdx = mnavValues.indexOf(max);

  return { min, max, avg, minDate: data[minIdx].date, maxDate: data[maxIdx].date };
}

function buildPrompt(data: DataPoint[], range: string): string {
  const latest = data[data.length - 1];
  const earliest = data[0];
  const { min, max, avg, minDate, maxDate } = computeStats(data);

  const mnavChange = ((latest.mnav - earliest.mnav) / earliest.mnav) * 100;
  const isPremium = latest.premiumPct >= 0;
  const premiumLabel = isPremium ? "premium" : "discount";
  const percentileRank =
    ((latest.mnav - min) / (max - min)) * 100;

  const rangeLabel =
    range === "all"
      ? "all available historical data"
      : `the last ${range}`;

  const formatUSD = (n: number) =>
    n >= 1e12
      ? `$${(n / 1e12).toFixed(2)}T`
      : n >= 1e9
        ? `$${(n / 1e9).toFixed(2)}B`
        : `$${n.toLocaleString()}`;

  const formatBtc = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}K BTC` : `${n.toFixed(0)} BTC`;

  return `You are a professional financial analyst specializing in Bitcoin treasury companies and digital-asset capital markets. You communicate in a clear, direct style — like a senior analyst replying to a client message.

MSTR mNAV DATA — ${rangeLabel} (${earliest.date} → ${latest.date}, ${data.length} trading days):

LATEST (${latest.date}):
  mNAV: ${latest.mnav.toFixed(2)}x | ${Math.abs(latest.premiumPct).toFixed(2)}% ${premiumLabel} to BTC NAV
  BTC Price: $${latest.btcPrice.toLocaleString()} | Market Cap: ${formatUSD(latest.marketCap)} | Holdings: ${formatBtc(latest.btcHoldings)}

PERIOD STATS:
  Range: ${min.toFixed(2)}x (${minDate}) – ${max.toFixed(2)}x (${maxDate})
  Average: ${avg.toFixed(2)}x | Period change: ${mnavChange >= 0 ? "+" : ""}${mnavChange.toFixed(1)}%
  Current mNAV percentile in period: ${percentileRank.toFixed(0)}th percentile

---

Reply in EXACTLY the following 4-section format. Each section starts with its label on its own line, then one paragraph of text. Do not add any extra text outside these sections.

**Current Status**
[Interpret the current mNAV of ${latest.mnav.toFixed(2)}x. What does this ${premiumLabel} mean? How expensive or cheap is MSTR relative to its BTC holdings right now? Reference the percentile rank and historical range.]

**Trend Analysis**
[Describe the mNAV movement over this period. Was it rising, falling, mean-reverting? Highlight the most notable shift. Connect mNAV changes to BTC price movements where relevant. Use specific dates and numbers.]

**Key Insights**
[Give the single most important takeaway for someone watching MSTR. What is driving the current premium/discount? What would need to happen for mNAV to compress or expand?]

**Buy Point Analysis**
[Based on the historical mNAV range of ${min.toFixed(2)}x–${max.toFixed(2)}x and the current reading of ${latest.mnav.toFixed(2)}x (${percentileRank.toFixed(0)}th percentile), assess whether current levels represent a historically attractive or expensive entry. Identify the mNAV zone that historically corresponded to better risk/reward (reference the low near ${min.toFixed(2)}x on ${minDate}). End with a one-sentence risk reminder that this is not financial advice.]

Rules: use specific numbers, no bullet points inside paragraphs, professional but readable tone, each paragraph 2–4 sentences.`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, range } = body as { data: DataPoint[]; range: string };

    if (!data || data.length < 2) {
      return NextResponse.json(
        { error: "Insufficient data to generate analysis." },
        { status: 400 },
      );
    }

    const client = getGeminiClient();
    const model = client.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1500,
      },
    });

    const prompt = buildPrompt(data, range);
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    return NextResponse.json({ summary: text });
  } catch (err) {
    console.error("[ai-summary] Error:", err);

    if (err instanceof Error && err.message.includes("GEMINI_API_KEY")) {
      return NextResponse.json(
        { error: "Gemini API key is not configured on this server." },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: "Failed to generate AI summary. Please try again." },
      { status: 500 },
    );
  }
}
