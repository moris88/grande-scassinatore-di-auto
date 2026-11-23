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

/** Tile con più corsie: incrocio oppure curva */
const isJunction = (map: CityMap, x: number, y: number): boolean => {
  const l = laneAt(map, x, y);
  return l !== 0 && !ALL_DIRS.includes(l);
};

/** Incrocio vero (con semaforo): il blocco 2×2 ha strade in uscita su almeno 3 lati.
 * Le curve a 90° (2 lati) non hanno semaforo. */
const isIntersection = (map: CityMap, x: number, y: number): boolean => {
  if (!isJunction(map, x, y)) return false;
  const bx = isJunction(map, x - 1, y) ? x - 1 : x;
  const by = isJunction(map, x, y - 1) ? y - 1 : y;
  const road = (tx: number, ty: number): boolean => laneAt(map, tx, ty) !== 0;
  const sides = [road(bx, by - 1), road(bx, by + 2), road(bx - 1, by), road(bx + 2, by)];
  return sides.filter(Boolean).length >= 3;
};

export const isIntersectionTile = (map: CityMap, t: Vec2): boolean => isIntersection(map, t.x, t.y);

export const isJunctionTile = (map: CityMap, t: Vec2): boolean => isJunction(map, t.x, t.y);

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
