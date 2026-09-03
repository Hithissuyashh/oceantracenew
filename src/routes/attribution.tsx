import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { InvestigationMap } from "@/components/Map/InvestigationMap";
import {
  CandidateRanking,
  EvidenceExplorer,
} from "@/components/Attribution/CandidateRanking";
import { VesselDetail } from "@/components/Attribution/VesselDetail";
import { Metric, Panel, SectionTitle, StatusBadge } from "@/components/Common/primitives";
import { useInvestigation, useSelectedCandidate } from "@/state/investigation";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/attribution")({
  head: () => ({
    meta: [
      { title: "Vessel Attribution — OceanTrace" },
      {
        name: "description",
        content:
          "Ranked suspect vessels with explainable evidence factors: spatial proximity, temporal correlation, drift consistency and behavioural anomalies.",
      },
      { property: "og:title", content: "Vessel Attribution — OceanTrace" },
      {
        property: "og:description",
        content:
          "Explainable forensic scoring of candidate vessels linked to a detected marine oil spill.",
      },
    ],
  }),
  component: Attribution,
});

const SORTS = ["EVIDENCE SCORE", "SPATIAL", "TEMPORAL", "ANOMALY"] as const;

function Attribution() {
  const { activeCase } = useInvestigation();
  const selected = useSelectedCandidate();
  const [openVessel, setOpenVessel] = useState<string | null>(null);
  const [sort, setSort] = useState<(typeof SORTS)[number]>("EVIDENCE SCORE");

  const vessel = activeCase.candidates.find((c) => c.vessel.id === openVessel)?.vessel;

  return (
    <div className="space-y-5">
      <SectionTitle
        kicker={`Case ${activeCase.id}`}
        title="Vessel Attribution"
        description="Candidate vessels ranked by weighted forensic correlation. Selection drives the map, evidence panel and behavioural timeline."
        right={<StatusBadge status="5 Candidates" tone="cyan" />}
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="label-xs">Ranking view</span>
        {SORTS.map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={cn(
              "rounded-md border px-2.5 py-1 num text-[10px] tracking-widest uppercase transition-colors",
              sort === s
                ? "border-cyan/45 bg-cyan/12 text-cyan"
                : "border-hairline text-muted-foreground hover:text-foreground",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <Panel
          title="Candidate Ranking"
          subtitle="Click a vessel to inspect · chevron opens the full dossier"
        >
          <CandidateRanking onOpenVessel={(id) => setOpenVessel(id)} />
        </Panel>

        <div className="space-y-4">
          <Panel title="Evidence Explorer">
            <EvidenceExplorer />
          </Panel>
          <Panel title="Selected Vessel">
            <div className="grid grid-cols-2 gap-2">
              <Metric label="Speed" value={selected.vessel.speedKn} unit="kn" />
              <Metric label="Course" value={`${selected.vessel.courseDeg}°`} />
              <Metric label="Flag" value={selected.vessel.flag} />
              <Metric
                label="AIS Gap"
                value={selected.attribution.aisGapMinutes}
                unit="min"
              />
            </div>
            <button
              onClick={() => setOpenVessel(selected.vessel.id)}
              className="mt-3 w-full rounded-md border border-hairline py-2 num text-[10px] tracking-widest text-muted-foreground uppercase hover:border-cyan/40 hover:text-cyan"
            >
              Open vessel dossier
            </button>
          </Panel>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <InvestigationMap className="h-[460px] w-full" focusLabel="Attribution view" />
        <Panel title="Behavioural Timeline" subtitle={selected.vessel.name}>
          <ol className="space-y-3">
            {selected.vessel.track
              .filter((_, i) => i % 8 === 0)
              .map((p, i) => (
                <li key={i} className="relative border-l border-hairline pl-4">
                  <span
                    className={cn(
                      "absolute top-1 -left-[4.5px] h-2 w-2 rounded-full",
                      p.gap ? "bg-oil" : p.sog < 5 ? "bg-amber" : "bg-cyan/70",
                    )}
                  />
                  <div className="num text-[11px] text-muted-foreground">
                    {p.t.slice(11, 16)} UTC
                  </div>
                  <div className="text-[12.5px] text-foreground/85">
                    {p.gap
                      ? "AIS transmission gap detected"
                      : p.sog < 5
                        ? `Speed reduction to ${p.sog} kn`
                        : `Transit ${p.sog} kn @ ${Math.round(p.cog)}°`}
                  </div>
                </li>
              ))}
          </ol>
        </Panel>
      </div>

      {vessel && <VesselDetail vessel={vessel} onClose={() => setOpenVessel(null)} />}
    </div>
  );
}
