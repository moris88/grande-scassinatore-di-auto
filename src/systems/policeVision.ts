import { type Vec2, dist } from "../engine/math";
import type { GameState } from "../game/state";
import { type CityMap, tileAtWorld } from "../world/cityMap";
import { Tile } from "../world/tiles";

/** Raggio visivo di una volante e di un agente a piedi */
const CAR_SIGHT = 320;
const COP_SIGHT = 240;
/** Da nascosto ti vedono solo se sono praticamente addosso */
const HIDDEN_SIGHT = 48;

/** Nessun edificio tra i due punti (campionamento ogni 8 px) */
export const lineOfSight = (map: CityMap, a: Vec2, b: Vec2): boolean => {
  const d = dist(a, b);
  const steps = Math.ceil(d / 8);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    if (tileAtWorld(map, p) === Tile.Building) return false;
  }
  return true;
};

/** Posizione del giocatore (a piedi o in auto) */
export const playerPos = (s: GameState): Vec2 => (s.player.car ? s.player.car.pos : s.player.pos);

/** Nascondigli: parcheggi coperti e carrozzeria */
export const playerHidden = (s: GameState): boolean => {
  const t = tileAtWorld(s.map, playerPos(s));
  return t === Tile.ParkingCovered || t === Tile.SprayShop;
};

const sees = (s: GameState, from: Vec2, range: number): boolean => {
  const p = playerPos(s);
  const d = dist(from, p);
  if (d > (playerHidden(s) ? HIDDEN_SIGHT : range)) return false;
  return lineOfSight(s.map, from, p);
};

/** Almeno un poliziotto (in volante o a piedi) vede il giocatore */
export const policeSeesPlayer = (s: GameState): boolean =>
  s.cars.some((c) => c.police && c.driver === "ai" && !c.dead && sees(s, c.pos, CAR_SIGHT)) ||
  s.peds.some((p) => p.role === "cop" && p.state !== "dead" && sees(s, p.pos, COP_SIGHT));
