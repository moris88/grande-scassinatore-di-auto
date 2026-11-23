import type { Vec2 } from "../engine/math";
import { type CityMap, MAP_H, MAP_W, laneAt } from "./cityMap";
import { ALL_DIRS, Dir, dirVector } from "./tiles";

/** Durata di una fase verde (gli ultimi secondi sono gialli) */
export const LIGHT_PHASE = 5;
const YELLOW = 1.2;

export type LightColor = "green" | "yellow" | "red";

/** Tile prima di un incrocio, dove le auto si fermano col rosso */
export interface StopLine {
  tile: Vec2;
  dir: Dir;
}

const isIntersection = (map: CityMap, x: number, y: number): boolean => {
  const l = laneAt(map, x, y);
  return l !== 0 && !ALL_DIRS.includes(l);
};

export const isIntersectionTile = (map: CityMap, t: Vec2): boolean => isIntersection(map, t.x, t.y);

const cache = new WeakMap<CityMap, StopLine[]>();

export const stopLines = (map: CityMap): StopLine[] => {
  const hit = cache.get(map);
  if (hit) return hit;
  const out: StopLine[] = [];
  for (let y = 0; y < MAP_H; y++)
    for (let x = 0; x < MAP_W; x++) {
      const dir = laneAt(map, x, y);
      if (!ALL_DIRS.includes(dir)) continue;
      const v = dirVector(dir);
      if (isIntersection(map, x + v.x, y + v.y)) out.push({ tile: { x, y }, dir });
    }
  cache.set(map, out);
  return out;
};

/** Colore del semaforo per chi viaggia nella direzione indicata */
export const lightFor = (dir: Dir, time: number): LightColor => {
  const phase = Math.floor(time / LIGHT_PHASE) % 2;
  const horizontal = dir === Dir.E || dir === Dir.W;
  if (horizontal !== (phase === 0)) return "red";
  return time % LIGHT_PHASE > LIGHT_PHASE - YELLOW ? "yellow" : "green";
};
