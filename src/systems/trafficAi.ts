import { type Vec2, angleTo, clamp, dist, wrapAngle } from "../engine/math";
import type { CarControls } from "../entities/car";
import { forwardSpeed } from "../entities/car";
import type { Car } from "../entities/types";
import type { GameState } from "../game/state";
import { type CityMap, laneAt, tileCenter, worldToTile } from "../world/cityMap";
import { ALL_DIRS, type Dir, dirVector, oppositeDir } from "../world/tiles";
import { isIntersectionTile, lightFor } from "../world/trafficLights";

const CRUISE = 95;
const TURN_CRUISE = 50;

/** Sceglie la prossima tile seguendo le corsie, con preferenza ad andare dritto */
export const chooseNext = (map: CityMap, tile: Vec2, dir: Dir): { dir: Dir; tile: Vec2 } | null => {
  const lanes = laneAt(map, tile.x, tile.y);
  const options = ALL_DIRS.filter((d) => lanes & d && d !== oppositeDir(dir));
  if (options.includes(dir) && Math.random() < 0.65) options.unshift(dir);
  else options.sort(() => Math.random() - 0.5);
  const valid = (d: Dir): Vec2 | null => {
    const v = dirVector(d);
    const next = { x: tile.x + v.x, y: tile.y + v.y };
    const nl = laneAt(map, next.x, next.y);
    return nl !== 0 && nl !== oppositeDir(d) ? next : null;
  };
  for (const d of options) {
    const next = valid(d);
    if (next) return { dir: d, tile: next };
  }
  // Nessuna opzione valida: qualsiasi corsia adiacente
  for (const d of ALL_DIRS) {
    const next = valid(d);
    if (next) return { dir: d, tile: next };
  }
  return null;
};

/** Un punto è nel "corridoio" davanti all'auto (coordinate locali) */
const inFront = (car: Car, p: Vec2, halfWidth: number): boolean => {
  const dx = p.x - car.pos.x;
  const dy = p.y - car.pos.y;
  const fwd = dx * Math.cos(car.angle) + dy * Math.sin(car.angle);
  const lat = -dx * Math.sin(car.angle) + dy * Math.cos(car.angle);
  return fwd > 8 && fwd < 34 && Math.abs(lat) < halfWidth;
};

/** Ostacolo davanti all'auto (auto, pedoni in strada o giocatore) */
const blockedAhead = (car: Car, s: GameState): boolean => {
  if (s.cars.some((c) => c !== car && !c.dead && inFront(car, c.pos, 12))) return true;
  if (s.peds.some((p) => p.state !== "dead" && inFront(car, p.pos, 8))) return true;
  return !s.player.car && inFront(car, s.player.pos, 8);
};

/** Tile di corsia più vicina entro 2 tile (per rientrare in strada) */
const nearestLane = (map: CityMap, here: Vec2): Vec2 | null => {
  let best: Vec2 | null = null;
  for (let dy = -2; dy <= 2; dy++)
    for (let dx = -2; dx <= 2; dx++) {
      const t = { x: here.x + dx, y: here.y + dy };
      if (laneAt(map, t.x, t.y) === 0) continue;
      if (
        !best ||
        Math.abs(dx) + Math.abs(dy) < Math.abs(best.x - here.x) + Math.abs(best.y - here.y)
      )
        best = t;
    }
  return best;
};

/** Sterzata e acceleratore verso un punto */
export const steerTowards = (car: Car, target: Vec2, cruise: number): CarControls => {
  const diff = wrapAngle(angleTo(car.pos, target) - car.angle);
  const want = Math.abs(diff) > 0.5 ? Math.min(cruise, TURN_CRUISE) : cruise;
  const vf = forwardSpeed(car);
  return {
    steer: clamp(diff * 2.5, -1, 1),
    throttle: vf < want ? 1 : vf > want + 20 ? -0.5 : 0,
    handbrake: false,
  };
};

export const trafficControls = (car: Car, s: GameState): CarControls => {
  const here = worldToTile(car.pos);
  if (!car.aiTarget || dist(car.pos, tileCenter(car.aiTarget)) > 96) {
    const lane = laneAt(s.map, here.x, here.y) !== 0 ? here : nearestLane(s.map, here);
    if (!lane) return { steer: 0, throttle: 0, handbrake: true };
    const next = chooseNext(s.map, lane, car.laneDir);
    car.laneDir = next ? next.dir : car.laneDir;
    car.aiTarget = next && lane === here ? next.tile : lane;
  }
  // Bersaglio raggiunto o superato lungo la direzione di marcia
  const tc = tileCenter(car.aiTarget);
  const dv = dirVector(car.laneDir);
  const passed = (car.pos.x - tc.x) * dv.x + (car.pos.y - tc.y) * dv.y > -6;
  if (dist(car.pos, tc) < 18 || (passed && dist(car.pos, tc) < 40)) {
    const next = chooseNext(s.map, car.aiTarget, car.laneDir);
    if (next) {
      car.laneDir = next.dir;
      car.aiTarget = next.tile;
    }
  }
  // Semaforo: col rosso o col giallo ci si ferma prima dell'incrocio
  const inCrossing = isIntersectionTile(s.map, here);
  if (
    !inCrossing &&
    isIntersectionTile(s.map, car.aiTarget) &&
    lightFor(car.laneDir, s.time) !== "green"
  ) {
    car.stuckTime = 0;
    return { steer: 0, throttle: forwardSpeed(car) > 5 ? -1 : 0, handbrake: false };
  }

  // Pazienza: dopo un'attesa lunga riparte comunque per 1 secondo (evita gli stalli).
  // In coda sui rettilinei si aspetta di più, così le code ai semafori restano ordinate.
  car.pushThroughTime = Math.max(0, car.pushThroughTime - 1 / 60);
  if (car.pushThroughTime <= 0 && blockedAhead(car, s)) {
    car.stuckTime += 1 / 60;
    if (car.stuckTime > (inCrossing ? 2 : 9)) {
      car.stuckTime = 0;
      car.pushThroughTime = 1;
    }
    return { steer: 0, throttle: forwardSpeed(car) > 5 ? -1 : 0, handbrake: false };
  }
  car.stuckTime = 0;
  return steerTowards(car, tileCenter(car.aiTarget), CRUISE);
};
