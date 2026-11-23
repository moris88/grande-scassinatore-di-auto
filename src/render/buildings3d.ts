import type { Vec2 } from "../engine/math";
import type { GameState } from "../game/state";
import { tileAt } from "../world/cityMap";
import { TILE, Tile } from "../world/tiles";
import { hash } from "./mapRenderer";

/** "Altezza" virtuale della camera: più è bassa, più i palazzi si inclinano */
const CAMERA_HEIGHT = 520;
/** Altezze dei palazzi (px), scelte per isolato */
const HEIGHTS = [26, 44, 64];
/** Tile visibili in più ai bordi: i palazzi fuori schermo si inclinano dentro */
const MARGIN = 3;
const FLOOR_HEIGHT = 20;

/** Ombreggiatura delle pareti secondo il lato (luce da nord-ovest) */
const WALL_SHADE: Record<string, string> = {
  n: "rgba(255,255,255,0.10)",
  w: "rgba(255,255,255,0.04)",
  s: "rgba(0,0,0,0.35)",
  e: "rgba(0,0,0,0.25)",
};

const heightAt = (tx: number, ty: number): number =>
  HEIGHTS[Math.floor(hash(Math.floor(tx / 7), Math.floor(ty / 6), 11) * HEIGHTS.length)];

const isBuilding = (s: GameState, tx: number, ty: number): boolean =>
  tileAt(s.map, tx, ty) === Tile.Building;

/** Punto del tetto: il vertice alla base "sollevato" verso la camera (prospettiva dall'alto) */
const lift = (p: Vec2, cam: Vec2, h: number): Vec2 => {
  const k = h / CAMERA_HEIGHT;
  return { x: p.x + (p.x - cam.x) * k, y: p.y + (p.y - cam.y) * k };
};

const quad = (g: CanvasRenderingContext2D, pts: Vec2[], fill: string): void => {
  g.beginPath();
  g.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
  g.closePath();
  g.fillStyle = fill;
  g.fill();
};

const lerp = (a: Vec2, b: Vec2, t: number): Vec2 => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

/** Una fila di finestre per piano (due per tile), qualcuna con la luce accesa */
const drawWindows = (
  g: CanvasRenderingContext2D,
  a: Vec2,
  b: Vec2,
  ra: Vec2,
  rb: Vec2,
  h: number,
  seed: number,
): void => {
  const floors = Math.max(1, Math.round(h / FLOOR_HEIGHT));
  for (let f = 0; f < floors; f++) {
    const t0 = (f + 0.3) / floors;
    const t1 = (f + 0.7) / floors;
    for (const [u0, u1] of [
      [0.15, 0.4],
      [0.6, 0.85],
    ]) {
      // Angoli della finestra: lungo il lato (u) e in altezza (t)
      const p = (u: number, t: number) => lerp(lerp(a, b, u), lerp(ra, rb, u), t);
      const lit = hash(seed, f, u0 * 10) < 0.25;
      quad(g, [p(u0, t0), p(u1, t0), p(u1, t1), p(u0, t1)], lit ? "#f6d77a" : "#2c3e50");
    }
  }
};

/** Palazzi in pseudo-3D:pareti dalla base al tetto e tetto sollevato verso la camera.
 * Disegnati sopra veicoli e pedoni (che ci passano dietro), dai più bassi ai più alti. */
export const drawBuildings3D = (
  g: CanvasRenderingContext2D,
  s: GameState,
  mapCanvas: HTMLCanvasElement,
  view: { x: number; y: number; w: number; h: number },
): void => {
  const cam = s.camera.pos;
  const tx0 = Math.floor(view.x / TILE) - MARGIN;
  const ty0 = Math.floor(view.y / TILE) - MARGIN;
  const tx1 = Math.ceil((view.x + view.w) / TILE) + MARGIN;
  const ty1 = Math.ceil((view.y + view.h) / TILE) + MARGIN;
  const tiles: { tx: number; ty: number; h: number }[] = [];
  for (let ty = ty0; ty <= ty1; ty++)
    for (let tx = tx0; tx <= tx1; tx++)
      if (isBuilding(s, tx, ty)) tiles.push({ tx, ty, h: heightAt(tx, ty) });
  tiles.sort((a, b) => a.h - b.h);

  for (const { tx, ty, h } of tiles) {
    const x0 = tx * TILE;
    const y0 = ty * TILE;
    const c = [
      { x: x0, y: y0 },
      { x: x0 + TILE, y: y0 },
      { x: x0 + TILE, y: y0 + TILE },
      { x: x0, y: y0 + TILE },
    ];
    const r = c.map((p) => lift(p, cam, h));
    // Pareti solo dove il vicino è più basso (o non è un palazzo)
    const lower = (dx: number, dy: number): boolean =>
      !isBuilding(s, tx + dx, ty + dy) || heightAt(tx + dx, ty + dy) < h;
    const sides: [string, number, number, number, number][] = [
      ["n", 0, -1, 0, 1],
      ["e", 1, 0, 1, 2],
      ["s", 0, 1, 2, 3],
      ["w", -1, 0, 3, 0],
    ];
    for (const [side, dx, dy, a, b] of sides) {
      if (!lower(dx, dy)) continue;
      quad(g, [c[a], c[b], r[b], r[a]], "#4a4038");
      drawWindows(g, c[a], c[b], r[a], r[b], h, tx + ty);
      quad(g, [c[a], c[b], r[b], r[a]], WALL_SHADE[side]);
    }
    // Tetto: la tile del tetto già disegnata sulla mappa, ingrandita e spostata
    g.drawImage(mapCanvas, x0, y0, TILE, TILE, r[0].x, r[0].y, r[2].x - r[0].x, r[2].y - r[0].y);
  }
};
