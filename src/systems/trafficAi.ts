import { type Vec2, angleTo, clamp, dist, wrapAngle } from "../engine/math";
import type { CarControls } from "../entities/car";
import { forwardSpeed } from "../entities/car";
import type { Car } from "../entities/types";
import { VEHICLES } from "../entities/vehicles";
import { type GameState, stars } from "../game/state";
import { type CityMap, laneAt, tileAt, tileCenter, worldToTile } from "../world/cityMap";
import { isRailCrossing } from "../world/railway";
import { ALL_DIRS, type Dir, Tile, dirAngle, dirVector, oppositeDir } from "../world/tiles";
import { isIntersectionTile, isJunctionTile, lightFor } from "../world/trafficLights";
import { crossingClosed } from "./trainSystem";

/** Le emergenze vanno più veloci della crociera normale */
const EMERGENCY_BOOST = 1.4;
const TURN_CRUISE = 40;
/** Anticipo della sterzata rispetto al centro della tile di svolta: è il raggio minimo
 * di curva della fisica sotto FULL_TURN_SPEED (60 / TURN_RATE 2.8 ≈ 21 px) */
const TURN_LEAD = 24;
/** Distanza dalla tile di svolta entro cui si scende a velocità da curva */
const TURN_BRAKE_DIST = 80;
/** Secondi da ferma fuori strada prima della retromarcia (e durata della retromarcia) */
const UNSTUCK_AFTER = 0.7;
/** Sirene: raggio in cui si accosta, per quanto si resta accostati, scostamento laterale */
const YIELD_RADIUS = 220;
const YIELD_HOLD = 1.5;
const YIELD_SPEED = 15;
const SIDE_OFFSET = 11;
/** Distanza davanti entro cui un mezzo in emergenza si sposta per sorpassare */
const OVERTAKE_AHEAD = 50;

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

/** Un punto è nel "corridoio" davanti al veicolo (coordinate locali); `extra` allunga il
 * corridoio (es. metà lunghezza del veicolo che sta davanti) */
const inFront = (car: Car, p: Vec2, halfWidth: number, extra = 0): boolean => {
  const dx = p.x - car.pos.x;
  const dy = p.y - car.pos.y;
  const fwd = dx * Math.cos(car.angle) + dy * Math.sin(car.angle);
  const lat = -dx * Math.sin(car.angle) + dy * Math.cos(car.angle);
  const nose = VEHICLES[car.kind].len / 2;
  return fwd > nose - 6 && fwd < nose + 20 + extra && Math.abs(lat) < halfWidth;
};

/** Ostacolo davanti al veicolo (veicoli, pedoni in strada o giocatore) */
const blockedAhead = (car: Car, s: GameState, emergency: boolean): boolean => {
  // In emergenza chi sta accostando non è un ostacolo: lo si supera di lato
  const carAhead = (c: Car): boolean =>
    c !== car &&
    !c.dead &&
    !(emergency && c.yieldTime > 0) &&
    inFront(car, c.pos, 12, VEHICLES[c.kind].len / 2);
  if (s.cars.some(carAhead)) return true;
  if (s.peds.some((p) => p.state !== "dead" && inFront(car, p.pos, 8))) return true;
  return !s.player.car && inFront(car, s.player.pos, 8);
};

/** Mezzo con le sirene accese: ambulanza in servizio o volante durante un inseguimento */
export const hasSiren = (car: Car, s: GameState): boolean =>
  !car.dead &&
  car.driver === "ai" &&
  ((car.kind === "ambulance" && car.route !== null) || (car.police && stars(s) > 0));

/** Lato della corsia da tenere: 1 = accosta a destra (sente una sirena), -1 = sorpassa a
 * sinistra (in emergenza con qualcuno che accosta davanti), 0 = centro corsia */
const laneSide = (car: Car, s: GameState, emergency: boolean): number => {
  if (emergency || hasSiren(car, s)) {
    const yielding = s.cars.some((c) => c.yieldTime > 0 && inFront(car, c.pos, 16, OVERTAKE_AHEAD));
    return yielding ? -1 : 0;
  }
  if (s.cars.some((c) => c !== car && hasSiren(c, s) && dist(c.pos, car.pos) < YIELD_RADIUS))
    car.yieldTime = YIELD_HOLD;
  return car.yieldTime > 0 ? 1 : 0;
};

/** Prossima mossa: segue il percorso se c'è (ambulanze, volanti in ricerca), altrimenti a caso */
const planNext = (map: CityMap, car: Car, tile: Vec2): { dir: Dir; tile: Vec2 } | null => {
  const step = car.route?.[0];
  if (step) {
    const dir = ALL_DIRS.find((d) => {
      const v = dirVector(d);
      return tile.x + v.x === step.x && tile.y + v.y === step.y;
    });
    if (dir && laneAt(map, tile.x, tile.y) & dir) {
      car.route?.shift();
      return { dir, tile: step };
    }
    car.route = null; // Percorso non più valido (es. dopo un urto): si torna al giro libero
  }
  return chooseNext(map, tile, car.laneDir);
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
  car.yieldTime = Math.max(0, car.yieldTime - 1 / 60);
  const here = worldToTile(car.pos);
  if (!car.aiTarget || dist(car.pos, tileCenter(car.aiTarget)) > 96) {
    const lane = laneAt(s.map, here.x, here.y) !== 0 ? here : nearestLane(s.map, here);
    if (!lane) return { steer: 0, throttle: 0, handbrake: true };
    const next = chooseNext(s.map, lane, car.laneDir);
    car.route = null;
    car.laneDir = next ? next.dir : car.laneDir;
    car.aiTarget = next && lane === here ? next.tile : lane;
    car.aiNext = null;
  }
  // Pianifica la mossa dopo il bersaglio: se è una svolta si rallenta e si gira in anticipo
  if (!car.aiNext) car.aiNext = planNext(s.map, car, car.aiTarget);
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
  // Semaforo: col rosso o col giallo ci si ferma prima dell'incrocio (non in emergenza)
  const inCrossing = isJunctionTile(s.map, here);
  // Chi segue un percorso (ambulanza, volante in ricerca) è in emergenza
  const emergency = car.route !== null;
  if (
    !emergency &&
    !inCrossing &&
    isIntersectionTile(s.map, car.aiTarget) &&
    lightFor(car.laneDir, s.time) !== "green"
  ) {
    car.stuckTime = 0;
    return { steer: 0, throttle: forwardSpeed(car) > 5 ? -1 : 0, handbrake: false };
  }

  // Passaggio a livello chiuso: ci si ferma prima (chi è già sui binari prosegue e li libera).
  // Vale anche per le emergenze: il treno non si ferma.
  if (
    !isRailCrossing(s.map, here) &&
    isRailCrossing(s.map, car.aiTarget) &&
    crossingClosed(s, car.aiTarget.x)
  ) {
    car.stuckTime = 0;
    return { steer: 0, throttle: forwardSpeed(car) > 5 ? -1 : 0, handbrake: false };
  }

  // Pazienza: dopo un'attesa lunga riparte comunque per 1 secondo (evita gli stalli).
  // In coda sui rettilinei si aspetta di più, così le code ai semafori restano ordinate.
  car.pushThroughTime = Math.max(0, car.pushThroughTime - 1 / 60);
  if (car.pushThroughTime <= 0 && blockedAhead(car, s, emergency)) {
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
  const cruise = VEHICLES[car.kind].cruise * (emergency ? EMERGENCY_BOOST : 1);
  // Sirene: i civili accostano a destra; chi è in emergenza li supera tenendo la sinistra
  const side = laneSide(car, s, emergency);
  if (side !== 0) {
    const right = { x: -dv.y, y: dv.x };
    const aim = {
      x: target.x + right.x * side * SIDE_OFFSET,
      y: target.y + right.y * side * SIDE_OFFSET,
    };
    return steerTowards(car, aim, side > 0 ? YIELD_SPEED : cruise);
  }
  return steerTowards(car, target, slow ? TURN_CRUISE : cruise);
};
