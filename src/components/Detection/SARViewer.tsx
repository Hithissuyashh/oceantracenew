import { useRef, useState } from "react";
import { toPoints } from "@/components/Map/projection";
import { PRIMARY_CASE } from "@/data/mock";

/** Synthetic SAR scene + AI segmentation overlay with a comparison slider. */
export function SARComparison() {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const poly = toPoints(PRIMARY_CASE.spill.geometry.polygon);

  return (
    <div className="space-y-3">
      <div
        ref={ref}
        className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-hairline bg-black"
      >
        <SarScene />
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
        >
          <SarScene segmented polygon={poly} />
        </div>

        <div
          className="pointer-events-none absolute inset-y-0 w-px bg-cyan shadow-[0_0_14px_var(--cyan)]"
          style={{ left: `${pos}%` }}
        >
          <span className="absolute top-1/2 left-1/2 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-cyan bg-background num text-[9px] text-cyan">
            ↔
          </span>
        </div>

        <span className="num absolute bottom-2 left-3 text-[10px] tracking-widest text-cyan/80 uppercase">
          Original SAR
        </span>
        <span className="num absolute right-3 bottom-2 text-[10px] tracking-widest text-oil uppercase">
          AI Detection
        </span>

        <input
          type="range"
          min={0}
          max={100}
          value={pos}
          aria-label="Compare SAR and AI detection"
          onChange={(e) => setPos(Number(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>
      <div className="num flex justify-between text-[10px] tracking-widest text-muted-foreground uppercase">
        <span>Original SAR ←</span>
        <span>Drag to compare</span>
        <span>→ AI Detection</span>
      </div>
    </div>
  );
}

function SarScene({
  segmented = false,
  polygon,
}: {
  segmented?: boolean;
  polygon?: string;
}) {
  return (
    <svg viewBox="0 0 1200 800" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <filter id="sar-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.55" />
          </feComponentTransfer>
        </filter>
        <radialGradient id="sar-bg" cx="50%" cy="45%" r="75%">
          <stop offset="0%" stopColor="#2b3340" />
          <stop offset="100%" stopColor="#0d1117" />
        </radialGradient>
        <linearGradient id="seg-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--oil)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="var(--oil-deep)" stopOpacity="0.45" />
        </linearGradient>
      </defs>
      <rect width="1200" height="800" fill="url(#sar-bg)" />
      <rect width="1200" height="800" filter="url(#sar-noise)" opacity="0.35" />
      {/* dark low-backscatter slick signature */}
      <polygon points={polygonFallback} fill="#05070a" opacity="0.85" />
      <polygon points={polygonFallback} fill="#000" opacity="0.4" transform="translate(6 4)" />
      {segmented && polygon && (
        <>
          <polygon points={polygonFallback} fill="url(#seg-fill)" />
          <polygon
            points={polygonFallback}
            fill="none"
            stroke="var(--oil)"
            strokeWidth="3"
            strokeDasharray="10 6"
            className="anim-dash"
          />
          <text x="40" y="60" className="num" fontSize="22" fill="var(--oil)">
            SEGMENTATION MASK · CONF 0.94
          </text>
        </>
      )}
      {/* range/azimuth ticks */}
      {Array.from({ length: 13 }, (_, i) => (
        <line
          key={i}
          x1={i * 100}
          y1={0}
          x2={i * 100}
          y2={12}
          stroke="#8fa3b8"
          strokeOpacity="0.5"
        />
      ))}
    </svg>
  );
}

const polygonFallback = (() => {
  const p = PRIMARY_CASE.spill.geometry.polygon;
  const lons = p.map((c) => c[0]);
  const lats = p.map((c) => c[1]);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  return p
    .map((c) => {
      const x = 140 + ((c[0] - minLon) / (maxLon - minLon)) * 920;
      const y = 640 - ((c[1] - minLat) / (maxLat - minLat)) * 480;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
})();
