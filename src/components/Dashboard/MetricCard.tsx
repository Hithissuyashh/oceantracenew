import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Counter } from "@/components/Common/primitives";

export function MetricCard({
  kicker,
  value,
  unit,
  sub,
  tone = "cyan",
  spark,
  footer,
  onClick,
}: {
  kicker: string;
  value: ReactNode;
  unit?: string;
  sub?: string;
  tone?: "cyan" | "amber" | "oil" | "ok";
  spark?: number[];
  footer?: ReactNode;
  onClick?: () => void;
}) {
  const toneText = {
    cyan: "text-cyan",
    amber: "text-amber",
    oil: "text-oil",
    ok: "text-ok",
  }[tone];
  const toneStroke = {
    cyan: "var(--cyan)",
    amber: "var(--amber)",
    oil: "var(--oil)",
    ok: "var(--ok)",
  }[tone];

  return (
    <div
      onClick={onClick}
      className={cn(
        "panel group relative overflow-hidden p-5 transition-all duration-200",
        onClick && "cursor-pointer active:shadow-[var(--neu-pressed)]",
      )}
    >
      <div className="label-xs">{kicker}</div>
      <div className={cn("mt-2 flex items-baseline gap-1.5 font-display text-3xl tracking-wide", toneText)}>
        {value}
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
      {sub && <div className="mt-1 text-[11.5px] text-muted-foreground">{sub}</div>}
      {spark && (
        <svg viewBox="0 0 100 24" className="mt-3 h-6 w-full" preserveAspectRatio="none">
          <polyline
            points={spark
              .map((v, i) => `${(i / (spark.length - 1)) * 100},${24 - v * 22}`)
              .join(" ")}
            fill="none"
            stroke={toneStroke}
            strokeWidth={1.4}
            strokeOpacity={0.85}
          />
          <polygon
            points={`0,24 ${spark
              .map((v, i) => `${(i / (spark.length - 1)) * 100},${24 - v * 22}`)
              .join(" ")} 100,24`}
            fill={toneStroke}
            fillOpacity={0.1}
          />
        </svg>
      )}
      {footer && <div className="mt-3 pt-2">{footer}</div>}
    </div>
  );
}

export function ConfidenceMeter({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="neu-press h-2 flex-1 overflow-hidden rounded-full bg-surface p-[3px]">
        <div
          className="h-full rounded-full bg-cyan transition-[width] duration-1000"
          style={{ width: `${value * 100}%` }}
        />
      </div>
      <span className="num text-[10px] text-muted-foreground">
        <Counter value={value * 100} />% {label}
      </span>
    </div>
  );
}
