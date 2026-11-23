import { angleTo, dist } from "../engine/math";
import type { CarControls } from "../entities/car";
import { forwardSpeed } from "../entities/car";
import type { Car } from "../entities/types";
import { type GameState, playSound, stars } from "../game/state";
import { worldToTile } from "../world/cityMap";
import { findLaneRoute, nearestLaneTile } from "../world/laneRoute";
import { dropCops } from "./copAi";
import { steerTowards, trafficControls } from "./trafficAi";

const CHASE_SPEED = 230;
const SHOOT_RANGE = 220;
/** Volante più vicina di così e quasi ferma: gli agenti scendono */
const DROP_DIST = 110;
const IDLE: CarControls = { throttle: 0, steer: 0, handbrake: true };

/** Senza vista sul giocatore: percorso fino all'ultimo punto noto, poi pattuglia la zona */
const searchControls = (car: Car, s: GameState): CarControls => {
  if (s.lastSeen && car.route === null) {
    const goal = nearestLaneTile(s.map, worldToTile(s.lastSeen));
    const from = car.aiTarget ?? worldToTile(car.pos);
    car.route = (goal && findLaneRoute(s.map, from, car.laneDir, goal)) || [];
  }
  return trafficControls(car, s);
};

/** Le volanti pattugliano come il traffico, inseguono quando ti vedono, ti cercano altrimenti */
export const policeControls = (car: Car, s: GameState, dt: number): CarControls => {
  car.sirenPhase += dt;
  if (stars(s) === 0) {
    car.route = null;
    return trafficControls(car, s);
  }
  if (!s.seen) return searchControls(car, s);
  car.route = null;

  const target = s.player.car ? s.player.car.pos : s.player.pos;
  const d = dist(car.pos, target);
  const vf = forwardSpeed(car);

  // Sblocco: se resta ferma con il gas premuto, fa retromarcia
  if (car.reverseTime > 0) {
    car.reverseTime -= dt;
    return { throttle: -1, steer: 1, handbrake: false };
  }
  car.stuckTime = Math.abs(vf) < 15 && d > 50 ? car.stuckTime + dt : 0;
  if (car.stuckTime > 1) {
    car.stuckTime = 0;
    car.reverseTime = 0.8;
  }

  // Vicina e lenta: gli agenti scendono a inseguirti a piedi
  if (d < DROP_DIST && Math.abs(vf) < 30 && dropCops(s, car)) return IDLE;

  // Vicino al giocatore a piedi: si ferma per arrestarlo
  if (!s.player.car && d < 45) return { throttle: vf > 5 ? -1 : 0, steer: 0, handbrake: true };

  return steerTowards(car, target, d < 120 ? 120 : CHASE_SPEED);
};

/** Con 3+ stelle gli agenti sparano dal finestrino */
export const policeShoot = (car: Car, s: GameState, dt: number): void => {
  if (stars(s) < 3 || car.dead || !s.seen || car.driver !== "ai") return;
  const target = s.player.car ? s.player.car.pos : s.player.pos;
  if (dist(car.pos, target) > SHOOT_RANGE) return;
  const before = Math.floor((car.sirenPhase - dt) / 1.1);
  if (Math.floor(car.sirenPhase / 1.1) === before) return;
  const a = angleTo(car.pos, target) + (Math.random() - 0.5) * 0.25;
  playSound(s, "shot");
  s.bullets.push({
    pos: { x: car.pos.x + Math.cos(a) * 16, y: car.pos.y + Math.sin(a) * 16 },
    vel: { x: Math.cos(a) * 520, y: Math.sin(a) * 520 },
    life: 0.6,
    fromPlayer: false,
  });
};
