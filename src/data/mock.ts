import type {
  AISPoint,
  Case,
  EvidenceFactor,
  LngLat,
  Vessel,
} from "./types";

/* -------------------------------------------------------------------------
 * Deterministic pseudo-random helpers (stable across SSR + client renders)
 * ---------------------------------------------------------------------- */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const CENTER = { lat: 19.482, lon: 72.826 };

function blob(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rotDeg: number,
  wobble: number,
  seed: number,
  points = 42,
): LngLat[] {
  const r = rng(seed);
  const rot = (rotDeg * Math.PI) / 180;
  const out: LngLat[] = [];
  const noise = Array.from({ length: 5 }, () => r() * Math.PI * 2);
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2;
    let k = 1;
    noise.forEach((ph, j) => {
      k += (wobble / (j + 1.4)) * Math.sin(a * (j + 2) + ph);
    });
    const x = Math.cos(a) * rx * k;
    const y = Math.sin(a) * ry * k;
    out.push([
      cx + x * Math.cos(rot) - y * Math.sin(rot),
      cy + x * Math.sin(rot) + y * Math.cos(rot),
    ]);
  }
  return out;
}

function path(
  from: LngLat,
  to: LngLat,
  curve: number,
  seed: number,
  n = 26,
): LngLat[] {
  const r = rng(seed);
  const mx = (from[0] + to[0]) / 2 + (to[1] - from[1]) * curve;
  const my = (from[1] + to[1]) / 2 - (to[0] - from[0]) * curve;
  const pts: LngLat[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    pts.push([
      u * u * from[0] + 2 * u * t * mx + t * t * to[0] + (r() - 0.5) * 0.004,
      u * u * from[1] + 2 * u * t * my + t * t * to[1] + (r() - 0.5) * 0.004,
    ]);
  }
  return pts;
}

const OBS = new Date("2026-08-27T18:40:00Z");
function iso(hoursBefore: number) {
  return new Date(OBS.getTime() - hoursBefore * 3600_000).toISOString();
}

/* -------------------------------------------------------------------------
 * Geometry of the primary case
 * ---------------------------------------------------------------------- */
const SLICK = blob(CENTER.lon, CENTER.lat, 0.055, 0.017, 42, 0.16, 7, 54);
const ORIGIN_REGION = blob(72.706, 19.402, 0.043, 0.031, 20, 0.1, 21, 40);
const FORECAST = [6, 12, 24].map((hour, i) => ({
  hour,
  polygon: blob(
    CENTER.lon + 0.028 * (i + 1),
    CENTER.lat + 0.017 * (i + 1),
    0.055 + 0.028 * (i + 1),
    0.02 + 0.014 * (i + 1),
    48,
    0.1,
    31 + i,
    44,
  ),
}));

const HINDCAST = Array.from({ length: 9 }, (_, i) =>
  path(
    [CENTER.lon + (i - 4) * 0.006, CENTER.lat + (i - 4) * 0.004],
    [72.7 + (i - 4) * 0.012, 19.4 + (i - 4) * 0.01],
    0.1 + i * 0.02,
    100 + i,
  ),
);
const FORECAST_PATHS = Array.from({ length: 9 }, (_, i) =>
  path(
    [CENTER.lon + (i - 4) * 0.006, CENTER.lat + (i - 4) * 0.004],
    [72.95 + (i - 4) * 0.015, 19.58 + (i - 4) * 0.012],
    -0.08 - i * 0.015,
    200 + i,
  ),
);

/* -------------------------------------------------------------------------
 * Vessels
 * ---------------------------------------------------------------------- */
function track(
  seed: number,
  from: LngLat,
  to: LngLat,
  curve: number,
  baseSpeed: number,
  slowAt?: number,
  gapAt?: number,
): AISPoint[] {
  const line = path(from, to, curve, seed, 47);
  const r = rng(seed + 9);
  return line.map((p, i) => {
    const t = i / (line.length - 1);
    let sog = baseSpeed + (r() - 0.5) * 1.4;
    if (slowAt !== undefined && Math.abs(t - slowAt) < 0.1)
      sog = Math.max(1.2, sog - 8.5);
    const next = line[Math.min(i + 1, line.length - 1)]!;
    const cog =
      (Math.atan2(next[0] - p[0], next[1] - p[1]) * 180) / Math.PI;
    return {
      t: iso(28 - t * 28),
      lon: p[0],
      lat: p[1],
      sog: Math.round(sog * 10) / 10,
      cog: Math.round(((cog + 360) % 360) * 10) / 10,
      gap: gapAt !== undefined && Math.abs(t - gapAt) < 0.045,
    };
  });
}

interface VesselSeed {
  v: Omit<Vessel, "track" | "lastPosition" | "speedKn" | "courseDeg">;
  from: LngLat;
  to: LngLat;
  curve: number;
  speed: number;
  slowAt?: number;
  gapAt?: number;
  seed: number;
}

const VESSEL_SEEDS: VesselSeed[] = [
  {
    v: {
      id: "v1",
      name: "MT PACIFIC VOYAGER",
      mmsi: "356742000",
      imo: "IMO 9382714",
      type: "Oil / Chemical Tanker",
      flag: "Panama",
      lengthM: 249,
      dwt: 105_400,
      operator: "Pacific Marine Carriers",
      destination: "JEBEL ALI",
    },
    from: [72.61, 19.31],
    to: [72.94, 19.6],
    curve: 0.12,
    speed: 12.4,
    slowAt: 0.42,
    gapAt: 0.46,
    seed: 401,
  },
  {
    v: {
      id: "v2",
      name: "MV OCEAN CREST",
      mmsi: "356743821",
      imo: "IMO 9451220",
      type: "Bulk Carrier",
      flag: "Liberia",
      lengthM: 198,
      dwt: 76_300,
      operator: "Crest Shipping Ltd",
      destination: "MUNDRA",
    },
    from: [72.66, 19.58],
    to: [73.0, 19.36],
    curve: -0.1,
    speed: 13.8,
    slowAt: 0.55,
    seed: 402,
  },
  {
    v: {
      id: "v3",
      name: "SEA HORIZON",
      mmsi: "356748231",
      imo: "IMO 9277431",
      type: "Product Tanker",
      flag: "Marshall Islands",
      lengthM: 183,
      dwt: 49_900,
      operator: "Horizon Tankers",
      destination: "KANDLA",
    },
    from: [72.58, 19.5],
    to: [73.02, 19.52],
    curve: 0.16,
    speed: 11.1,
    seed: 403,
  },
  {
    v: {
      id: "v4",
      name: "BLUE MERIDIAN",
      mmsi: "356749887",
      imo: "IMO 9612088",
      type: "Container Ship",
      flag: "Singapore",
      lengthM: 260,
      dwt: 91_200,
      operator: "Meridian Lines",
      destination: "COLOMBO",
    },
    from: [72.72, 19.24],
    to: [73.05, 19.66],
    curve: -0.18,
    speed: 16.2,
    seed: 404,
  },
  {
    v: {
      id: "v5",
      name: "ATLANTIC STAR",
      mmsi: "356751234",
      imo: "IMO 9188402",
      type: "General Cargo",
      flag: "India",
      lengthM: 142,
      dwt: 28_700,
      operator: "Star Coastal Pvt",
      destination: "MUMBAI",
    },
    from: [72.55, 19.66],
    to: [72.9, 19.2],
    curve: 0.2,
    speed: 9.6,
    seed: 405,
  },
];

export const VESSELS: Vessel[] = VESSEL_SEEDS.map((s) => {
  const tr = track(s.seed, s.from, s.to, s.curve, s.speed, s.slowAt, s.gapAt);
  const last = tr[tr.length - 1]!;
  return {
    ...s.v,
    track: tr,
    lastPosition: { lat: last.lat, lon: last.lon },
    speedKn: last.sog,
    courseDeg: Math.round(last.cog),
  };
});

/* Background (non-candidate) AIS traffic */
export const BACKGROUND_TRACKS: LngLat[][] = Array.from({ length: 14 }, (_, i) => {
  const r = rng(700 + i);
  return path(
    [72.5 + r() * 0.55, 19.15 + r() * 0.6],
    [72.5 + r() * 0.55, 19.15 + r() * 0.6],
    (r() - 0.5) * 0.3,
    800 + i,
    18,
  );
});

/* -------------------------------------------------------------------------
 * Attribution
 * ---------------------------------------------------------------------- */
function factors(
  spatial: number,
  temporal: number,
  drift: number,
  behaviour: number,
  trajectory: number,
  detailSet: string[],
): EvidenceFactor[] {
  return [
    { key: "spatial", label: "Spatial Proximity", score: spatial, weight: 0.25, detail: detailSet[0]! },
    { key: "temporal", label: "Temporal Correlation", score: temporal, weight: 0.25, detail: detailSet[1]! },
    { key: "drift", label: "Drift Consistency", score: drift, weight: 0.2, detail: detailSet[2]! },
    { key: "behaviour", label: "Behavioural Anomaly", score: behaviour, weight: 0.15, detail: detailSet[3]! },
    { key: "trajectory", label: "Trajectory Consistency", score: trajectory, weight: 0.15, detail: detailSet[4]! },
  ];
}

const ATTRIBUTION = [
  {
    vesselId: "v1",
    rank: 1,
    overall: 0.89,
    aisGapMinutes: 27,
    assessment: "HIGHLY RELEVANT CANDIDATE",
    factors: factors(0.94, 0.91, 0.84, 0.72, 0.9, [
      "Transited the probable origin region for 41 minutes.",
      "Presence overlaps 92% of the estimated release window.",
      "Backward drift envelope intersects the vessel corridor.",
      "Speed dropped from 12.6 kn to 3.1 kn with no port call scheduled.",
      "Course held within 4° of the reconstructed release bearing.",
    ]),
    findings: [
      { kind: "match" as const, text: "Entered probable origin region" },
      { kind: "match" as const, text: "Present during estimated release window" },
      { kind: "match" as const, text: "Trajectory consistent with hindcast region" },
      { kind: "match" as const, text: "Unusual speed reduction detected" },
      { kind: "warn" as const, text: "AIS transmission gap: 27 minutes" },
    ],
  },
  {
    vesselId: "v2",
    rank: 2,
    overall: 0.74,
    aisGapMinutes: 0,
    assessment: "RELEVANT CANDIDATE",
    factors: factors(0.79, 0.76, 0.68, 0.55, 0.71, [
      "Passed 3.1 km from the origin envelope boundary.",
      "Presence overlaps 61% of the release window.",
      "Partial agreement with hindcast particle density.",
      "Minor unexplained loitering near waypoint 4.",
      "Heading deviates 19° from reconstructed bearing.",
    ]),
    findings: [
      { kind: "match" as const, text: "Adjacent to probable origin region" },
      { kind: "match" as const, text: "Partial overlap with release window" },
      { kind: "warn" as const, text: "Drift correlation only partial" },
    ],
  },
  {
    vesselId: "v3",
    rank: 3,
    overall: 0.61,
    aisGapMinutes: 8,
    assessment: "MODERATE CANDIDATE",
    factors: factors(0.66, 0.63, 0.52, 0.48, 0.58, [
      "Closest approach 6.4 km from origin envelope.",
      "Entered region after 48% of the release window elapsed.",
      "Weak agreement with hindcast envelope.",
      "Nominal transit behaviour observed.",
      "Course inconsistent with reconstructed bearing.",
    ]),
    findings: [
      { kind: "match" as const, text: "Within regional AIS envelope" },
      { kind: "warn" as const, text: "Late entry relative to release window" },
      { kind: "warn" as const, text: "AIS transmission gap: 8 minutes" },
    ],
  },
  {
    vesselId: "v4",
    rank: 4,
    overall: 0.42,
    aisGapMinutes: 0,
    assessment: "LOW RELEVANCE",
    factors: factors(0.45, 0.4, 0.38, 0.3, 0.44, [
      "Transit corridor 11.8 km from origin envelope.",
      "Marginal overlap with release window.",
      "Hindcast correlation below threshold.",
      "No anomalous manoeuvres detected.",
      "Trajectory diverges from reconstructed bearing.",
    ]),
    findings: [
      { kind: "match" as const, text: "Regionally present during window" },
      { kind: "warn" as const, text: "No origin-region intersection" },
    ],
  },
  {
    vesselId: "v5",
    rank: 5,
    overall: 0.28,
    aisGapMinutes: 0,
    assessment: "LOW RELEVANCE",
    factors: factors(0.32, 0.27, 0.24, 0.2, 0.31, [
      "Peripheral transit, 17.2 km from origin envelope.",
      "Departed region before window midpoint.",
      "No hindcast intersection.",
      "Routine coastal behaviour.",
      "Opposing heading throughout window.",
    ]),
    findings: [
      { kind: "match" as const, text: "Detected in wider search region" },
      { kind: "warn" as const, text: "Outside reachable origin set" },
    ],
  },
];

/* -------------------------------------------------------------------------
 * Cases
 * ---------------------------------------------------------------------- */
export const PRIMARY_CASE: Case = {
  id: "OT-2026-0017",
  region: "Arabian Sea",
  status: "ACTIVE",
  priority: "HIGH",
  observedAt: OBS.toISOString(),
  observation: {
    id: "obs-1",
    platform: "Sentinel-1A",
    sensor: "C-band SAR",
    mode: "IW / VV+VH",
    capturedAt: OBS.toISOString(),
    resolutionM: 10,
    incidenceAngleDeg: 38.4,
    sceneId: "S1A_IW_GRDH_1SDV_20260827T184012",
  },
  spill: {
    geometry: {
      areaKm2: 12.4,
      perimeterKm: 18.7,
      majorAxisKm: 7.2,
      minorAxisKm: 2.1,
      orientationDeg: 42,
      centroid: CENTER,
      fragmentationIndex: 0.37,
      polygon: SLICK,
    },
    detectionConfidence: 0.94,
    model: { name: "U-Net SAR Segmentation", iou: 0.82, dice: 0.89, version: "v3.2.1" },
    releaseWindowHours: [18, 24],
    releaseWindowConfidence: "MEDIUM",
  },
  environmental: {
    currentSpeedMs: 1.4,
    currentDirection: "SW",
    currentBearingDeg: 225,
    windSpeedKmh: 18,
    windDirection: "NW",
    windBearingDeg: 315,
    waveHeightM: 1.8,
    seaTempC: 28.6,
    simulationWindowHours: 24,
  },
  drift: {
    model: "Particle-Based Drift (Lagrangian, 5k particles)",
    confidence: "MEDIUM",
    particles: 5000,
    hindcastPaths: HINDCAST,
    forecastPaths: FORECAST_PATHS,
    originRegion: ORIGIN_REGION,
    forecastRegions: FORECAST,
  },
  candidates: ATTRIBUTION.map((a) => ({
    vessel: VESSELS.find((v) => v.id === a.vesselId)!,
    attribution: a,
  })),
  vesselsAnalyzed: 247,
  timeline: [
    { id: "t1", time: "06:00", label: "AIS activity begins near region", detail: "247 vessels enter the 60 km search envelope.", focus: "ais" },
    { id: "t2", time: "09:30", label: "Suspicious vessel trajectory deviation", detail: "MT PACIFIC VOYAGER reduces speed to 3.1 kn off-route.", focus: "vessel", vesselId: "v1" },
    { id: "t3", time: "13:15", label: "Probable release window begins", detail: "Hindcast places the release 18–24 h before observation.", focus: "origin" },
    { id: "t4", time: "18:40", label: "Satellite captures suspected oil slick", detail: "Sentinel-1A C-band SAR scene, 10 m resolution.", focus: "spill" },
    { id: "t5", time: "CURRENT", label: "Investigation generated", detail: "5 candidate vessels ranked by evidence score.", focus: "forecast" },
  ],
  funnel: [
    { label: "AIS Records", value: 12847 },
    { label: "Regional Vessels", value: 247 },
    { label: "Time-Correlated", value: 38 },
    { label: "Origin-Reachable", value: 12 },
    { label: "Candidate Vessels", value: 5 },
  ],
};

export interface CaseSummary {
  id: string;
  region: string;
  status: Case["status"];
  priority: Case["priority"];
  observedAt: string;
  areaKm2: number;
  topScore: number;
  topVessel: string;
  candidates: number;
}

export const CASE_HISTORY: CaseSummary[] = [
  {
    id: "OT-2026-0017",
    region: "Arabian Sea",
    status: "ACTIVE",
    priority: "HIGH",
    observedAt: "2026-08-27T18:40:00Z",
    areaKm2: 12.4,
    topScore: 0.89,
    topVessel: "MT PACIFIC VOYAGER",
    candidates: 5,
  },
  {
    id: "OT-2026-0016",
    region: "Bay of Bengal",
    status: "RESOLVED",
    priority: "HIGH",
    observedAt: "2026-08-19T04:12:00Z",
    areaKm2: 8.7,
    topScore: 0.91,
    topVessel: "MT CORAL SPIRIT",
    candidates: 3,
  },
  {
    id: "OT-2026-0015",
    region: "Indian Ocean",
    status: "MONITORING",
    priority: "MEDIUM",
    observedAt: "2026-08-11T21:05:00Z",
    areaKm2: 5.2,
    topScore: 0.72,
    topVessel: "MV SOUTHERN GALE",
    candidates: 4,
  },
  {
    id: "OT-2026-0014",
    region: "Gulf of Kutch",
    status: "RESOLVED",
    priority: "LOW",
    observedAt: "2026-07-30T11:48:00Z",
    areaKm2: 2.1,
    topScore: 0.64,
    topVessel: "MV RANN TRADER",
    candidates: 2,
  },
  {
    id: "OT-2026-0013",
    region: "Arabian Sea",
    status: "RESOLVED",
    priority: "HIGH",
    observedAt: "2026-07-22T06:30:00Z",
    areaKm2: 15.9,
    topScore: 0.86,
    topVessel: "MT DESERT FALCON",
    candidates: 6,
  },
  {
    id: "OT-2026-0012",
    region: "Laccadive Sea",
    status: "MONITORING",
    priority: "MEDIUM",
    observedAt: "2026-07-14T15:22:00Z",
    areaKm2: 3.8,
    topScore: 0.58,
    topVessel: "MV MALABAR DAWN",
    candidates: 3,
  },
];

export const ACTIVE_CASES: CaseSummary[] = [
  CASE_HISTORY[0]!,
  {
    id: "OT-2026-0018",
    region: "Gulf of Khambhat",
    status: "ACTIVE",
    priority: "MEDIUM",
    observedAt: "2026-08-27T02:10:00Z",
    areaKm2: 4.3,
    topScore: 0.67,
    topVessel: "MV SABARMATI PRIDE",
    candidates: 4,
  },
  {
    id: "OT-2026-0019",
    region: "Palk Strait",
    status: "ACTIVE",
    priority: "LOW",
    observedAt: "2026-08-26T19:55:00Z",
    areaKm2: 1.6,
    topScore: 0.44,
    topVessel: "MV TAMBRAPARNI",
    candidates: 2,
  },
  {
    id: "OT-2026-0020",
    region: "Andaman Sea",
    status: "ACTIVE",
    priority: "HIGH",
    observedAt: "2026-08-26T08:31:00Z",
    areaKm2: 9.8,
    topScore: 0.81,
    topVessel: "MT NICOBAR ENVOY",
    candidates: 5,
  },
];

export const DATA_SOURCES = [
  { name: "Sentinel-1 C-band SAR", provider: "Copernicus / ESA", status: "ONLINE", latency: "42 min", records: "1.2 TB", cadence: "6 h revisit" },
  { name: "Terrestrial AIS Feed", provider: "Coastal Radio Network", status: "ONLINE", latency: "12 s", records: "12,847 msgs", cadence: "Realtime" },
  { name: "Satellite AIS (S-AIS)", provider: "Orbital AIS Consortium", status: "ONLINE", latency: "8 min", records: "3,204 msgs", cadence: "90 min" },
  { name: "HYCOM Ocean Currents", provider: "Global Ocean Model", status: "ONLINE", latency: "3 h", records: "1/12° grid", cadence: "3 h" },
  { name: "ECMWF Wind Fields", provider: "ERA5 / IFS", status: "DEGRADED", latency: "5 h", records: "0.25° grid", cadence: "6 h" },
  { name: "Vessel Registry (IHS)", provider: "Registry Mirror", status: "ONLINE", latency: "24 h", records: "118,402 hulls", cadence: "Daily" },
];

export const MODEL_METRICS = [
  { name: "U-Net SAR Segmentation", version: "v3.2.1", metric: "IoU", value: 0.82, secondary: "Dice 0.89", trained: "12 Aug 2026" },
  { name: "Slick / Look-alike Classifier", version: "v1.8.0", metric: "F1", value: 0.91, secondary: "Precision 0.93", trained: "04 Aug 2026" },
  { name: "Lagrangian Drift Engine", version: "v2.4.3", metric: "Skill Score", value: 0.76, secondary: "5k particles", trained: "27 Jul 2026" },
  { name: "AIS Trajectory Matcher", version: "v2.0.1", metric: "Top-1 Acc", value: 0.84, secondary: "Top-3 0.96", trained: "18 Aug 2026" },
  { name: "Attribution Ranker", version: "v1.5.2", metric: "nDCG@5", value: 0.88, secondary: "Calibrated", trained: "21 Aug 2026" },
];

export const PIPELINE_STEPS = [
  "Satellite data loaded",
  "SAR preprocessing complete",
  "Oil slick detected",
  "Spill geometry extracted",
  "Running hindcast simulation",
  "Correlating AIS trajectories",
  "Ranking candidate vessels",
];
