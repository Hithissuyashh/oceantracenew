import { createFileRoute } from "@tanstack/react-router";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { Metric, Panel, SectionTitle, StatusBadge } from "@/components/Common/primitives";
import { useInvestigation } from "@/state/investigation";
import { toPoints } from "@/components/Map/projection";

export const Route = createFileRoute("/characterization")({
  head: () => ({
    meta: [
      { title: "Spill Characterization — OceanTrace" },
      {
        name: "description",
        content:
          "Geometric characterization of the detected slick: area, perimeter, axes, orientation, centroid and fragmentation index.",
      },
      { property: "og:title", content: "Spill Characterization — OceanTrace" },
      {
        property: "og:description",
        content: "Quantitative geometry of a detected marine oil slick.",
      },
    ],
  }),
  component: Characterization,
});

function Characterization() {
  const { activeCase } = useInvestigation();
  const g = activeCase.spill.geometry;

  const radar = [
    { k: "Elongation", v: Math.min(100, (g.majorAxisKm / g.minorAxisKm) * 22) },
    { k: "Compactness", v: 100 - g.fragmentationIndex * 100 },
    { k: "Area", v: Math.min(100, g.areaKm2 * 6) },
    { k: "Perimeter", v: Math.min(100, g.perimeterKm * 4.4) },
    { k: "Fragmentation", v: g.fragmentationIndex * 100 },
    { k: "Confidence", v: activeCase.spill.detectionConfidence * 100 },
  ];

  return (
    <div className="space-y-5">
      <SectionTitle
        kicker="Analysis"
        title="Spill Characterization"
        description="Geometric descriptors extracted from the segmentation mask, used as drift-model initial conditions."
        right={<StatusBadge status="Geometry Extracted" tone="ok" />}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Area" value={g.areaKm2} unit="km²" />
        <Metric label="Perimeter" value={g.perimeterKm} unit="km" />
        <Metric label="Major Axis" value={g.majorAxisKm} unit="km" />
        <Metric label="Minor Axis" value={g.minorAxisKm} unit="km" />
        <Metric label="Orientation" value={`${g.orientationDeg}°`} hint="from true north" />
        <Metric
          label="Centroid"
          value={`${g.centroid.lat.toFixed(3)}° N`}
          hint={`${g.centroid.lon.toFixed(3)}° E`}
        />
        <Metric label="Fragmentation Index" value={g.fragmentationIndex} hint="0 = single body" />
        <Metric
          label="Detection Confidence"
          value={`${Math.round(activeCase.spill.detectionConfidence * 100)}%`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Slick Geometry" subtitle="Segmentation polygon with principal axes">
          <svg viewBox="0 0 1200 800" className="h-[340px] w-full rounded-md bg-ocean-deep">
            <rect width="1200" height="800" fill="var(--ocean-deep)" />
            {Array.from({ length: 20 }, (_, i) => (
              <line key={i} x1={i * 60} y1={0} x2={i * 60} y2={800} stroke="var(--cyan)" strokeOpacity="0.06" />
            ))}
            {Array.from({ length: 14 }, (_, i) => (
              <line key={i} x1={0} y1={i * 60} x2={1200} y2={i * 60} stroke="var(--cyan)" strokeOpacity="0.06" />
            ))}
            <g transform="translate(-240 -180) scale(1.6)">
              <polygon
                points={toPoints(g.polygon)}
                fill="var(--oil)"
                fillOpacity="0.35"
                stroke="var(--oil)"
                strokeWidth="2"
              />
            </g>
            <text x="30" y="40" className="num" fontSize="20" fill="var(--cyan)" fillOpacity="0.7">
              PRINCIPAL AXIS 42° · 7.2 km × 2.1 km
            </text>
          </svg>
        </Panel>

        <Panel title="Shape Signature" subtitle="Normalized descriptor profile">
          <ResponsiveContainer width="100%" height={340}>
            <RadarChart data={radar} outerRadius="72%">
              <PolarGrid stroke="var(--hairline)" />
              <PolarAngleAxis
                dataKey="k"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              />
              <Radar
                dataKey="v"
                stroke="var(--cyan)"
                fill="var(--cyan)"
                fillOpacity={0.22}
              />
            </RadarChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </div>
  );
}
