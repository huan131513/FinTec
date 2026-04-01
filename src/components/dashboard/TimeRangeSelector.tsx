"use client";

interface TimeRangeSelectorProps {
  selected: string;
  onChange: (range: string) => void;
}

const ranges = [
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
  { label: "90D", value: "90d" },
  { label: "1Y", value: "1y" },
  { label: "All", value: "all" },
];

export function TimeRangeSelector({
  selected,
  onChange,
}: TimeRangeSelectorProps) {
  return (
    <div className="flex gap-2">
      {ranges.map((range) => (
        <button
          key={range.value}
          onClick={() => onChange(range.value)}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
            selected === range.value
              ? "bg-accent text-white shadow-lg shadow-accent/25"
              : "bg-card border border-card-border text-muted hover:text-foreground hover:border-accent/50"
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
