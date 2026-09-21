import { createFileRoute } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { VectorField } from "@/components/Drift/ParticleField";
import { Metric, Panel, SectionTitle, StatusBadge } from "@/components/Common/primitives";
import { useInvestigation } from "@/state/investigation";

export const Route = createFileRoute("/environment")({
  head: () => ({
    meta: [
      { title: "Environmental Data — OceanTrace Conditions" },
      {
        name: "description",
        content:
          "Ocean current, wind and wave conditions driving the drift simulation across the 24-hour investigation window.",
      },
      { property: "og:title", content: "Environmental Data — OceanTrace" },
      {
        property: "og:description",
        content: "Metocean inputs feeding the oil spill drift reconstruction.",
      },
    ],
  }),
  component: Environment,
});

function Environment() {
  const { activeCase } = useInvestigation();
  const env = activeCase.environmental;
  const series = Array.from({ length: 25 }, (_, i) => ({
    t: `${String(i).padStart(2, "0")}h`,
    current: +(1.1 + Math.sin(i / 3.4) * 0.35).toFixed(2),
    wind: +(16 + Math.cos(i / 2.6) * 5).toFixed(1),
    wave: +(1.6 + Math.sin(i / 4.1) * 0.4).toFixed(2),
  }));

  return (
    <div className="space-y-5">
      <SectionTitle
        kicker="Intelligence"
        title="Environmental Conditions"
        description="Metocean fields ingested from ocean-model and reanalysis sources, interpolated to the incident grid."
        right={<StatusBadge status="Simulation Window 24H" tone="cyan" />}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Ocean Current" value={`${env.currentSpeedMs} m/s`} hint={`→ ${env.currentDirection}`} />
        <Metric label="Wind" value={`${env.windSpeedKmh} km/h`} hint={`→ ${env.windDirection}`} />
        <Metric label="Wave Height" value={env.waveHeightM} unit="m" />
        <Metric label="Sea Temperature" value={env.seaTempC} unit="°C" />
        <Metric label="Simulation Window" value={env.simulationWindowHours} unit="hours" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Surface Current Field">
          <VectorField bearing={env.currentBearingDeg} label={`Current ${env.currentSpeedMs} m/s → ${env.currentDirection}`} />
        </Panel>
        <Panel title="Wind Field">
          <VectorField bearing={env.windBearingDeg} label={`Wind ${env.windSpeedKmh} km/h → ${env.windDirection}`} />
        </Panel>
      </div>

      <Panel title="24-Hour Conditions" subtitle="Hourly metocean profile over the investigation window">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={series}>
            <CartesianGrid stroke="var(--hairline)" strokeDasharray="3 3" />
            <XAxis dataKey="t" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} interval={2} />
            <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} width={30} />
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--hairline)",
                fontSize: 11,
              }}
            />
            <Area dataKey="wind" stroke="var(--amber)" fill="var(--amber)" fillOpacity={0.12} />
            <Area dataKey="current" stroke="var(--cyan)" fill="var(--cyan)" fillOpacity={0.16} />
            <Area dataKey="wave" stroke="var(--ok)" fill="var(--ok)" fillOpacity={0.1} />
          </AreaChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}
