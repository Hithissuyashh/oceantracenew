import { X } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Vessel } from "@/data/types";
import { project, toPath } from "@/components/Map/projection";
import { Metric } from "@/components/Common/primitives";

export function VesselDetail({
  vessel,
  onClose,
}: {
  vessel: Vessel;
  onClose: () => void;
}) {
  const series = vessel.track.map((p, i) => ({
    i,
    t: p.t.slice(11, 16),
    sog: p.sog,
    cog: p.cog,
    msgs: p.gap ? 0 : 4 + ((i * 7) % 5),
  }));

  const pts = vessel.track.map((p) => [p.lon, p.lat] as [number, number]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 p-4 backdrop-blur-sm">
      <div className="panel max-h-[92vh] w-full max-w-3xl overflow-y-auto p-6 anim-fade-up">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="label-xs text-cyan">Vessel Dossier</div>
            <h2 className="font-display text-2xl tracking-wide uppercase">
              {vessel.name}
            </h2>
            <p className="num mt-1 text-[11px] text-muted-foreground">
              {vessel.type} · MMSI {vessel.mmsi} · {vessel.imo} · {vessel.flag}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          <Metric label="Speed" value={vessel.speedKn} unit="kn" />
          <Metric label="Course" value={`${vessel.courseDeg}°`} />
          <Metric
            label="Last Position"
            value={`${vessel.lastPosition.lat.toFixed(2)}° N`}
            hint={`${vessel.lastPosition.lon.toFixed(2)}° E`}
          />
          <Metric label="DWT" value={vessel.dwt.toLocaleString()} unit="t" />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-md border border-hairline bg-surface/40 p-3">
            <div className="label-xs">Trajectory</div>
            <svg viewBox="0 0 1200 800" className="mt-2 h-40 w-full">
              <rect width="1200" height="800" fill="var(--ocean-deep)" />
              <path d={toPath(pts)} fill="none" stroke="var(--cyan)" strokeWidth={6} />
              {pts
                .filter((_, i) => i % 8 === 0)
                .map((p, i) => {
                  const [x, y] = project(p[0], p[1]);
                  return (
                    <circle key={i} cx={x} cy={y} r={7} fill="var(--cyan)" fillOpacity={0.5} />
                  );
                })}
            </svg>
          </div>

          <div className="rounded-md border border-hairline bg-surface/40 p-3">
            <div className="label-xs">Speed over ground (kn)</div>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={series}>
                <CartesianGrid stroke="var(--hairline)" strokeDasharray="3 3" />
                <XAxis dataKey="t" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} interval={9} />
                <YAxis tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} width={24} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--hairline)",
                    fontSize: 11,
                  }}
                />
                <Area dataKey="sog" stroke="var(--cyan)" fill="var(--cyan)" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-md border border-hairline bg-surface/40 p-3">
            <div className="label-xs">Course changes (deg)</div>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={series}>
                <CartesianGrid stroke="var(--hairline)" strokeDasharray="3 3" />
                <XAxis dataKey="t" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} interval={9} />
                <YAxis tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} width={28} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--hairline)",
                    fontSize: 11,
                  }}
                />
                <Line dataKey="cog" stroke="var(--amber)" dot={false} strokeWidth={1.6} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-md border border-hairline bg-surface/40 p-3">
            <div className="label-xs">AIS transmission history</div>
            <div className="mt-3 flex h-[130px] items-end gap-[3px]">
              {series.map((s, i) => (
                <div
                  key={i}
                  title={`${s.t} · ${s.msgs} msgs`}
                  className="flex-1 rounded-sm transition-colors"
                  style={{
                    height: `${Math.max(6, (s.msgs / 9) * 100)}%`,
                    background: s.msgs === 0 ? "var(--oil)" : "var(--cyan-dim)",
                    opacity: s.msgs === 0 ? 0.9 : 0.65,
                  }}
                />
              ))}
            </div>
            <div className="num mt-2 text-[10px] text-muted-foreground">
              Red bars indicate transmission gaps · operator {vessel.operator} ·
              destination {vessel.destination}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
