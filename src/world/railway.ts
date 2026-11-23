import type { Vec2 } from "../engine/math";
import { type CityMap, MAP_W, RAIL_ROW, tileAt } from "./cityMap";
import { TILE, Tile } from "./tiles";

export { RAIL_ROW };
/** Centro del binario in pixel (asse y) */
export const RAIL_Y = (RAIL_ROW + 0.5) * TILE;

/** Passaggio a livello: tile di strada attraversata dal binario */
export const isRailCrossing = (map: CityMap, t: Vec2): boolean =>
  t.y === RAIL_ROW && tileAt(map, t.x, t.y) === Tile.Road;

/** Colonne (in tile) dei passaggi a livello, calcolate una volta */
const cache = new WeakMap<CityMap, number[]>();
export const crossingColumns = (map: CityMap): number[] => {
  const hit = cache.get(map);
  if (hit) return hit;
  const out: number[] = [];
  for (let x = 0; x < MAP_W; x++) if (tileAt(map, x, RAIL_ROW) === Tile.Road) out.push(x);
  cache.set(map, out);
  return out;
};
