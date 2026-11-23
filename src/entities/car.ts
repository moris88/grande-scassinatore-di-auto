import { carHitsWall } from "../engine/collision";
import { type Vec2, clamp, pick } from "../engine/math";
import type { CityMap } from "../world/cityMap";
import { Dir, blocksCars } from "../world/tiles";
import type { Car } from "./types";
import { VEHICLES, type VehicleKind } from "./vehicles";

const ACCEL = 220;
const BRAKE = 420;
const MAX_REVERSE = 90;
const TURN_RATE = 2.8;
const GRIP = 9;
const HANDBRAKE_GRIP = 1.4;
/** Sotto questa velocità la sterzata è ridotta in proporzione (raggio minimo ≈ 21 px) */
const FULL_TURN_SPEED = 60;
/** Optional del concessionario */
const ENGINE_BOOST = 1.3;
const BRAKES_BOOST = 1.5;
const ARMOR_FACTOR = 0.5;
/** Prestazioni minime (frazione) di un veicolo quasi distrutto */
const DAMAGE_MIN_PERF = 0.55;

export const CIVIL_COLORS = [
  "#c0392b",
  "#2e86c1",
  "#f1c40f",
  "#27ae60",
  "#8e44ad",
  "#ecf0f1",
  "#d35400",
];

/** Tipi con un colore fisso (gli altri prendono un colore civile a caso) */
const FIXED_COLORS: Partial<Record<VehicleKind, string>> = {
  ambulance: "#f4f4f4",
  taxi: "#f1c40f",
  firetruck: "#c0392b",
  tow: "#e1b12c",
};

export interface CarControls {
  throttle: number;
  steer: number;
  handbrake: boolean;
}

let nextId = 1;

export const createCar = (
  pos: Vec2,
  angle: number,
  police = false,
  kind: VehicleKind = "car",
): Car => ({
  id: nextId++,
  pos: { ...pos },
  vel: { x: 0, y: 0 },
  angle,
  angularVel: 0,
  health: police ? 140 : VEHICLES[kind].health,
  color: police ? "#1b2a4a" : (FIXED_COLORS[kind] ?? pick(CIVIL_COLORS)),
  kind,
  police,
  driver: "none",
  route: null,
  laneDir: Dir.E,
  aiTarget: null,
  aiNext: null,
  stuckTime: 0,
  reverseTime: 0,
  pushThroughTime: 0,
  yieldTime: 0,
  burnTime: 0,
  sirenPhase: 0,
  missionTag: false,
  upgrades: { engine: false, armor: false, brakes: false },
  owned: false,
  gang: false,
  towedBy: null,
  dead: false,
});

export const forwardSpeed = (car: Car): number =>
  car.vel.x * Math.cos(car.angle) + car.vel.y * Math.sin(car.angle);

/** Il veicolo tocca un muro nella posizione/angolo indicati (con le sue misure) */
const hitsWall = (map: CityMap, car: Car, pos: Vec2, angle: number): boolean =>
  carHitsWall(map, pos, angle, blocksCars, VEHICLES[car.kind].len, VEHICLES[car.kind].wid);

/** Aggiorna la fisica arcade. Ritorna la velocità d'impatto contro un muro (0 se nessuno) */
export const updateCarPhysics = (car: Car, ctl: CarControls, dt: number, map: CityMap): number => {
  const up = car.upgrades;
  const engine = up.engine ? ENGINE_BOOST : 1;
  // Un veicolo danneggiato rende meno: a pezzi va a poco più di metà
  const worn = DAMAGE_MIN_PERF + (1 - DAMAGE_MIN_PERF) * healthRatio(car);
  const maxSpeed = VEHICLES[car.kind].maxSpeed * engine * worn;
  const accel = ACCEL * VEHICLES[car.kind].accel * engine * worn;
  const brake = BRAKE * VEHICLES[car.kind].brake * (up.brakes ? BRAKES_BOOST : 1);
  const cos = Math.cos(car.angle);
  const sin = Math.sin(car.angle);
  let vf = car.vel.x * cos + car.vel.y * sin;
  let vl = -car.vel.x * sin + car.vel.y * cos;

  if (ctl.throttle > 0) {
    vf = vf < -5 ? vf + brake * dt : Math.min(maxSpeed, vf + accel * ctl.throttle * dt);
  } else if (ctl.throttle < 0) {
    vf = vf > 5 ? vf - brake * dt : Math.max(-MAX_REVERSE, vf - accel * 0.6 * dt);
  } else {
    const roll = 60 * dt;
    vf = Math.abs(vf) < roll ? 0 : vf - Math.sign(vf) * roll;
  }
  if (ctl.handbrake) vf *= Math.exp(-1.6 * dt);
  vl *= Math.exp(-(ctl.handbrake ? HANDBRAKE_GRIP : GRIP) * dt);

  const turnFactor = clamp(vf / FULL_TURN_SPEED, -1, 1) * (ctl.handbrake ? 1.4 : 1);
  car.angularVel = ctl.steer * TURN_RATE * turnFactor;
  const newAngle = car.angle + car.angularVel * dt;
  if (!hitsWall(map, car, car.pos, newAngle)) car.angle = newAngle;

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
  if (!hitsWall(map, car, { x: nx, y: ny }, car.angle)) {
    car.pos.x = nx;
    car.pos.y = ny;
    return 0;
  }
  const speed = Math.hypot(car.vel.x, car.vel.y);
  if (!hitsWall(map, car, { x: nx, y: car.pos.y }, car.angle)) {
    car.pos.x = nx;
    car.vel.y *= -0.3;
    return Math.abs(car.vel.y / 0.3);
  }
  if (!hitsWall(map, car, { x: car.pos.x, y: ny }, car.angle)) {
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
  if (impact > 70) damageCar(car, (impact - 70) * 0.18);
};

/** Punto in cui il giocatore esce dall'auto (lato sinistro) */
export const exitPoint = (car: Car): Vec2 => {
  const { len, wid } = VEHICLES[car.kind];
  const side = wid / 2 + 9;
  return {
    x: car.pos.x + Math.sin(car.angle) * side - Math.cos(car.angle) * (len / 4),
    y: car.pos.y - Math.cos(car.angle) * side - Math.sin(car.angle) * (len / 4),
  };
};

/** Danno a un veicolo: la blindatura lo dimezza */
export const damageCar = (car: Car, amount: number): void => {
  car.health -= amount * VEHICLES[car.kind].armor * (car.upgrades.armor ? ARMOR_FACTOR : 1);
};

/** Salute residua del veicolo rispetto a quella del suo modello (0..1) */
export const healthRatio = (car: Car): number =>
  clamp(car.health / VEHICLES[car.kind].health, 0, 1);
