import type { LngLat } from "@/data/types";

export const MAP_W = 1200;
export const MAP_H = 800;
export const BOUNDS = { lon0: 72.48, lat1: 19.79, span: 0.64 };

export function project(lon: number, lat: number): [number, number] {
  return [
    ((lon - BOUNDS.lon0) / BOUNDS.span) * MAP_W,
    ((BOUNDS.lat1 - lat) / BOUNDS.span) * MAP_H,
  ];
}

export function toPoints(coords: LngLat[]): string {
  return coords.map((c) => project(c[0], c[1]).join(",")).join(" ");
}

export function toPath(coords: LngLat[]): string {
  return coords
    .map((c, i) => `${i === 0 ? "M" : "L"}${project(c[0], c[1]).join(" ")}`)
    .join(" ");
}
