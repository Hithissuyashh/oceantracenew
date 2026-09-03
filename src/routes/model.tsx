import { createFileRoute } from "@tanstack/react-router";
import { MODEL_METRICS } from "@/data/mock";
import { Panel, SectionTitle, EvidenceBar, StatusBadge } from "@/components/Common/primitives";

export const Route = createFileRoute("/model")({
  head: () => ({
    meta: [
      { title: "Model Performance — OceanTrace" },
      {
        name: "description",
        content:
          "Evaluation metrics for the SAR segmentation, look-alike classifier, drift engine, AIS matcher and attribution ranker.",
      },
      { property: "og:title", content: "Model Performance — OceanTrace" },
      {
        property: "og:description",
        content: "Accuracy and calibration of every model in the forensic pipeline.",
      },
    ],
  }),
  component: ModelPerf,
});

function ModelPerf() {
  return (
    <div className="space-y-5">
      <SectionTitle
        kicker="System"
        title="Model Performance"
        description="Held-out evaluation for each stage of the attribution pipeline."
        right={<StatusBadge status="All Models Nominal" tone="ok" />}
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {MODEL_METRICS.map((m, i) => (
          <Panel key={m.name} title={m.name} subtitle={`${m.version} · trained ${m.trained}`}>
            <EvidenceBar label={m.metric} score={m.value} delay={i * 120} detail={m.secondary} />
            <div className="num mt-3 text-3xl text-cyan">{m.value.toFixed(2)}</div>
          </Panel>
        ))}
      </div>
      <Panel title="Evaluation Notes">
        <p className="text-[12.5px] text-muted-foreground">
          Metrics are computed on a held-out set of annotated SAR scenes and reconciled
          incidents. Attribution ranking is calibrated so that a 0.89 evidence score
          corresponds to a high-relevance correlation, not a legal determination of
          responsibility.
        </p>
      </Panel>
    </div>
  );
}
