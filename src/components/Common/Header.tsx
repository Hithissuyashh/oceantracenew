import { useEffect, useState } from "react";
import { Bell, Search } from "lucide-react";
import { useInvestigation } from "@/state/investigation";
import { StatusBadge } from "./primitives";
import { cn } from "@/lib/utils";

const RANGES = ["24H", "7D", "30D", "CUSTOM"] as const;

export function Header() {
  const { timeRange, setTimeRange } = useInvestigation();
  const [clock, setClock] = useState("--:--:-- UTC");

  useEffect(() => {
    const tick = () =>
      setClock(
        `${new Date().toISOString().slice(11, 19)} UTC`,
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="z-10 flex flex-wrap items-center justify-between gap-3 bg-background px-5 py-3.5 shadow-[0_8px_20px_var(--neu-shadow)]">
      <div className="flex items-baseline gap-3">
        <div className="font-display text-lg font-semibold tracking-tight text-foreground">
          OCEANTRACE
        </div>
        <span className="hidden text-xs text-muted-foreground md:inline">
          Maritime Oil Spill Forensic Intelligence Platform
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="neu-press hidden items-center gap-2 rounded-full bg-surface px-3.5 py-2 lg:flex">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            placeholder="Search case, MMSI, vessel…"
            className="w-52 bg-transparent text-xs shadow-none outline-none placeholder:text-muted-foreground/70"
          />
        </div>

        <div className="neu-press flex gap-1 rounded-full bg-surface p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={cn(
                "num rounded-full px-2.5 py-1.5 text-[10px] tracking-widest transition-all",
                timeRange === r
                  ? "text-cyan shadow-[var(--neu-raised)]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="hidden text-right sm:block">
          <StatusBadge status="System Operational" tone="ok" />
          <div className="num mt-1 text-[10px] text-muted-foreground">
            Last sync 2 min ago · {clock}
          </div>
        </div>

        <button className="neu relative rounded-full p-2.5 text-muted-foreground transition-all hover:text-cyan active:shadow-[var(--neu-pressed)]">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-oil" />
        </button>
      </div>
    </header>
  );
}
