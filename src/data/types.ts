// Domain model for OceanTrace. Mock data implements these interfaces today;
// a FastAPI backend can return the same shapes later with zero UI changes.

export type LngLat = [number, number];

export interface SatelliteObservation {
  id: string;
  platform: string;
  sensor: string;
  mode: string;
  capturedAt: string; // ISO
  resolutionM: number;
  incidenceAngleDeg: number;
  sceneId: string;
}

export interface SpillGeometry {
  areaKm2: number;
  perimeterKm: number;
  majorAxisKm: number;
  minorAxisKm: number;
  orientationDeg: number;
  centroid: { lat: number; lon: number };
  fragmentationIndex: number;
  polygon: LngLat[];
}

export interface Spill {
  geometry: SpillGeometry;
  detectionConfidence: number; // 0..1
  model: { name: string; iou: number; dice: number; version: string };
  releaseWindowHours: [number, number];
  releaseWindowConfidence: "LOW" | "MEDIUM" | "HIGH";
}

export interface EnvironmentalConditions {
  currentSpeedMs: number;
  currentDirection: string;
  currentBearingDeg: number;
  windSpeedKmh: number;
  windDirection: string;
  windBearingDeg: number;
  waveHeightM: number;
  seaTempC: number;
  simulationWindowHours: number;
}

export interface DriftSimulation {
  model: string;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  particles: number;
  hindcastPaths: LngLat[][];
  forecastPaths: LngLat[][];
  originRegion: LngLat[];
  forecastRegions: { hour: number; polygon: LngLat[] }[];
}

export interface AISPoint {
  t: string; // ISO
  lon: number;
  lat: number;
  sog: number; // speed over ground, knots
  cog: number; // course over ground, deg
  gap?: boolean;
}

export interface Vessel {
  id: string;
  name: string;
  mmsi: string;
  imo: string;
  type: string;
  flag: string;
  lengthM: number;
  dwt: number;
  operator: string;
  destination: string;
  lastPosition: { lat: number; lon: number };
  speedKn: number;
  courseDeg: number;
  track: AISPoint[];
}

export interface EvidenceFactor {
  key: string;
  label: string;
  score: number; // 0..1
  weight: number;
  detail: string;
}

export interface AttributionScore {
  vesselId: string;
  rank: number;
  overall: number; // 0..1
  factors: EvidenceFactor[];
  findings: { kind: "match" | "warn"; text: string }[];
  assessment: string;
  aisGapMinutes: number;
}

export interface TimelineEvent {
  id: string;
  time: string;
  label: string;
  detail: string;
  focus?: "spill" | "origin" | "forecast" | "ais" | "vessel";
  vesselId?: string;
}

export interface Case {
  id: string;
  region: string;
  status: "ACTIVE" | "RESOLVED" | "MONITORING";
  priority: "HIGH" | "MEDIUM" | "LOW";
  observedAt: string;
  observation: SatelliteObservation;
  spill: Spill;
  environmental: EnvironmentalConditions;
  drift: DriftSimulation;
  candidates: { vessel: Vessel; attribution: AttributionScore }[];
  vesselsAnalyzed: number;
  timeline: TimelineEvent[];
  funnel: { label: string; value: number }[];
}

export type LayerKey =
  | "satellite"
  | "detection"
  | "geometry"
  | "hindcast"
  | "origin"
  | "forecast"
  | "ais"
  | "candidates";
