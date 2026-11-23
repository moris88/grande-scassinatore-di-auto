import type { Vec2 } from "../engine/math";
import { POLICE_DOOR, POLICE_STATION, SHOPS, type ShopKind } from "../world/cityMap";

export interface Entrance {
  door: Vec2;
  /** Tile di marciapiede davanti alla porta (da dove si entra) */
  outside: Vec2;
  label: string;
  /** Colore della tenda, del tappetino e del fondo dell'insegna */
  color: string;
}

const LOOK: Record<ShopKind, { label: string; color: string }> = {
  guns: { label: "ARMI", color: "#8e2b2b" },
  food: { label: "ALIMENTARI", color: "#2e7d32" },
  clothes: { label: "VESTITI", color: "#c2185b" },
  cars: { label: "AUTO", color: "#1f5fa8" },
  hospital: { label: "OSPEDALE", color: "#c0392b" },
};

/** Tutti gli ingressi con insegna: negozi, ospedale e caserma */
export const ENTRANCES: Entrance[] = [
  ...SHOPS.map((sh) => ({ door: sh.door, outside: sh.outside, ...LOOK[sh.kind] })),
  { door: POLICE_DOOR, outside: POLICE_STATION, label: "POLIZIA", color: "#1b3a8a" },
];
