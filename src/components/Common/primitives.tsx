import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  subtitle,
  right,
  className,
  bodyClassName,
  children,
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("panel flex flex-col overflow-hidden", className)}>
      {(title || right) && (
        <header className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
          <div className="min-w-0">
            <h2 className="label-xs text-foreground/80">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
          {right}
        </header>
      )}
      <div className={cn("flex-1 px-5 pt-1 pb-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function StatusBadge({
  status,
  tone = "auto",
}: {
  status: string;
  tone?: "auto" | "cyan" | "amber" | "oil" | "ok" | "muted";
}) {
  const resolved =
    tone !== "auto"
      ? tone
      : /ACTIVE|HIGH|ALERT|DEGRADED/i.test(status)
        ? "oil"
        : /RESOLVED|ONLINE|OPERATIONAL|OK|COMPLETE/i.test(status)
          ? "ok"
          : /MONITORING|MEDIUM|PENDING/i.test(status)
            ? "amber"
            : "cyan";
  const map: Record<string, string> = {
    cyan: "text-cyan",
    amber: "text-amber",
    oil: "text-oil",
    ok: "text-ok",
    muted: "text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "neu-press inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 num text-[10px] tracking-[0.14em] uppercase",
        map[resolved],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current anim-blink" />
      {status}
    </span>
  );
}

export function Metric({
  label,
  value,
  unit,
  hint,
  className,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("neu p-4", className)}>
      <div className="label-xs">{label}</div>
      <div className="mt-1 num text-xl text-foreground">
        {value}
        {unit && <span className="ml-1 text-xs text-muted-foreground">{unit}</span>}
      </div>
      {hint && <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

/** Animated number counter, deterministic on first paint (starts at target on SSR). */
export function Counter({
  value,
  decimals = 0,
  duration = 900,
  className,
}: {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (value - from) * eased);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [value, duration]);

  return (
    <span className={cn("num", className)}>
      {display.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </span>
  );
}

export function EvidenceBar({
  label,
  score,
  delay = 0,
  detail,
}: {
  label: string;
  score: number;
  delay?: number;
  detail?: string;
}) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setW(score), 60 + delay);
    return () => clearTimeout(id);
  }, [score, delay]);
  const tone =
    score >= 0.8 ? "bg-cyan" : score >= 0.6 ? "bg-amber" : "bg-oil";
  return (
    <div className="group">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs text-foreground/85">{label}</span>
        <span className="num text-xs text-muted-foreground">
          {Math.round(score * 100)}%
        </span>
      </div>
      <div className="neu-press mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface p-[3px]">
        <div
          className={cn("h-full rounded-full transition-[width] duration-1000 ease-out", tone)}
          style={{ width: `${w * 100}%` }}
        />
      </div>
      {detail && (
        <p className="mt-1 text-[11px] leading-snug text-muted-foreground opacity-70 transition-opacity group-hover:opacity-100">
          {detail}
        </p>
      )}
    </div>
  );
}

export function SectionTitle({
  kicker,
  title,
  description,
  right,
}: {
  kicker?: string;
  title: string;
  description?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {kicker && <div className="label-xs text-cyan">{kicker}</div>}
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {right}
    </div>
  );
}

export function LoadingState({ label = "Loading analysis" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-cyan opacity-60 anim-blink" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan" />
      </span>
      <span className="num tracking-widest uppercase">{label}</span>
    </div>
  );
}
