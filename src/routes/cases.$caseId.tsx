import { createFileRoute, Link } from "@tanstack/react-router";
import { InvestigationMap } from "@/components/Map/InvestigationMap";
import { LayerControl } from "@/components/Map/LayerControl";
import { InvestigationTimeline } from "@/components/Dashboard/Timeline";
import { CandidateRanking } from "@/components/Attribution/CandidateRanking";
import { RunAnalysisButton } from "@/components/Dashboard/AnalysisRunner";
import {
  Metric,
  Panel,
  SectionTitle,
  StatusBadge,
} from "@/components/Common/primitives";
import { CASE_HISTORY, ACTIVE_CASES } from "@/data/mock";
import { useInvestigation } from "@/state/investigation";

export const Route = createFileRoute("/cases/$caseId")({
  head: ({ params }) => ({
    meta: [
      { title: `Case ${params.caseId} — OceanTrace Investigation` },
      {
        name: "description",
        content: `Full forensic investigation record for oil spill case ${params.caseId}: detection, spill geometry, drift reconstruction and vessel attribution.`,
      },
      { property: "og:title", content: `Case ${params.caseId} — OceanTrace` },
      {
        property: "og:description",
        content:
          "Satellite observation, probable release window and ranked candidate vessels for a marine oil spill case.",
      },
    ],
  }),
  component: CaseDetail,
});

function CaseDetail() {
  const { caseId } = Route.useParams();
  const { activeCase } = useInvestigation();
  const summary =
    [...ACTIVE_CASES, ...CASE_HISTORY].find((c) => c.id === caseId) ?? ACTIVE_CASES[0]!;

  return (
    <div className="space-y-5">
      <SectionTitle
        kicker={`Case ${summary.id}`}
        title={`${summary.region} Incident`}
        description="Full investigation record — observation, characterization, drift reconstruction and ranked attribution."
        right={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={`${summary.status} INVESTIGATION`} />
            <StatusBadge status={`PRIORITY ${summary.priority}`} tone="amber" />
            <RunAnalysisButton />
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric
          label="Observation Time"
          value={new Date(summary.observedAt).toISOString().slice(0, 10)}
          hint={`${new Date(summary.observedAt).toISOString().slice(11, 16)} UTC`}
        />
        <Metric label="Region" value={summary.region} hint="Search radius 60 km" />
        <Metric label="Detected Slick Area" value={summary.areaKm2} unit="km²" />
        <Metric
          label="Detection Confidence"
          value={`${Math.round(activeCase.spill.detectionConfidence * 100)}%`}
          hint="U-Net SAR segmentation"
        />
        <Metric
          label="Probable Release Window"
          value="18–24 h"
          hint="before observation · MEDIUM"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="relative">
          <InvestigationMap className="h-[520px] w-full" />
          <div className="absolute top-16 right-3 hidden md:block">
            <LayerControl />
          </div>
        </div>
        <div className="space-y-4">
          <Panel title="Investigation Timeline">
            <InvestigationTimeline />
          </Panel>
          <Panel title="Observation Record">
            <dl className="space-y-2 text-[12.5px]">
              {[
                ["Platform", activeCase.observation.platform],
                ["Sensor", activeCase.observation.sensor],
                ["Mode", activeCase.observation.mode],
                ["Resolution", `${activeCase.observation.resolutionM} m`],
                ["Incidence", `${activeCase.observation.incidenceAngleDeg}°`],
                ["Scene", activeCase.observation.sceneId.slice(0, 24) + "…"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-hairline/60 pb-1.5">
                  <dt className="label-xs">{k}</dt>
                  <dd className="num text-right text-foreground/85">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>
      </div>

      <Panel
        title="Ranked Candidates"
        right={
          <Link
            to="/attribution"
            className="num text-[10px] tracking-widest text-cyan uppercase hover:underline"
          >
            Attribution detail →
          </Link>
        }
      >
        <CandidateRanking compact />
      </Panel>
    </div>
  );
}
