import type { Vec2 } from "../engine/math";
import { type GameState, stars } from "../game/state";
import { type CityMap, MAP_H, MAP_W, PHONE_BOOTHS, tileAt, tileCenter } from "../world/cityMap";
import { TILE, Tile } from "../world/tiles";

const SCALE = 2;
const MARGIN = 16;

const COLORS: Record<Tile, string> = {
  [Tile.Building]: "#3b3530",
  [Tile.Road]: "#8a8a8a",
  [Tile.Sidewalk]: "#5a5a5a",
  [Tile.Grass]: "#2f6a2b",
  [Tile.Water]: "#1f3f66",
  [Tile.Phone]: "#ffe600",
  [Tile.SprayShop]: "#e1b12c",
};

const cache = new WeakMap<CityMap, HTMLCanvasElement>();

const background = (map: CityMap): HTMLCanvasElement => {
  const hit = cache.get(map);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = MAP_W * SCALE;
  c.height = MAP_H * SCALE;
  const g = c.getContext("2d");
  if (!g) throw new Error("Canvas 2D non disponibile");
  for (let y = 0; y < MAP_H; y++)
    for (let x = 0; x < MAP_W; x++) {
      g.fillStyle = COLORS[tileAt(map, x, y)];
      g.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
    }
  cache.set(map, c);
  return c;
};

/** Minimappa in basso a sinistra, in coordinate schermo */
export const drawMinimap = (g: CanvasRenderingContext2D, s: GameState): void => {
  const bg = background(s.map);
  const ox = MARGIN;
  const oy = g.canvas.height - MARGIN - bg.height;
  g.globalAlpha = 0.85;
  g.fillStyle = "#000";
  g.fillRect(ox - 3, oy - 3, bg.width + 6, bg.height + 6);
  g.drawImage(bg, ox, oy);
  g.globalAlpha = 1;

  const dot = (p: Vec2, color: string, size: number): void => {
    g.fillStyle = color;
    g.fillRect(
      Math.round(ox + (p.x / TILE) * SCALE - size / 2),
      Math.round(oy + (p.y / TILE) * SCALE - size / 2),
      size,
      size,
    );
  };
  const blink = Math.floor(s.time * 4) % 2 === 0;
  if (!s.mission && blink) for (const b of PHONE_BOOTHS) dot(tileCenter(b), "#ffe600", 5);
  for (const c of s.cars)
    if (c.police && !c.dead) dot(c.pos, stars(s) > 0 && blink ? "#ff3030" : "#3a7bff", 3);
  if (s.mission && blink) dot(s.mission.target, "#ffe600", 6);
  const pl = s.player;
  dot(pl.car ? pl.car.pos : pl.pos, "#ffffff", 4);
};
