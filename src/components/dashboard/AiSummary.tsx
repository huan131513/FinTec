"use client";

import { useState } from "react";

interface DataPoint {
  date: string;
  mnav: number;
  btcPrice: number;
  marketCap: number;
  btcHoldings: number;
  premiumPct: number;
}

interface AiSummaryProps {
  data: DataPoint[];
  range: string;
}

type Status = "idle" | "loading" | "done" | "error";

export function AiSummary({ data, range }: AiSummaryProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [summary, setSummary] = useState<string>("");
  const [error, setError] = useState<string>("");
  // Track which data range this summary was generated for
  const [summaryRange, setSummaryRange] = useState<string>("");

  const isStale = status === "done" && summaryRange !== range;

  async function generate() {
    setStatus("loading");
    setError("");

    try {
      const res = await fetch("/api/ai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, range }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "Unknown error");
      }

      setSummary(json.summary);
      setSummaryRange(range);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate summary.");
      setStatus("error");
    }
  }

  // Split the summary into paragraphs for nicer rendering
  const paragraphs = summary
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="rounded-2xl border border-card-border bg-card p-6">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Gemini spark icon */}
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 text-white text-sm font-bold shrink-0">
            AI
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              AI-Generated Market Insight
            </h3>
            <p className="text-xs text-muted">
              Powered by Gemini 1.5 Flash · based on{" "}
              {data.length} trading days
            </p>
          </div>
        </div>

        <button
          onClick={generate}
          disabled={status === "loading"}
          className={`
            flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium
            transition-all duration-200
            ${
              status === "loading"
                ? "cursor-not-allowed bg-card border border-card-border text-muted"
                : isStale
                  ? "bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                  : "bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20"
            }
          `}
        >
          {status === "loading" ? (
            <>
              <Spinner />
              Analysing…
            </>
          ) : isStale ? (
            <>
              <RefreshIcon />
              Refresh for {range}
            </>
          ) : status === "done" ? (
            <>
              <RefreshIcon />
              Regenerate
            </>
          ) : (
            <>
              <SparkIcon />
              Generate Analysis
            </>
          )}
        </button>
      </div>

      {/* Content area */}
      {status === "idle" && (
        <div className="mt-5 flex items-center justify-center rounded-xl border border-dashed border-card-border py-10">
          <p className="text-sm text-muted">
            Click &ldquo;Generate Analysis&rdquo; to get AI-powered insights on the current {range} data.
          </p>
        </div>
      )}

      {status === "loading" && (
        <div className="mt-5 space-y-3">
          <div className="h-4 w-full animate-pulse rounded-full bg-card-border" />
          <div className="h-4 w-5/6 animate-pulse rounded-full bg-card-border" />
          <div className="h-4 w-4/6 animate-pulse rounded-full bg-card-border" />
          <div className="mt-4 h-4 w-full animate-pulse rounded-full bg-card-border" />
          <div className="h-4 w-3/4 animate-pulse rounded-full bg-card-border" />
        </div>
      )}

      {status === "error" && (
        <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {status === "done" && (
        <div className={`mt-5 space-y-4 ${isStale ? "opacity-60" : ""}`}>
          {isStale && (
            <p className="text-xs text-amber-400">
              ⚠ This analysis was generated for a different time range. Click &ldquo;Refresh&rdquo; to update.
            </p>
          )}
          {paragraphs.map((para, i) => (
            <p key={i} className="text-sm leading-relaxed text-muted">
              {para}
            </p>
          ))}
          <p className="pt-2 text-xs text-muted/50">
            Generated by Google Gemini · For informational purposes only, not financial advice.
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Small inline SVG icons ── */

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  );
}
