import { type Vec2, dist } from "../engine/math";
import type { Car } from "../entities/types";
import type { VehicleKind } from "../entities/vehicles";
import type { GameState } from "../game/state";
import { laneAt, worldToTile } from "../world/cityMap";
import { findLaneRoute, nearestLaneTile } from "../world/laneRoute";
import { findSpawnTile, spawnLaneCar } from "./spawnSystem";

/** Distanza entro cui si usa un mezzo libero già in strada invece di farne comparire uno */
const IDLE_RANGE = 900;
const SPAWN_TRIES = 6;

/** Manda un mezzo di servizio verso un punto: quello libero più vicino (a lampeggianti
 * spenti, `route === null`) o uno nuovo fuori dalla vista. Null se non c'è posto. */
export const dispatchVehicle = (s: GameState, kind: VehicleKind, near: Vec2): Car | null => {
  let best: Car | null = null;
  for (const c of s.cars) {
    const free =
      c.kind === kind && c.driver === "ai" && !c.dead && c.health > 0 && c.route === null;
    if (
      free &&
      dist(c.pos, near) < IDLE_RANGE &&
      (!best || dist(c.pos, near) < dist(best.pos, near))
    )
      best = c;
  }
  if (best) return best;
  for (let i = 0; i < SPAWN_TRIES; i++) {
    const tile = findSpawnTile(s, near, "lanes", 500, 800);
    if (tile && laneAt(s.map, tile.x, tile.y) !== 0) return spawnLaneCar(s, tile, false, kind);
  }
  return null;
};

/** Percorso sulle corsie fino alla corsia più vicina al punto (vuoto se irraggiungibile) */
export const routeToPoint = (s: GameState, car: Car, p: Vec2): void => {
  const goal = nearestLaneTile(s.map, worldToTile(p));
  const from = car.aiTarget ?? worldToTile(car.pos);
  car.route = (goal && findLaneRoute(s.map, from, car.laneDir, goal)) || [];
  // La mossa successiva era già stata scelta a caso: va ripianificata seguendo il percorso,
  // altrimenti il primo passo non è più adiacente e il percorso viene scartato
  car.aiNext = null;
};

/** Il mezzo ha finito il percorso entro `range` dal punto (o è già vicinissimo) */
export const arrivedAt = (car: Car, p: Vec2, near: number, range: number): boolean => {
  const d = dist(car.pos, p);
  return d < near || (car.route !== null && car.route.length === 0 && d < range);
};
