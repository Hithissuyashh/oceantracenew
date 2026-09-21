import { useMemo } from "react";
import type { LngLat } from "@/data/types";
import { project } from "@/components/Map/projection";
import { useInvestigation } from "@/state/investigation";

/**
 * SVG drift scene: slick polygon, drift tracks, particle swarm at the
 * selected hour, dashed uncertainty ellipse and a soft dispersion cloud.
 * Purely presentational — reads the active case geometry.
 */
export function DriftScene({ direction }: { direction: -1 | 1 }) {
  const { activeCase, driftHour } = useInvestigation();
  const drift = activeCase.drift;

  const scene = useMemo(() => {
    const paths = direction === -1 ? drift.hindcastPaths : drift.forecastPaths;
    const slick = activeCase.spill.geometry.polygon.map((c) => project(c[0], c[1]));
    const tracks = paths.map((p: LngLat[]) => p.map((c) => project(c[0], c[1])));

    const xs = [...slick, ...tracks.flat()].map((p) => p[0]);
    const ys = [...slick, ...tracks.flat()].map((p) => p[1]);
    const pad = 60;
    const minX = Math.min(...xs) - pad;
    const minY = Math.min(...ys) - pad;
    const w = Math.max(...xs) - minX + pad;
    const h = Math.max(...ys) - minY + pad;

    return { slick, tracks, viewBox: `${minX} ${minY} ${w} ${h}`, w, h };
  }, [activeCase, drift, direction]);

  const maxH = direction === -1 ? 24 : 24;
  const t = Math.min(1, Math.abs(driftHour) / maxH);
  const color = direction === -1 ? "var(--amber)" : "var(--cyan)";

  // Particle positions: sample every track at progress t (plus jitter).
  const particles = scene.tracks.flatMap((track, ti) => {
    return Array.from({ length: 5 }, (_, k) => {
      const jitter = (((ti * 7 + k * 13) % 11) - 5) / 40;
      const p = Math.max(0, Math.min(1, t + jitter));
      const i = Math.floor((track.length - 1) * p);
      const cur = track[i] ?? [0, 0];
      const nxt = track[Math.min(track.length - 1, i + 1)] ?? cur;
      const f = (track.length - 1) * p - i;
      return {
        x: cur[0] + (nxt[0] - cur[0]) * f,
        y: cur[1] + (nxt[1] - cur[1]) * f,
        r: 2 + ((ti + k) % 3) * 0.8,
        key: `${ti}-${k}`,
      };
    });

  });

  const cx = particles.reduce((a, p) => a + p.x, 0) / (particles.length || 1);
  const cy = particles.reduce((a, p) => a + p.y, 0) / (particles.length || 1);
  const spreadX = Math.max(
    30,
    Math.sqrt(particles.reduce((a, p) => a + (p.x - cx) ** 2, 0) / (particles.length || 1)) * 1.9,
  );
  const spreadY = Math.max(
    22,
    Math.sqrt(particles.reduce((a, p) => a + (p.y - cy) ** 2, 0) / (particles.length || 1)) * 1.9,
  );

  const gid = direction === -1 ? "driftCloudH" : "driftCloudF";

  return (
    <svg viewBox={scene.viewBox} className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id={gid}>
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="60%" stopColor={color} stopOpacity={0.1} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </radialGradient>
        <pattern id={`${gid}-grid`} width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M60 0 H0 V60" fill="none" stroke={color} strokeOpacity={0.07} strokeWidth={1} />
        </pattern>
      </defs>

      <rect x="-5000" y="-5000" width="10000" height="10000" fill={`url(#${gid}-grid)`} />

      {/* dispersion cloud */}
      <ellipse cx={cx} cy={cy} rx={spreadX * 2.1} ry={spreadY * 2.1} fill={`url(#${gid})`} />

      {/* drift tracks */}
      {scene.tracks.map((track, i) => (
        <polyline
          key={i}
          points={track.map((p) => p.join(",")).join(" ")}
          fill="none"
          stroke={color}
          strokeOpacity={0.28}
          strokeWidth={1}
        />
      ))}

      {/* detected slick */}
      <polygon
        points={scene.slick.map((p) => p.join(",")).join(" ")}
        fill="var(--oil)"
        fillOpacity={0.55}
        stroke="var(--oil)"
        strokeWidth={1.5}
      />

      {/* uncertainty envelope */}
      <ellipse
        cx={cx}
        cy={cy}
        rx={spreadX}
        ry={spreadY}
        fill="none"
        stroke={color}
        strokeOpacity={0.75}
        strokeDasharray="6 5"
        strokeWidth={1.2}
      />

      {/* particles */}
      {particles.map((p) => (
        <circle key={p.key} cx={p.x} cy={p.y} r={p.r} fill={color} fillOpacity={0.9} />
      ))}
    </svg>
  );
}
