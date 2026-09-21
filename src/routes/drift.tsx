import { createFileRoute } from "@tanstack/react-router";
import { VectorField } from "@/components/Drift/ParticleField";
import { DriftScene } from "@/components/Drift/DriftScene";
import { Metric, Panel, SectionTitle, StatusBadge } from "@/components/Common/primitives";
import { useInvestigation } from "@/state/investigation";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/drift")({
  head: () => ({
    meta: [
      { title: "Drift Intelligence — OceanTrace Hindcast & Forecast" },
      {
        name: "description",
        content:
          "Particle-based hindcast reconstructing the probable release origin and forecast projecting slick movement over the next 24 hours.",
      },
      { property: "og:title", content: "Drift Intelligence — OceanTrace" },
      {
        property: "og:description",
        content:
          "Lagrangian drift simulation with uncertainty clouds for oil spill origin reconstruction.",
      },
    ],
  }),
  component: Drift,
});

const HIND = [-24, -18, -12, -6, 0];
const FORE = [0, 6, 12, 24];

function Drift() {
  const { activeCase, driftHour, setDriftHour } = useInvestigation();
  const env = activeCase.environmental;

  return (
    <div className="space-y-5">
      <SectionTitle
        kicker="Analysis"
        title="Drift Intelligence"
        description="Backward reconstruction of the release origin and forward projection of the slick, driven by ocean current and wind fields."
        right={<StatusBadge status={`Drift Confidence ${activeCase.drift.confidence}`} tone="amber" />}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="← Hindcast · Past"
          subtitle="Particles integrated backward toward the probable origin"
          right={
            <span className="num text-[10px] tracking-widest text-amber uppercase">
              T{driftHour <= 0 ? driftHour : 0}H
            </span>
          }
        >
          <div className="relative h-[300px] overflow-hidden rounded-md border border-hairline bg-ocean-deep grid-bg">
            <DriftScene direction={-1} />
            <span className="num pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] tracking-widest text-amber uppercase">
              Origin uncertainty cloud
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {HIND.map((h) => (
              <TimeBtn
                key={h}
                active={driftHour === h}
                onClick={() => setDriftHour(h)}
                label={h === 0 ? "NOW" : `${h}H`}
                tone="amber"
              />
            ))}
          </div>
        </Panel>

        <Panel
          title="Forecast · Future →"
          subtitle="Projected slick envelope with expanding uncertainty"
          right={
            <span className="num text-[10px] tracking-widest text-cyan uppercase">
              T+{driftHour >= 0 ? driftHour : 0}H
            </span>
          }
        >
          <div className="relative h-[300px] overflow-hidden rounded-md border border-hairline bg-ocean-deep grid-bg">
            <DriftScene direction={1} />
            <span className="num pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] tracking-widest text-cyan uppercase">
              Forecast dispersion envelope
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {FORE.map((h) => (
              <TimeBtn
                key={h}
                active={driftHour === h}
                onClick={() => setDriftHour(h)}
                label={h === 0 ? "NOW" : `+${h}H`}
                tone="cyan"
              />
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
        <Panel title="Environmental Inputs">
          <div className="grid grid-cols-2 gap-2">
            <Metric label="Current Speed" value={env.currentSpeedMs} unit="m/s" hint={env.currentDirection} />
            <Metric label="Wind Speed" value={env.windSpeedKmh} unit="km/h" />
            <Metric label="Wind Direction" value={env.windDirection} hint={`${env.windBearingDeg}°`} />
            <Metric label="Wave Height" value={env.waveHeightM} unit="m" />
          </div>
        </Panel>
        <Panel title="Model">
          <dl className="space-y-2 text-[12.5px]">
            {[
              ["Engine", "Particle-Based Drift"],
              ["Particles", activeCase.drift.particles.toLocaleString()],
              ["Window", `${env.simulationWindowHours} hours`],
              ["Leeway Factor", "3.1 %"],
              ["Diffusion", "10 m²/s"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-hairline/60 pb-1.5">
                <dt className="label-xs">{k}</dt>
                <dd className="num">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-3 rounded-md border border-amber/30 bg-amber/8 p-2.5">
            <div className="label-xs text-amber">Drift Confidence</div>
            <div className="num mt-0.5 text-lg text-amber">MEDIUM</div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Wind-field latency of 5 h widens the origin envelope by ~1.8 km.
            </p>
          </div>
        </Panel>
        <Panel title="Field Vectors">
          <VectorField bearing={env.currentBearingDeg} label={`Surface current · ${env.currentSpeedMs} m/s → ${env.currentDirection}`} />
          <div className="mt-3">
            <VectorField bearing={env.windBearingDeg} label={`Wind · ${env.windSpeedKmh} km/h → ${env.windDirection}`} />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function TimeBtn({
  active,
  onClick,
  label,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  tone: "cyan" | "amber";
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-md border px-2.5 py-1 num text-[10px] tracking-widest uppercase transition-colors",
        active
          ? tone === "cyan"
            ? "border-cyan/50 bg-cyan/15 text-cyan"
            : "border-amber/50 bg-amber/15 text-amber"
          : "border-hairline text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
