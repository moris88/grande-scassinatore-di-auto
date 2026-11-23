import type { Vec2 } from "../engine/math";
import { type CityMap, MAP_H, MAP_W, laneAt } from "./cityMap";
import { ALL_DIRS, type Dir, dirVector, oppositeDir } from "./tiles";

/** Tile di corsia più vicina a un punto (in tile), cercando a spirale fino a `radius` */
export const nearestLaneTile = (map: CityMap, t: Vec2, radius = 4): Vec2 | null => {
  let best: Vec2 | null = null;
  let bestD = Number.POSITIVE_INFINITY;
  for (let dy = -radius; dy <= radius; dy++)
    for (let dx = -radius; dx <= radius; dx++) {
      if (laneAt(map, t.x + dx, t.y + dy) === 0) continue;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = { x: t.x + dx, y: t.y + dy };
      }
    }
  return best;
};

/**
 * Percorso più breve sulle corsie (rispettando i sensi di marcia, senza inversioni a U)
 * da `from` (raggiunta viaggiando in direzione `dir`) fino a `goal`.
 * Ritorna le tile successive a `from`, goal compreso; null se irraggiungibile.
 */
export const findLaneRoute = (map: CityMap, from: Vec2, dir: Dir, goal: Vec2): Vec2[] | null => {
  const key = (x: number, y: number, d: Dir): number => ((y * MAP_W + x) << 4) | d;
  const prev = new Map<number, number>();
  const start = key(from.x, from.y, dir);
  prev.set(start, -1);
  const queue: [number, number, Dir][] = [[from.x, from.y, dir]];
  for (let head = 0; head < queue.length; head++) {
    const [x, y, d] = queue[head];
    if (x === goal.x && y === goal.y && head > 0) {
      const path: Vec2[] = [];
      for (let k = key(x, y, d); k !== start; k = prev.get(k) ?? start) {
        const cell = k >> 4;
        path.push({ x: cell % MAP_W, y: Math.floor(cell / MAP_W) });
      }
      return path.reverse();
    }
    const lanes = laneAt(map, x, y);
    for (const nd of ALL_DIRS) {
      if (!(lanes & nd) || nd === oppositeDir(d)) continue;
      const v = dirVector(nd);
      const nx = x + v.x;
      const ny = y + v.y;
      if (nx < 0 || ny < 0 || nx >= MAP_W || ny >= MAP_H) continue;
      const nl = laneAt(map, nx, ny);
      if (nl === 0 || nl === oppositeDir(nd)) continue;
      const k = key(nx, ny, nd);
      if (prev.has(k)) continue;
      prev.set(k, key(x, y, d));
      queue.push([nx, ny, nd]);
    }
  }
  return null;
};
