import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { InvestigationMap } from "@/components/Map/InvestigationMap";
import { LayerControl } from "@/components/Map/LayerControl";
import { MetricCard, ConfidenceMeter } from "@/components/Dashboard/MetricCard";
import { InvestigationTimeline } from "@/components/Dashboard/Timeline";
import { RunAnalysisButton } from "@/components/Dashboard/AnalysisRunner";
import { CandidateRanking, EvidenceExplorer } from "@/components/Attribution/CandidateRanking";
import { Counter, Panel, SectionTitle, StatusBadge } from "@/components/Common/primitives";
import { useInvestigation } from "@/state/investigation";

export const Route = createFileRoute("/overview")({
  head: () => ({
    meta: [
      { title: "Command Overview — OceanTrace Spill Intelligence" },
      {
        name: "description",
        content:
          "Live command overview of active oil spill investigations: slick detection, probable origin, drift forecast and ranked suspect vessels.",
      },
      { property: "og:title", content: "Command Overview — OceanTrace" },
      {
        property: "og:description",
        content:
          "Satellite oil spill detection, drift hindcasting and AIS-based vessel attribution in one operational console.",
      },
    ],
  }),
  component: Overview,
});

function Overview() {
  const { activeCase } = useInvestigation();
  const top = activeCase.candidates[0]!;

  return (
    <div className="space-y-5">
      <SectionTitle
        kicker="Command Overview"
        title="Arabian Sea Spill Watch"
        description="An oil slick has been detected, its probable origin reconstructed, and 247 vessels analysed. Five remain forensically relevant."
        right={
          <div className="flex items-center gap-3">
            <StatusBadge status="Operational" tone="ok" />
            <RunAnalysisButton />
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          kicker="Active Investigations"
          value={<Counter value={4} />}
          sub="+1 detected in last 24 hours"
          tone="cyan"
          spark={[0.2, 0.35, 0.3, 0.55, 0.5, 0.72, 0.9]}
        />
        <MetricCard
          kicker="Oil Slick Detected"
          value={<Counter value={12.4} decimals={1} />}
          unit="km²"
          sub="Sentinel-1A C-band SAR"
          tone="oil"
          footer={<ConfidenceMeter value={0.94} label="detection confidence" />}
        />
        <MetricCard
          kicker="Probable Release Window"
          value="18–24"
          unit="hours ago"
          sub="Reconstructed by particle hindcast"
          tone="amber"
          footer={<StatusBadge status="Confidence Medium" tone="amber" />}
        />
        <MetricCard
          kicker="Top Vessel Candidate"
          value={<span className="text-lg">MT PACIFIC VOYAGER</span>}
          sub="MMSI 356742000 · Oil / Chemical Tanker"
          tone="cyan"
          footer={
            <div className="flex items-baseline justify-between">
              <span className="label-xs">Evidence Score</span>
              <span className="num text-xl text-cyan">
                <Counter value={0.89} decimals={2} />
              </span>
            </div>
          }
        />
        <MetricCard
          kicker="Vessels Analyzed"
          value={<Counter value={247} />}
          sub="Filtered to 5 candidates"
          tone="ok"
          spark={[0.9, 0.7, 0.55, 0.35, 0.2, 0.12, 0.06]}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="relative">
          <InvestigationMap className="h-[540px] w-full" />
          <div className="absolute top-16 right-3 hidden md:block">
            <LayerControl />
          </div>
        </div>

        <div className="space-y-4">
          <Panel title="Investigation Timeline" subtitle="Click an event to focus the map">
            <InvestigationTimeline />
          </Panel>
          <Panel title="Evidence Explorer">
            <EvidenceExplorer />
          </Panel>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Panel
          title="Ranked Suspect Vessels"
          subtitle="Explainable attribution scoring across five weighted factors"
          right={
            <Link
              to="/attribution"
              className="num flex items-center gap-1 text-[10px] tracking-widest text-cyan uppercase hover:underline"
            >
              Full attribution <ArrowUpRight className="h-3 w-3" />
            </Link>
          }
        >
          <CandidateRanking />
        </Panel>

        <Panel title="Case Summary" subtitle={`${activeCase.id} · ${activeCase.region}`}>
          <dl className="space-y-2.5 text-[12.5px]">
            {[
              ["Observation Time", "27 Aug 2026 — 18:40 UTC"],
              ["Platform", `${activeCase.observation.platform} · ${activeCase.observation.sensor}`],
              ["Detected Slick Area", `${activeCase.spill.geometry.areaKm2} km²`],
              ["Detection Confidence", "94%"],
              ["Release Window", "18–24 h before observation"],
              ["Drift Model", "Particle-Based Lagrangian"],
              ["Top Candidate", top.vessel.name],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-3 border-b border-hairline/60 pb-2">
                <dt className="label-xs">{k}</dt>
                <dd className="num text-right text-foreground/90">{v}</dd>
              </div>
            ))}
          </dl>
          <Link
            to="/cases/$caseId"
            params={{ caseId: activeCase.id }}
            className="mt-4 flex w-full items-center justify-center rounded-md border border-cyan/40 bg-cyan/10 py-2 num text-[11px] tracking-widest text-cyan uppercase hover:bg-cyan/20"
          >
            Open investigation →
          </Link>
        </Panel>
      </div>
    </div>
  );
}
