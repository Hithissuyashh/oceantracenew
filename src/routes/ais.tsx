import { createFileRoute } from "@tanstack/react-router";
import { InvestigationMap } from "@/components/Map/InvestigationMap";
import { Counter, Panel, SectionTitle, StatusBadge } from "@/components/Common/primitives";
import { MetricCard } from "@/components/Dashboard/MetricCard";
import { useInvestigation } from "@/state/investigation";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ais")({
  head: () => ({
    meta: [
      { title: "AIS Intelligence — OceanTrace Vessel Filtering" },
      {
        name: "description",
        content:
          "Historical AIS analytics narrowing 12,847 messages to five candidate vessels through spatial, temporal and reachability filters.",
      },
      { property: "og:title", content: "AIS Intelligence — OceanTrace" },
      {
        property: "og:description",
        content: "Vessel traffic filtering funnel from raw AIS records to forensic candidates.",
      },
    ],
  }),
  component: AIS,
});

function AIS() {
  const { activeCase } = useInvestigation();
  const funnel = activeCase.funnel;
  const max = funnel[0]!.value;

  return (
    <div className="space-y-5">
      <SectionTitle
        kicker="Analysis"
        title="AIS Intelligence"
        description="Historical vessel traffic reconstructed across the release window and progressively filtered to forensically relevant candidates."
        right={<StatusBadge status="Feed Online" tone="ok" />}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard kicker="Total AIS Records" value={<Counter value={12847} />} tone="cyan" />
        <MetricCard kicker="Vessels In Region" value={<Counter value={247} />} tone="cyan" />
        <MetricCard kicker="Temporally Relevant" value={<Counter value={38} />} tone="amber" />
        <MetricCard kicker="Final Candidates" value={<Counter value={5} />} tone="oil" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
        <Panel title="Filtering Funnel" subtitle="Each stage narrows the suspect set">
          <ol className="space-y-2">
            {funnel.map((f, i) => {
              const w = 32 + (Math.log10(f.value + 1) / Math.log10(max + 1)) * 68;
              return (
                <li key={f.label}>
                  <div
                    className={cn(
                      "mx-auto rounded-md border px-3 py-2.5 text-center transition-all duration-700",
                      i === funnel.length - 1
                        ? "border-cyan/50 bg-cyan/12"
                        : "border-hairline bg-surface/50",
                    )}
                    style={{ width: `${w}%` }}
                  >
                    <div
                      className={cn(
                        "num text-xl",
                        i === funnel.length - 1 ? "text-cyan" : "text-foreground",
                      )}
                    >
                      <Counter value={f.value} duration={1100 + i * 220} />
                    </div>
                    <div className="label-xs mt-0.5">{f.label}</div>
                  </div>
                  {i < funnel.length - 1 && (
                    <div className="num py-1 text-center text-cyan/60">↓</div>
                  )}
                </li>
              );
            })}
          </ol>
        </Panel>

        <div className="space-y-4">
          <InvestigationMap className="h-[420px] w-full" focusLabel="AIS traffic view" />
          <Panel title="Filter Criteria" bodyClassName="p-0">
            <table className="w-full text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-hairline">
                  {["Stage", "Criterion", "Retained", "Rejected"].map((h) => (
                    <th key={h} className="label-xs px-4 py-2 font-normal">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Ingest", "Messages within 60 km / 48 h", "12,847", "—"],
                  ["Spatial", "Track intersects search envelope", "247", "12,600"],
                  ["Temporal", "Present in 18–24 h release window", "38", "209"],
                  ["Reachability", "Can reach origin envelope under drift", "12", "26"],
                  ["Behaviour", "Anomaly or trajectory correlation", "5", "7"],
                ].map((r) => (
                  <tr key={r[0]} className="border-b border-hairline/50">
                    <td className="num px-4 py-2.5 text-cyan">{r[0]}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{r[1]}</td>
                    <td className="num px-4 py-2.5">{r[2]}</td>
                    <td className="num px-4 py-2.5 text-muted-foreground">{r[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      </div>
    </div>
  );
}
