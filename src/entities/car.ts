import { CAR_LEN, carHitsWall } from "../engine/collision";
import { type Vec2, clamp, pick } from "../engine/math";
import type { CityMap } from "../world/cityMap";
import { Dir, blocksCars } from "../world/tiles";
import type { Car } from "./types";

export const CAR_MAX_SPEED = 280;
const ACCEL = 220;
const BRAKE = 420;
const MAX_REVERSE = 90;
const TURN_RATE = 2.8;
const GRIP = 9;
const HANDBRAKE_GRIP = 1.4;
/** Sotto questa velocità la sterzata è ridotta in proporzione (raggio minimo ≈ 21 px) */
const FULL_TURN_SPEED = 60;

export const CIVIL_COLORS = [
  "#c0392b",
  "#2e86c1",
  "#f1c40f",
  "#27ae60",
  "#8e44ad",
  "#ecf0f1",
  "#d35400",
];

export interface CarControls {
  throttle: number;
  steer: number;
  handbrake: boolean;
}

let nextId = 1;

export const createCar = (pos: Vec2, angle: number, police = false): Car => ({
  id: nextId++,
  pos: { ...pos },
  vel: { x: 0, y: 0 },
  angle,
  angularVel: 0,
  health: police ? 140 : 100,
  color: police ? "#1b2a4a" : pick(CIVIL_COLORS),
  police,
  driver: "none",
  laneDir: Dir.E,
  aiTarget: null,
  aiNext: null,
  stuckTime: 0,
  reverseTime: 0,
  pushThroughTime: 0,
  burnTime: 0,
  sirenPhase: 0,
  missionTag: false,
  dead: false,
});

export const forwardSpeed = (car: Car): number =>
  car.vel.x * Math.cos(car.angle) + car.vel.y * Math.sin(car.angle);

/** Aggiorna la fisica arcade. Ritorna la velocità d'impatto contro un muro (0 se nessuno) */
export const updateCarPhysics = (car: Car, ctl: CarControls, dt: number, map: CityMap): number => {
  const cos = Math.cos(car.angle);
  const sin = Math.sin(car.angle);
  let vf = car.vel.x * cos + car.vel.y * sin;
  let vl = -car.vel.x * sin + car.vel.y * cos;

  if (ctl.throttle > 0) {
    vf = vf < -5 ? vf + BRAKE * dt : Math.min(CAR_MAX_SPEED, vf + ACCEL * ctl.throttle * dt);
  } else if (ctl.throttle < 0) {
    vf = vf > 5 ? vf - BRAKE * dt : Math.max(-MAX_REVERSE, vf - ACCEL * 0.6 * dt);
  } else {
    const roll = 60 * dt;
    vf = Math.abs(vf) < roll ? 0 : vf - Math.sign(vf) * roll;
  }
  if (ctl.handbrake) vf *= Math.exp(-1.6 * dt);
  vl *= Math.exp(-(ctl.handbrake ? HANDBRAKE_GRIP : GRIP) * dt);

  const turnFactor = clamp(vf / FULL_TURN_SPEED, -1, 1) * (ctl.handbrake ? 1.4 : 1);
  car.angularVel = ctl.steer * TURN_RATE * turnFactor;
  const newAngle = car.angle + car.angularVel * dt;
  if (!carHitsWall(map, car.pos, newAngle, blocksCars)) car.angle = newAngle;

  const nc = Math.cos(car.angle);
  const ns = Math.sin(car.angle);
  car.vel.x = nc * vf - ns * vl;
  car.vel.y = ns * vf + nc * vl;

  return moveCar(car, dt, map);
};

/** Muove l'auto gestendo le collisioni con gli edifici */
export const moveCar = (car: Car, dt: number, map: CityMap): number => {
  const nx = car.pos.x + car.vel.x * dt;
  const ny = car.pos.y + car.vel.y * dt;
  if (!carHitsWall(map, { x: nx, y: ny }, car.angle, blocksCars)) {
    car.pos.x = nx;
    car.pos.y = ny;
    return 0;
  }
  const speed = Math.hypot(car.vel.x, car.vel.y);
  if (!carHitsWall(map, { x: nx, y: car.pos.y }, car.angle, blocksCars)) {
    car.pos.x = nx;
    car.vel.y *= -0.3;
    return Math.abs(car.vel.y / 0.3);
  }
  if (!carHitsWall(map, { x: car.pos.x, y: ny }, car.angle, blocksCars)) {
    car.pos.y = ny;
    car.vel.x *= -0.3;
    return Math.abs(car.vel.x / 0.3);
  }
  car.vel.x *= -0.3;
  car.vel.y *= -0.3;
  return speed;
};

/** Danno al muro sopra una certa soglia di velocità */
export const applyImpactDamage = (car: Car, impact: number): void => {
  if (impact > 70) car.health -= (impact - 70) * 0.18;
};

/** Punto in cui il giocatore esce dall'auto (lato sinistro) */
export const exitPoint = (car: Car): Vec2 => ({
  x: car.pos.x + Math.sin(car.angle) * 16 - Math.cos(car.angle) * (CAR_LEN / 4),
  y: car.pos.y - Math.cos(car.angle) * 16 - Math.sin(car.angle) * (CAR_LEN / 4),
});
