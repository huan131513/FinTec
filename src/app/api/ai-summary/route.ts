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

  // Find the data point closest to the median mNAV date for "mid-period" context
  const midIdx = Math.floor(data.length / 2);

  return { min, max, avg, midPoint: data[midIdx] };
}

function buildPrompt(data: DataPoint[], range: string): string {
  const latest = data[data.length - 1];
  const earliest = data[0];
  const { min, max, avg } = computeStats(data);

  const mnavChange = ((latest.mnav - earliest.mnav) / earliest.mnav) * 100;
  const isPremium = latest.premiumPct >= 0;
  const premiumLabel = isPremium ? "premium" : "discount";

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

  return `You are a professional financial analyst specializing in Bitcoin treasury companies and digital-asset capital markets.

Analyze the following MicroStrategy (MSTR/Strategy) mNAV data covering ${rangeLabel} (${earliest.date} → ${latest.date}, ${data.length} trading days):

LATEST DATA POINT (${latest.date}):
  • mNAV: ${latest.mnav.toFixed(2)}x  →  ${Math.abs(latest.premiumPct).toFixed(2)}% ${premiumLabel} to Bitcoin NAV
  • Bitcoin Price: $${latest.btcPrice.toLocaleString()}
  • MSTR Market Cap: ${formatUSD(latest.marketCap)}
  • BTC Holdings: ${formatBtc(latest.btcHoldings)}

PERIOD STATISTICS:
  • mNAV range: ${min.toFixed(2)}x – ${max.toFixed(2)}x
  • Average mNAV: ${avg.toFixed(2)}x
  • mNAV at period start: ${earliest.mnav.toFixed(2)}x
  • mNAV change over period: ${mnavChange >= 0 ? "+" : ""}${mnavChange.toFixed(1)}%

TASK:
Write a clear, professional analysis of exactly 3 paragraphs:

Paragraph 1 — Current status: Interpret the current mNAV of ${latest.mnav.toFixed(2)}x. What does this ${premiumLabel} imply for investors? How does it compare to the historical range observed in this period?

Paragraph 2 — Trend & pattern analysis: Describe the mNAV trend over this period. Was it rising, falling, or volatile? Identify any notable inflection points or patterns. Relate mNAV movement to Bitcoin price where relevant.

Paragraph 3 — Key insight & outlook: Summarise the single most important takeaway for an investor monitoring MSTR mNAV. Briefly touch on what factors could drive mNAV higher or lower from here.

Rules:
- Use specific numbers from the data above.
- Write in plain paragraphs — no markdown headers, no bullet points, no bold/italic.
- Keep total length under 250 words.
- Tone: concise, objective, professional.`;
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
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 512,
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
