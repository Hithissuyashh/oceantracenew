import { createFileRoute } from "@tanstack/react-router";
import { SARComparison } from "@/components/Detection/SARViewer";
import { Metric, Panel, SectionTitle, StatusBadge } from "@/components/Common/primitives";
import { useInvestigation } from "@/state/investigation";

export const Route = createFileRoute("/detection")({
  head: () => ({
    meta: [
      { title: "Satellite Detection — OceanTrace SAR Analysis" },
      {
        name: "description",
        content:
          "Compare raw C-band SAR imagery against the U-Net segmentation mask that detected the oil slick, with IoU and Dice model metrics.",
      },
      { property: "og:title", content: "Satellite Detection — OceanTrace" },
      {
        property: "og:description",
        content: "AI segmentation of SAR imagery for marine oil slick detection.",
      },
    ],
  }),
  component: Detection,
});

function Detection() {
  const { activeCase } = useInvestigation();
  const m = activeCase.spill.model;

  return (
    <div className="space-y-5">
      <SectionTitle
        kicker="Analysis"
        title="Satellite Detection"
        description="Synthetic Aperture Radar observation and AI segmentation of the low-backscatter slick signature."
        right={<StatusBadge status="Detection Confirmed" tone="ok" />}
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <Panel title="SAR / AI Comparison" subtitle={activeCase.observation.sceneId}>
          <SARComparison />
        </Panel>

        <div className="space-y-4">
          <Panel title="AI Detection">
            <dl className="space-y-2.5 text-[12.5px]">
              {[
                ["Model", m.name],
                ["Version", m.version],
                ["Confidence", `${Math.round(activeCase.spill.detectionConfidence * 100)}%`],
                ["IoU", m.iou.toFixed(2)],
                ["Dice Score", m.dice.toFixed(2)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-hairline/60 pb-2">
                  <dt className="label-xs">{k}</dt>
                  <dd className="num text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>

          <Panel title="Scene Metadata">
            <div className="grid grid-cols-2 gap-2">
              <Metric label="Platform" value={activeCase.observation.platform} />
              <Metric label="Sensor" value="C-band" hint={activeCase.observation.mode} />
              <Metric label="Resolution" value={activeCase.observation.resolutionM} unit="m" />
              <Metric
                label="Incidence"
                value={`${activeCase.observation.incidenceAngleDeg}°`}
              />
            </div>
          </Panel>

          <Panel title="Look-alike Screening">
            <ul className="space-y-1.5 text-[12.5px] text-muted-foreground">
              <li>✓ Low-wind dampening ruled out (wind 18 km/h)</li>
              <li>✓ Biogenic film unlikely — sharp gradient edges</li>
              <li>✓ Shape elongation consistent with drifting release</li>
              <li>⚠ Partial fragmentation may reduce area estimate</li>
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
