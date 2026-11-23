import { type CityMap, tileAt } from "../world/cityMap";
import { TILE, type Tile } from "../world/tiles";
import type { Vec2 } from "./math";

export const CAR_LEN = 28;
export const CAR_WID = 14;
export const CAR_RADIUS = 11;
export const PED_RADIUS = 5;

/** Verifica se un cerchio interseca una tile bloccante */
export const circleBlocked = (
  map: CityMap,
  p: Vec2,
  r: number,
  blocks: (t: Tile) => boolean,
): boolean => {
  const x0 = Math.floor((p.x - r) / TILE);
  const x1 = Math.floor((p.x + r) / TILE);
  const y0 = Math.floor((p.y - r) / TILE);
  const y1 = Math.floor((p.y + r) / TILE);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (!blocks(tileAt(map, tx, ty))) continue;
      const cx = Math.max(tx * TILE, Math.min(p.x, (tx + 1) * TILE));
      const cy = Math.max(ty * TILE, Math.min(p.y, (ty + 1) * TILE));
      if ((p.x - cx) ** 2 + (p.y - cy) ** 2 < r * r) return true;
    }
  }
  return false;
};

/** Muove un cerchio separando gli assi, così scivola lungo i muri */
export const moveCircle = (
  map: CityMap,
  p: Vec2,
  dx: number,
  dy: number,
  r: number,
  blocks: (t: Tile) => boolean,
): void => {
  if (!circleBlocked(map, { x: p.x + dx, y: p.y }, r, blocks)) p.x += dx;
  if (!circleBlocked(map, { x: p.x, y: p.y + dy }, r, blocks)) p.y += dy;
};

/** Punti di campionamento del perimetro dell'auto (angoli + metà lati lunghi) */
export const carSamplePoints = (pos: Vec2, angle: number): Vec2[] => {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const hl = CAR_LEN / 2;
  const hw = CAR_WID / 2;
  const local: [number, number][] = [
    [hl, hw],
    [hl, -hw],
    [-hl, hw],
    [-hl, -hw],
    [0, hw],
    [0, -hw],
    [hl, 0],
    [-hl, 0],
  ];
  return local.map(([lx, ly]) => ({ x: pos.x + lx * c - ly * s, y: pos.y + lx * s + ly * c }));
};

export const carHitsWall = (
  map: CityMap,
  pos: Vec2,
  angle: number,
  blocks: (t: Tile) => boolean,
): boolean =>
  carSamplePoints(pos, angle).some((p) =>
    blocks(tileAt(map, Math.floor(p.x / TILE), Math.floor(p.y / TILE))),
  );
