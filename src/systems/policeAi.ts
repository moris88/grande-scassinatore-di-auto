import { angleTo, dist } from "../engine/math";
import type { CarControls } from "../entities/car";
import { forwardSpeed } from "../entities/car";
import type { Car } from "../entities/types";
import { type GameState, playSound, stars } from "../game/state";
import { steerTowards, trafficControls } from "./trafficAi";

const CHASE_SPEED = 230;
const SHOOT_RANGE = 220;

/** Le volanti pattugliano come il traffico, inseguono quando sei ricercato */
export const policeControls = (car: Car, s: GameState, dt: number): CarControls => {
  car.sirenPhase += dt;
  if (stars(s) === 0) return trafficControls(car, s);

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

  // Vicino al giocatore a piedi: si ferma per arrestarlo
  if (!s.player.car && d < 45) return { throttle: vf > 5 ? -1 : 0, steer: 0, handbrake: true };

  return steerTowards(car, target, d < 120 ? 120 : CHASE_SPEED);
};

/** Con 3+ stelle gli agenti sparano dal finestrino */
export const policeShoot = (car: Car, s: GameState, dt: number): void => {
  if (stars(s) < 3 || car.dead) return;
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
