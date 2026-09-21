import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Panel, SectionTitle } from "@/components/Common/primitives";
import { LAYER_DEFS, useInvestigation } from "@/state/investigation";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — OceanTrace Console" },
      {
        name: "description",
        content:
          "Configure default map layers, drift model assumptions, alert thresholds and data retention for the OceanTrace console.",
      },
      { property: "og:title", content: "Settings — OceanTrace" },
      {
        property: "og:description",
        content: "Operator preferences for the OceanTrace forensic console.",
      },
    ],
  }),
  component: Settings,
});

function Settings() {
  const { layers, toggleLayer } = useInvestigation();
  const [threshold, setThreshold] = useState(0.8);
  const [units, setUnits] = useState<"METRIC" | "NAUTICAL">("METRIC");

  return (
    <div className="space-y-5">
      <SectionTitle
        kicker="System"
        title="Settings"
        description="Operator preferences. Persisted locally in this prototype; user-scoped in production."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Default Map Layers">
          <ul className="space-y-1.5">
            {LAYER_DEFS.map((l) => (
              <li key={l.key} className="flex items-center justify-between gap-3">
                <span className="text-[12.5px] text-foreground/85">{l.label}</span>
                <button
                  onClick={() => toggleLayer(l.key)}
                  className={cn(
                    "h-5 w-9 rounded-full border transition-colors",
                    layers[l.key] ? "border-cyan/60 bg-cyan/25" : "border-hairline bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "block h-3.5 w-3.5 rounded-full bg-foreground/80 transition-transform",
                      layers[l.key] ? "translate-x-[18px]" : "translate-x-[2px]",
                    )}
                  />
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="space-y-4">
          <Panel title="Alert Threshold" subtitle="Escalate cases above this evidence score">
            <input
              type="range"
              min={0.5}
              max={0.99}
              step={0.01}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full accent-[var(--cyan)]"
            />
            <div className="num mt-2 text-2xl text-cyan">{threshold.toFixed(2)}</div>
          </Panel>

          <Panel title="Units">
            <div className="flex gap-2">
              {(["METRIC", "NAUTICAL"] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => setUnits(u)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 num text-[10px] tracking-widest uppercase",
                    units === u
                      ? "border-cyan/50 bg-cyan/12 text-cyan"
                      : "border-hairline text-muted-foreground",
                  )}
                >
                  {u}
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Backend Connection">
            <p className="text-[12.5px] text-muted-foreground">
              Prototype mode: all analytics come from local synthetic datasets under{" "}
              <span className="num text-cyan">src/data</span>. Swap the mock providers for a
              FastAPI client to stream live SAR, drift and AIS outputs without changing the UI.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
