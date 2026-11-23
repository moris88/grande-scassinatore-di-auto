import { type Vec2, angleTo, clamp, dist, wrapAngle } from "../engine/math";
import type { CarControls } from "../entities/car";
import { forwardSpeed } from "../entities/car";
import type { Car } from "../entities/types";
import type { GameState } from "../game/state";
import { type CityMap, laneAt, tileAt, tileCenter, worldToTile } from "../world/cityMap";
import { ALL_DIRS, type Dir, Tile, dirAngle, dirVector, oppositeDir } from "../world/tiles";
import { isIntersectionTile, isJunctionTile, lightFor } from "../world/trafficLights";

const CRUISE = 95;
const TURN_CRUISE = 40;
/** Anticipo della sterzata rispetto al centro della tile di svolta: è il raggio minimo
 * di curva della fisica sotto FULL_TURN_SPEED (60 / TURN_RATE 2.8 ≈ 21 px) */
const TURN_LEAD = 24;
/** Distanza dalla tile di svolta entro cui si scende a velocità da curva */
const TURN_BRAKE_DIST = 80;
/** Secondi da ferma fuori strada prima della retromarcia (e durata della retromarcia) */
const UNSTUCK_AFTER = 0.7;

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
    throttle: vf < want ? 1 : vf > want + 10 ? -1 : 0,
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
    car.aiNext = null;
  }
  // Pianifica la mossa dopo il bersaglio: se è una svolta si rallenta e si gira in anticipo
  if (!car.aiNext) car.aiNext = chooseNext(s.map, car.aiTarget, car.laneDir);
  const turning = car.aiNext !== null && car.aiNext.dir !== car.laneDir;
  const tc = tileCenter(car.aiTarget);
  const dv = dirVector(car.laneDir);
  const along = (car.pos.x - tc.x) * dv.x + (car.pos.y - tc.y) * dv.y;
  // Bersaglio raggiunto (in curva si inizia a sterzare TURN_LEAD px prima del centro)
  if (car.aiNext && dist(car.pos, tc) < 56 && along > (turning ? -TURN_LEAD : -6)) {
    car.laneDir = car.aiNext.dir;
    car.aiTarget = car.aiNext.tile;
    car.aiNext = null;
  }
  // Semaforo: col rosso o col giallo ci si ferma prima dell'incrocio
  const inCrossing = isJunctionTile(s.map, here);
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
  // Fuori strada e incastrata (es. muso contro un muro dopo un urto): retromarcia girando
  // il muso verso la corsia (in retromarcia la sterzata è invertita)
  const target = tileCenter(car.aiTarget);
  if (car.reverseTime > 0) {
    car.reverseTime -= 1 / 60;
    const diff = wrapAngle(angleTo(car.pos, target) - car.angle);
    return { steer: -Math.sign(diff), throttle: -1, handbrake: false };
  }
  const offRoad = tileAt(s.map, here.x, here.y) !== Tile.Road;
  car.stuckTime = offRoad && Math.abs(forwardSpeed(car)) < 10 ? car.stuckTime + 1 / 60 : 0;
  if (car.stuckTime > UNSTUCK_AFTER) {
    car.stuckTime = 0;
    car.reverseTime = UNSTUCK_AFTER;
  }
  // Svolta in arrivo o muso non ancora allineato alla corsia: velocità da curva
  const misaligned = Math.abs(wrapAngle(dirAngle(car.laneDir) - car.angle)) > 0.25;
  const slow = misaligned || (turning && along > -TURN_BRAKE_DIST);
  return steerTowards(car, target, slow ? TURN_CRUISE : CRUISE);
};
