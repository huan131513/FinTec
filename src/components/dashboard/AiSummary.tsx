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

interface Section {
  title: string;
  content: string;
}

// Section visual config
const SECTION_META: Record<
  string,
  { label: string; color: string; bg: string; icon: string }
> = {
  "Current Status": {
    label: "Current Status",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    icon: "◉",
  },
  "Trend Analysis": {
    label: "Trend Analysis",
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
    icon: "↗",
  },
  "Key Insights": {
    label: "Key Insights",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    icon: "✦",
  },
  "Buy Point Analysis": {
    label: "Buy Point Analysis",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    icon: "⬥",
  },
};

/**
 * Render a text string that may contain {{highlighted}} tokens.
 * Everything inside {{ }} is rendered as a red accent span.
 */
function renderHighlighted(text: string) {
  const parts = text.split(/(\{\{.+?\}\})/g);
  return parts.map((part, i) => {
    if (part.startsWith("{{") && part.endsWith("}}")) {
      return (
        <span key={i} className="font-semibold text-red-400">
          {part.slice(2, -2)}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/**
 * Parse Gemini's **Section Title** + paragraph format into structured sections.
 * Falls back to plain paragraphs if formatting is unexpected.
 */
function parseSections(text: string): Section[] {
  const sectionRegex = /\*\*(.+?)\*\*\s*\n([\s\S]+?)(?=\n\s*\*\*|$)/g;
  const sections: Section[] = [];
  let match: RegExpExecArray | null;

  while ((match = sectionRegex.exec(text)) !== null) {
    sections.push({
      title: match[1].trim(),
      content: match[2].trim(),
    });
  }

  if (sections.length > 0) return sections;

  // Fallback: treat each double-newline block as an unnamed section
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((content) => ({ title: "", content }));
}

export function AiSummary({ data, range }: AiSummaryProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [sections, setSections] = useState<Section[]>([]);
  const [error, setError] = useState<string>("");
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
      if (!res.ok) throw new Error(json.error ?? "Unknown error");

      setSections(parseSections(json.summary));
      setSummaryRange(range);
      setStatus("done");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate summary.",
      );
      setStatus("error");
    }
  }

  return (
    <div className="rounded-2xl border border-card-border bg-card p-6">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-sm font-bold text-white shadow-lg">
            AI
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              AI-Generated Market Insight
            </h3>
            <p className="text-xs text-muted">
              Gemini 2.5 Flash · {data.length} trading days
              {isStale && (
                <span className="ml-2 text-amber-400">· stale, refresh for {range}</span>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={generate}
          disabled={status === "loading"}
          className={`
            flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium
            transition-all duration-200 active:scale-95
            ${
              status === "loading"
                ? "cursor-not-allowed border-card-border text-muted"
                : isStale
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                  : "border-accent/30 bg-accent/10 text-accent hover:bg-accent/20"
            }
          `}
        >
          {status === "loading" ? (
            <><Spinner /> Analysing…</>
          ) : status === "done" ? (
            <><RefreshIcon /> {isStale ? "Refresh" : "Regenerate"}</>
          ) : (
            <><SparkIcon /> Generate Analysis</>
          )}
        </button>
      </div>

      {/* ── Body ── */}
      <div className="mt-5">
        {/* IDLE */}
        {status === "idle" && (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-card-border py-10">
            <p className="text-center text-sm text-muted">
              Click <span className="text-accent">Generate Analysis</span> to
              get AI-powered insights including buy point analysis.
            </p>
          </div>
        )}

        {/* LOADING — skeleton chat bubble */}
        {status === "loading" && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-xs font-bold text-white">
              AI
            </div>
            <div className="flex-1 space-y-3 rounded-2xl rounded-tl-sm border border-card-border bg-background p-5">
              {[100, 85, 60, 90, 70, 45].map((w, i) => (
                <div
                  key={i}
                  className="h-3.5 animate-pulse rounded-full bg-card-border"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ERROR */}
        {status === "error" && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-xs font-bold text-red-400">
              !
            </div>
            <div className="flex-1 rounded-2xl rounded-tl-sm border border-red-500/20 bg-red-500/5 p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* DONE — chat bubble with sections */}
        {status === "done" && (
          <div className="flex gap-3">
            {/* Avatar */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-xs font-bold text-white shadow-md">
              AI
            </div>

            {/* Bubble */}
            <div className="flex-1 rounded-2xl rounded-tl-sm border border-card-border bg-background p-5">
              <div className="space-y-4">
                {sections.map((sec, i) => {
                  const meta = SECTION_META[sec.title];

                  // Named section with coloured badge
                  if (meta) {
                    return (
                      <div
                        key={i}
                        className={`rounded-xl border p-4 ${meta.bg}`}
                      >
                        <div
                          className={`mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest ${meta.color}`}
                        >
                          <span>{meta.icon}</span>
                          <span>{meta.label}</span>
                        </div>
                        <p className="text-sm leading-relaxed text-foreground/85">
                          {renderHighlighted(sec.content)}
                        </p>
                      </div>
                    );
                  }

                  // Fallback plain paragraph
                  return (
                    <p
                      key={i}
                      className="text-sm leading-relaxed text-foreground/80"
                    >
                      {renderHighlighted(sec.content)}
                    </p>
                  );
                })}
              </div>

              {/* Footer */}
              <p className="mt-4 border-t border-card-border pt-3 text-xs text-muted/50">
                Generated by Google Gemini 2.5 Flash · For informational
                purposes only — not financial advice.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Icons ── */

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
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
