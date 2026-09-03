import { useEffect, useMemo, useRef, useState } from "react";
import { Crosshair, Minus, Plus, Ship } from "lucide-react";
import { BACKGROUND_TRACKS } from "@/data/mock";
import { useInvestigation } from "@/state/investigation";
import { cn } from "@/lib/utils";
import { MAP_H, MAP_W, project, toPath, toPoints } from "./projection";

const MIN_Z = 0.7;
const MAX_Z = 6;

export function InvestigationMap({
  className,
  showControls = true,
  focusLabel,
}: {
  className?: string;
  showControls?: boolean;
  focusLabel?: string;
}) {
  const {
    activeCase,
    layers,
    selectedVesselId,
    setSelectedVesselId,
    activeEventId,
  } = useInvestigation();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ z: 1, x: 0, y: 0 });
  const viewRef = useRef(view);
  viewRef.current = view;
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  // Native non-passive wheel listener: React's onWheel is passive.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const cur = viewRef.current;
      const next = Math.min(MAX_Z, Math.max(MIN_Z, cur.z * Math.exp(-dy * 0.0018)));
      const k = next / cur.z;
      setView({
        z: next,
        x: px - (px - cur.x) * k,
        y: py - (py - cur.y) * k,
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const zoomBy = (f: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = rect.width / 2;
    const py = rect.height / 2;
    const cur = viewRef.current;
    const next = Math.min(MAX_Z, Math.max(MIN_Z, cur.z * f));
    const k = next / cur.z;
    setView({ z: next, x: px - (px - cur.x) * k, y: py - (py - cur.y) * k });
  };

  const eventFocus = useMemo(
    () => activeCase.timeline.find((e) => e.id === activeEventId)?.focus,
    [activeCase.timeline, activeEventId],
  );

  const spill = activeCase.spill.geometry;
  const [cx, cy] = project(spill.centroid.lon, spill.centroid.lat);

  const dim = (key: string) =>
    eventFocus && eventFocus !== key ? "opacity-35" : "opacity-100";

  return (
    <div
      ref={wrapRef}
      className={cn(
        "relative overflow-hidden rounded-lg border border-hairline bg-ocean-deep select-none",
        className,
      )}
      onPointerDown={(e) => {
        drag.current = { x: e.clientX, y: e.clientY, ox: view.x, oy: view.y };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d) return;
        const nx = d.ox + (e.clientX - d.x);
        const ny = d.oy + (e.clientY - d.y);
        setView((v) => ({ ...v, x: nx, y: ny }));
      }}
      onPointerUp={() => (drag.current = null)}
      onPointerLeave={() => (drag.current = null)}
      style={{ cursor: drag.current ? "grabbing" : "grab" }}
    >
      <svg
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
      >
        <defs>
          <radialGradient id="ot-sea" cx="45%" cy="35%" r="80%">
            <stop offset="0%" stopColor="var(--ocean)" />
            <stop offset="100%" stopColor="var(--ocean-deep)" />
          </radialGradient>
          <linearGradient id="ot-slick" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--oil)" stopOpacity="0.75" />
            <stop offset="100%" stopColor="var(--oil-deep)" stopOpacity="0.5" />
          </linearGradient>
          <radialGradient id="ot-origin" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--amber)" stopOpacity="0.5" />
            <stop offset="70%" stopColor="var(--amber)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--amber)" stopOpacity="0" />
          </radialGradient>
          <pattern id="ot-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path
              d="M60 0H0V60"
              fill="none"
              stroke="var(--cyan)"
              strokeOpacity="0.07"
              strokeWidth="1"
            />
          </pattern>
          <filter id="ot-blur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
          <filter id="ot-soft" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>

        <rect width={MAP_W} height={MAP_H} fill="url(#ot-sea)" />

        <g
          transform={`translate(${view.x} ${view.y}) scale(${view.z})`}
          style={{ transition: drag.current ? "none" : "transform 220ms ease-out" }}
        >
          {/* bathymetry + graticule */}
          {layers.satellite && (
            <g>
              <rect width={MAP_W} height={MAP_H} fill="url(#ot-grid)" />
              {[0.18, 0.34, 0.52].map((f, i) => (
                <ellipse
                  key={i}
                  cx={MAP_W * 0.38}
                  cy={MAP_H * 0.62}
                  rx={MAP_W * (0.5 + f)}
                  ry={MAP_H * (0.36 + f)}
                  fill="none"
                  stroke="var(--cyan)"
                  strokeOpacity={0.05}
                  strokeWidth={1}
                />
              ))}
              {/* coastline sliver */}
              <path
                d={`M0 ${MAP_H} L0 ${MAP_H * 0.42} C ${MAP_W * 0.08} ${MAP_H * 0.5}, ${MAP_W * 0.04} ${MAP_H * 0.72}, ${MAP_W * 0.12} ${MAP_H} Z`}
                fill="var(--land)"
                fillOpacity="0.45"
                stroke="var(--cyan)"
                strokeOpacity="0.2"
              />
              <text
                x={26}
                y={MAP_H * 0.9}
                className="num"
                fontSize={13}
                fill="var(--cyan)"
                fillOpacity="0.5"
                letterSpacing="2"
              >
                MAHARASHTRA COAST
              </text>
            </g>
          )}

          {/* Forecast regions */}
          {layers.forecast && (
            <g className={dim("forecast")}>
              {[...activeCase.drift.forecastRegions].reverse().map((f) => (
                <g key={f.hour}>
                  <polygon
                    points={toPoints(f.polygon)}
                    fill="var(--cyan)"
                    fillOpacity={0.07}
                    stroke="var(--cyan)"
                    strokeOpacity={0.35}
                    strokeWidth={1.2}
                    strokeDasharray="8 6"
                    className="anim-dash"
                  />
                  <text
                    x={project(f.polygon[0]![0], f.polygon[0]![1])[0]}
                    y={project(f.polygon[0]![0], f.polygon[0]![1])[1] - 6}
                    fontSize={13}
                    className="num"
                    fill="var(--cyan)"
                    fillOpacity="0.85"
                  >
                    +{f.hour}H
                  </text>
                </g>
              ))}
              {activeCase.drift.forecastPaths.map((p, i) => (
                <path
                  key={i}
                  d={toPath(p)}
                  fill="none"
                  stroke="var(--cyan)"
                  strokeOpacity={0.22}
                  strokeWidth={1}
                />
              ))}
            </g>
          )}

          {/* Hindcast paths */}
          {layers.hindcast && (
            <g className={dim("origin")}>
              {activeCase.drift.hindcastPaths.map((p, i) => (
                <path
                  key={i}
                  d={toPath(p)}
                  fill="none"
                  stroke="var(--amber)"
                  strokeOpacity={0.3}
                  strokeWidth={1}
                  strokeDasharray="5 7"
                  className="anim-dash"
                  style={{ animationDuration: `${7 + i * 0.6}s`, animationDirection: "reverse" }}
                />
              ))}
            </g>
          )}

          {/* Origin probability */}
          {layers.origin && (
            <g className={dim("origin")}>
              <polygon
                points={toPoints(activeCase.drift.originRegion)}
                fill="url(#ot-origin)"
                filter="url(#ot-soft)"
              />
              <polygon
                points={toPoints(activeCase.drift.originRegion)}
                fill="none"
                stroke="var(--amber)"
                strokeOpacity={0.65}
                strokeWidth={1.4}
                strokeDasharray="4 5"
              />
              <MapLabel
                x={project(72.706, 19.402)[0]}
                y={project(72.706, 19.402)[1] + 70}
                tone="amber"
                lines={[
                  "PROBABLE ORIGIN REGION",
                  "Confidence: Medium",
                  "Release window: 18–24 h ago",
                ]}
              />
            </g>
          )}

          {/* Oil slick */}
          {layers.detection && (
            <g className={dim("spill")}>
              <polygon
                points={toPoints(spill.polygon)}
                fill="var(--oil)"
                fillOpacity={0.25}
                filter="url(#ot-blur)"
              />
              <polygon
                points={toPoints(spill.polygon)}
                fill="url(#ot-slick)"
                stroke="var(--oil)"
                strokeWidth={layers.geometry ? 1.6 : 0.8}
                strokeOpacity={0.9}
              />
              {layers.geometry && (
                <g>
                  <line
                    x1={cx - 120}
                    y1={cy - 108}
                    x2={cx + 120}
                    y2={cy + 108}
                    stroke="var(--cyan)"
                    strokeOpacity={0.6}
                    strokeDasharray="6 5"
                  />
                  <line
                    x1={cx - 32}
                    y1={cy + 36}
                    x2={cx + 32}
                    y2={cy - 36}
                    stroke="var(--cyan)"
                    strokeOpacity={0.4}
                    strokeDasharray="4 4"
                  />
                  <circle cx={cx} cy={cy} r={4} fill="var(--cyan)" />
                  <circle
                    cx={cx}
                    cy={cy}
                    r={26}
                    fill="none"
                    stroke="var(--cyan)"
                    strokeOpacity={0.35}
                  />
                </g>
              )}
              <MapLabel
                x={cx + 90}
                y={cy - 78}
                tone="oil"
                lines={[
                  "OIL SLICK",
                  `${spill.areaKm2} km²`,
                  `Detection: ${Math.round(activeCase.spill.detectionConfidence * 100)}%`,
                ]}
              />
            </g>
          )}

          {/* Background AIS traffic */}
          {layers.ais && (
            <g className={dim("ais")}>
              {BACKGROUND_TRACKS.map((t, i) => (
                <path
                  key={i}
                  d={toPath(t)}
                  fill="none"
                  stroke="var(--cyan)"
                  strokeOpacity={0.14}
                  strokeWidth={0.9}
                />
              ))}
            </g>
          )}

          {/* Candidate vessels */}
          {layers.candidates && (
            <g>
              {[...activeCase.candidates].reverse().map(({ vessel, attribution }) => {
                const selected = vessel.id === selectedVesselId;
                const pts = vessel.track.map(
                  (p) => [p.lon, p.lat] as [number, number],
                );
                const [vx, vy] = project(
                  vessel.lastPosition.lon,
                  vessel.lastPosition.lat,
                );
                const tone = selected
                  ? "var(--cyan)"
                  : attribution.rank <= 2
                    ? "var(--amber)"
                    : "var(--cyan-dim)";
                return (
                  <g
                    key={vessel.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVesselId(vessel.id);
                    }}
                    className="cursor-pointer"
                    opacity={selected ? 1 : 0.78}
                  >
                    <path
                      d={toPath(pts)}
                      fill="none"
                      stroke={tone}
                      strokeWidth={selected ? 2.4 : 1.3}
                      strokeOpacity={selected ? 0.95 : 0.55}
                    />
                    {selected && (
                      <path
                        d={toPath(pts)}
                        fill="none"
                        stroke="var(--cyan)"
                        strokeWidth={5}
                        strokeOpacity={0.16}
                        filter="url(#ot-soft)"
                      />
                    )}
                    {vessel.track
                      .filter((p) => p.gap)
                      .slice(0, 1)
                      .map((p, i) => {
                        const [gx, gy] = project(p.lon, p.lat);
                        return (
                          <circle
                            key={i}
                            cx={gx}
                            cy={gy}
                            r={7}
                            fill="none"
                            stroke="var(--oil)"
                            strokeWidth={1.6}
                            strokeDasharray="3 3"
                          />
                        );
                      })}
                    {selected && (
                      <circle cx={vx} cy={vy} r={18} fill={tone} fillOpacity={0.14} />
                    )}
                    <g transform={`translate(${vx} ${vy}) rotate(${vessel.courseDeg})`}>
                      <path
                        d="M0,-10 L6,8 L0,4 L-6,8 Z"
                        fill={tone}
                        stroke="var(--background)"
                        strokeWidth={0.8}
                      />
                    </g>
                    <text
                      x={vx + 13}
                      y={vy - 2}
                      fontSize={12}
                      className="num"
                      fill={tone}
                      fillOpacity={selected ? 1 : 0.8}
                    >
                      {vessel.name}
                    </text>
                    <text
                      x={vx + 13}
                      y={vy + 12}
                      fontSize={10.5}
                      className="num"
                      fill="var(--muted-foreground)"
                    >
                      MMSI {vessel.mmsi} · {Math.round(attribution.overall * 100)}%
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        </g>
      </svg>

      {/* overlays */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <div className="panel px-2.5 py-1.5">
            <div className="label-xs text-cyan">
              {activeCase.region} · {activeCase.id}
            </div>
            <div className="num mt-0.5 text-[10px] text-muted-foreground">
              19.482° N 72.826° E · SENTINEL-1A SAR
            </div>
          </div>
          {focusLabel && (
            <div className="panel num px-2.5 py-1.5 text-[10px] tracking-widest text-amber uppercase">
              {focusLabel}
            </div>
          )}
        </div>

        <div className="absolute bottom-3 left-3 flex items-end gap-3">
          <div className="panel px-2.5 py-1.5">
            <div className="flex items-center gap-1.5">
              <div className="h-[3px] w-14 bg-cyan/70" />
              <span className="num text-[10px] text-muted-foreground">10 km</span>
            </div>
          </div>
          <Legend />
        </div>
      </div>

      {showControls && (
        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          <MapBtn onClick={() => zoomBy(1.4)} label="Zoom in">
            <Plus className="h-3.5 w-3.5" />
          </MapBtn>
          <MapBtn onClick={() => zoomBy(1 / 1.4)} label="Zoom out">
            <Minus className="h-3.5 w-3.5" />
          </MapBtn>
          <MapBtn onClick={() => setView({ z: 1, x: 0, y: 0 })} label="Recenter">
            <Crosshair className="h-3.5 w-3.5" />
          </MapBtn>
        </div>
      )}
    </div>
  );
}

function MapBtn({
  onClick,
  children,
  label,
}: {
  onClick: () => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="panel flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-cyan"
    >
      {children}
    </button>
  );
}

function Legend() {
  const items = [
    { c: "bg-oil", t: "Oil slick" },
    { c: "bg-amber", t: "Origin probability" },
    { c: "bg-cyan", t: "Forecast / candidate" },
  ];
  return (
    <div className="panel hidden gap-3 px-2.5 py-1.5 sm:flex">
      {items.map((i) => (
        <span key={i.t} className="flex items-center gap-1.5">
          <span className={cn("h-2 w-2 rounded-[2px]", i.c)} />
          <span className="num text-[10px] text-muted-foreground">{i.t}</span>
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <Ship className="h-3 w-3 text-cyan" />
        <span className="num text-[10px] text-muted-foreground">Vessel</span>
      </span>
    </div>
  );
}

function MapLabel({
  x,
  y,
  lines,
  tone,
}: {
  x: number;
  y: number;
  lines: string[];
  tone: "oil" | "amber" | "cyan";
}) {
  const color =
    tone === "oil" ? "var(--oil)" : tone === "amber" ? "var(--amber)" : "var(--cyan)";
  const w = Math.max(...lines.map((l) => l.length)) * 7.2 + 20;
  return (
    <g>
      <line x1={x - 14} y1={y + 8} x2={x} y2={y + 8} stroke={color} strokeOpacity={0.7} />
      <rect
        x={x}
        y={y - 8}
        width={w}
        height={lines.length * 16 + 12}
        rx={3}
        fill="var(--background)"
        fillOpacity={0.82}
        stroke={color}
        strokeOpacity={0.45}
      />
      {lines.map((l, i) => (
        <text
          key={l}
          x={x + 10}
          y={y + 10 + i * 16}
          fontSize={i === 0 ? 12.5 : 11}
          className="num"
          fill={i === 0 ? color : "var(--muted-foreground)"}
          letterSpacing={i === 0 ? 1.2 : 0}
        >
          {l}
        </text>
      ))}
    </g>
  );
}
