import type { Vec2 } from "../engine/math";
import { Dir, TILE, Tile } from "./tiles";

export const MAP_W = 64;
export const MAP_H = 64;

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Strade a due corsie: `at` è la prima riga/colonna, `from`-`to` l'estensione */
interface RoadDef {
  at: number;
  from: number;
  to: number;
}

// --- Layout della città (disegnato a mano) ---
const H_ROADS: RoadDef[] = [
  { at: 2, from: 2, to: 61 },
  { at: 13, from: 2, to: 61 },
  { at: 25, from: 2, to: 61 },
  { at: 37, from: 2, to: 61 },
  { at: 49, from: 2, to: 61 },
  { at: 60, from: 2, to: 61 },
  { at: 31, from: 15, to: 30 },
  { at: 55, from: 43, to: 61 },
];

const V_ROADS: RoadDef[] = [
  { at: 2, from: 2, to: 61 },
  { at: 15, from: 2, to: 61 },
  { at: 29, from: 2, to: 61 },
  { at: 43, from: 2, to: 61 },
  { at: 60, from: 2, to: 61 },
  { at: 52, from: 13, to: 26 },
  { at: 8, from: 37, to: 50 },
];

const PARKS: Rect[] = [
  { x: 31, y: 39, w: 12, h: 10 },
  { x: 3, y: 15, w: 12, h: 10 },
];

const LAKES: Rect[] = [{ x: 35, y: 42, w: 4, h: 3 }];

export const PHONE_BOOTHS: Vec2[] = [
  { x: 8, y: 4 },
  { x: 35, y: 27 },
  { x: 20, y: 51 },
  { x: 55, y: 39 },
];

/** Riga (in tile) su cui corre l'unico binario, da ovest a est attraverso tutta la città */
export const RAIL_ROW = 19;

/** Parcheggi ricavati negli isolati, tutti affacciati su un marciapiede (h = 1: stalli lungo il
 * marciapiede). Quelli coperti fanno da nascondiglio durante gli inseguimenti. */
export const PARKING_LOTS: (Rect & { covered: boolean })[] = [
  { x: 18, y: 5, w: 4, h: 3, covered: false },
  { x: 55, y: 5, w: 4, h: 3, covered: true },
  { x: 19, y: 52, w: 4, h: 3, covered: true },
  { x: 33, y: 5, w: 6, h: 1, covered: false },
  { x: 5, y: 28, w: 6, h: 1, covered: false },
];

/** Punti in tile */
export const PLAYER_START: Vec2 = { x: 5, y: 4 };
export const HOSPITAL: Vec2 = { x: 20, y: 27 };
export const POLICE_STATION: Vec2 = { x: 47, y: 4 };

/** Negozi: la porta è una tile di edificio affacciata sul marciapiede (`outside`) */
export type ShopKind = "guns" | "food" | "clothes" | "cars" | "hospital";
export const SHOPS: { kind: ShopKind; door: Vec2; outside: Vec2 }[] = [
  { kind: "guns", door: { x: 24, y: 5 }, outside: { x: 24, y: 4 } },
  { kind: "food", door: { x: 36, y: 35 }, outside: { x: 36, y: 36 } },
  { kind: "clothes", door: { x: 24, y: 16 }, outside: { x: 24, y: 15 } },
  { kind: "cars", door: { x: 50, y: 40 }, outside: { x: 50, y: 39 } },
  // Ospedale: si rinasce sul marciapiede davanti (HOSPITAL), dentro c'è il cuore
  { kind: "hospital", door: { x: 20, y: 28 }, outside: HOSPITAL },
];

/** Caserma della polizia: porta con insegna, non si entra; dopo l'arresto si ricompare davanti */
export const POLICE_DOOR: Vec2 = { x: 47, y: 5 };

/** Garage di verniciatura (2×2): si entra con l'auto per cambiarle colore */
export const SPRAY_SHOPS: Rect[] = [
  { x: 46, y: 16, w: 2, h: 2 },
  { x: 11, y: 40, w: 2, h: 2 },
];

export interface CityMap {
  tiles: Uint8Array;
  lanes: Uint8Array;
}

const idx = (x: number, y: number): number => y * MAP_W + x;

const fill = (tiles: Uint8Array, r: Rect, t: Tile): void => {
  for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) tiles[idx(x, y)] = t;
};

export const buildCity = (): CityMap => {
  const tiles = new Uint8Array(MAP_W * MAP_H).fill(Tile.Building);
  const lanes = new Uint8Array(MAP_W * MAP_H);
  fill(tiles, { x: 0, y: 0, w: MAP_W, h: 1 }, Tile.Water);
  fill(tiles, { x: 0, y: MAP_H - 1, w: MAP_W, h: 1 }, Tile.Water);
  fill(tiles, { x: 0, y: 0, w: 1, h: MAP_H }, Tile.Water);
  fill(tiles, { x: MAP_W - 1, y: 0, w: 1, h: MAP_H }, Tile.Water);
  for (const p of PARKS) fill(tiles, p, Tile.Grass);

  // Traffico a destra: la corsia superiore va a ovest, quella sinistra va a sud
  for (const r of H_ROADS) {
    for (let x = r.from; x <= r.to; x++) {
      tiles[idx(x, r.at)] = Tile.Road;
      tiles[idx(x, r.at + 1)] = Tile.Road;
      lanes[idx(x, r.at)] |= Dir.W;
      lanes[idx(x, r.at + 1)] |= Dir.E;
    }
  }
  for (const r of V_ROADS) {
    for (let y = r.from; y <= r.to; y++) {
      tiles[idx(r.at, y)] = Tile.Road;
      tiles[idx(r.at + 1, y)] = Tile.Road;
      lanes[idx(r.at, y)] |= Dir.S;
      lanes[idx(r.at + 1, y)] |= Dir.N;
    }
  }

  // Marciapiedi attorno alle strade
  for (let y = 1; y < MAP_H - 1; y++) {
    for (let x = 1; x < MAP_W - 1; x++) {
      if (tiles[idx(x, y)] === Tile.Road) continue;
      let nearRoad = false;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
          if (tiles[idx(x + dx, y + dy)] === Tile.Road) nearRoad = true;
      if (nearRoad) tiles[idx(x, y)] = Tile.Sidewalk;
    }
  }

  for (const l of LAKES) fill(tiles, l, Tile.Water);
  // Binario in superficie: attraversa isolati e parco; dove incrocia una strada resta strada
  // (passaggio a livello)
  for (let x = 1; x < MAP_W - 1; x++)
    if (tiles[idx(x, RAIL_ROW)] !== Tile.Road) tiles[idx(x, RAIL_ROW)] = Tile.Rail;
  for (const p of PHONE_BOOTHS) tiles[idx(p.x, p.y)] = Tile.Phone;
  for (const sh of SHOPS) tiles[idx(sh.door.x, sh.door.y)] = Tile.Door;
  tiles[idx(POLICE_DOOR.x, POLICE_DOOR.y)] = Tile.Door;
  for (const g of SPRAY_SHOPS) fill(tiles, g, Tile.SprayShop);
  for (const p of PARKING_LOTS) fill(tiles, p, p.covered ? Tile.ParkingCovered : Tile.Parking);
  return { tiles, lanes };
};

export const tileAt = (map: CityMap, tx: number, ty: number): Tile =>
  tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H ? Tile.Water : (map.tiles[idx(tx, ty)] as Tile);

export const laneAt = (map: CityMap, tx: number, ty: number): number =>
  tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H ? 0 : map.lanes[idx(tx, ty)];

export const tileAtWorld = (map: CityMap, p: Vec2): Tile =>
  tileAt(map, Math.floor(p.x / TILE), Math.floor(p.y / TILE));

export const tileCenter = (t: Vec2): Vec2 => ({ x: (t.x + 0.5) * TILE, y: (t.y + 0.5) * TILE });

export const worldToTile = (p: Vec2): Vec2 => ({
  x: Math.floor(p.x / TILE),
  y: Math.floor(p.y / TILE),
});

/** Tutte le tile di un certo tipo (utile per gli spawn) */
export const tilesOfType = (map: CityMap, t: Tile): Vec2[] => {
  const out: Vec2[] = [];
  for (let y = 0; y < MAP_H; y++)
    for (let x = 0; x < MAP_W; x++) if (map.tiles[idx(x, y)] === t) out.push({ x, y });
  return out;
};
