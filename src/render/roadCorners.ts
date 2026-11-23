import { type CityMap, MAP_H, MAP_W, laneAt } from "../world/cityMap";
import { TILE } from "../world/tiles";
import { isJunctionTile } from "../world/trafficLights";

const ASPHALT = "#3a3a3e";
const SIDEWALK = "#9c9a94";
const CURB = "#c9c6bd";
const MEDIAN = "#e8d44d";

/** Blocchi 2×2 di curva (non incroci): le strade escono solo da due lati perpendicolari.
 * Ritorna l'angolo del blocco da cui partono le strade (centro della curva), in tile. */
export const cornerBlocks = (
  map: CityMap,
): { bx: number; by: number; cx: number; cy: number }[] => {
  const out: { bx: number; by: number; cx: number; cy: number }[] = [];
  const junction = (x: number, y: number) => isJunctionTile(map, { x, y });
  const road = (x: number, y: number) => laneAt(map, x, y) !== 0;
  for (let by = 0; by < MAP_H; by++)
    for (let bx = 0; bx < MAP_W; bx++) {
      if (!junction(bx, by) || junction(bx - 1, by) || junction(bx, by - 1)) continue;
      const n = road(bx, by - 1);
      const s = road(bx, by + 2);
      const w = road(bx - 1, by);
      const e = road(bx + 2, by);
      if ([n, s, w, e].filter(Boolean).length !== 2 || n === s) continue;
      out.push({ bx, by, cx: e ? bx + 2 : bx, cy: s ? by + 2 : by });
    }
  return out;
};

/** Curve vere agli angoli: marciapiede arrotondato col cordolo e mezzeria che curva */
export const drawRoadCorners = (g: CanvasRenderingContext2D, map: CityMap): void => {
  for (const { bx, by, cx, cy } of cornerBlocks(map)) {
    const x = bx * TILE;
    const y = by * TILE;
    const size = TILE * 2;
    const ox = cx * TILE;
    const oy = cy * TILE;
    g.save();
    g.beginPath();
    g.rect(x, y, size, size);
    g.clip();
    g.fillStyle = SIDEWALK;
    g.fillRect(x, y, size, size);
    g.fillStyle = ASPHALT;
    g.beginPath();
    g.arc(ox, oy, size, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = CURB;
    g.lineWidth = 3;
    g.beginPath();
    g.arc(ox, oy, size + 1, 0, Math.PI * 2);
    g.stroke();
    g.strokeStyle = MEDIAN;
    g.lineWidth = 1;
    g.setLineDash([9, 7]);
    g.beginPath();
    g.arc(ox, oy, TILE, 0, Math.PI * 2);
    g.stroke();
    g.restore();
  }
};
