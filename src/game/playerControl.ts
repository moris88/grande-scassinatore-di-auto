import { PED_RADIUS, circleBlocked } from "../engine/collision";
import type { Input } from "../engine/input";
import { dist } from "../engine/math";
import { applyImpactDamage, exitPoint, forwardSpeed, updateCarPhysics } from "../entities/car";
import { createPed } from "../entities/pedestrian";
import { updatePlayerOnFoot } from "../entities/player";
import type { Car } from "../entities/types";
import { crime, loseIdentity } from "../systems/wantedSystem";
import { blocksPeds } from "../world/tiles";
import { type GameState, playSound, showMessage } from "./state";

const ENTER_RANGE = 30;
const MAX_EXIT_SPEED = 70;

const nearestCar = (s: GameState): Car | null => {
  let best: Car | null = null;
  let bestD = ENTER_RANGE;
  for (const c of s.cars) {
    const d = dist(c.pos, s.player.pos);
    if (!c.dead && c.health > 0 && d < bestD) {
      best = c;
      bestD = d;
    }
  }
  return best;
};

const enterCar = (s: GameState, car: Car): void => {
  // Cambiare veicolo senza essere visto fa perdere le tracce alla polizia
  loseIdentity(s);
  if (car.driver === "ai") {
    // Il conducente viene buttato fuori e scappa
    const ped = createPed(exitPoint(car));
    ped.state = "flee";
    ped.fleeTime = 4;
    s.peds.push(ped);
    crime(s, car.police ? 1 : 0.1);
  }
  car.driver = "player";
  s.player.car = car;
  if (car.police) showMessage(s, "Hai rubato una volante!", 2);
};

const exitCar = (s: GameState, car: Car): void => {
  const p = exitPoint(car);
  const alt = { x: 2 * car.pos.x - p.x, y: 2 * car.pos.y - p.y };
  const spot = [p, alt].find((q) => !circleBlocked(s.map, q, PED_RADIUS, blocksPeds));
  if (!spot) return;
  car.driver = "none";
  s.player.car = null;
  s.player.pos = { ...spot };
  s.player.angle = car.angle;
};

export const updatePlayerControl = (s: GameState, input: Input, dt: number): void => {
  const pl = s.player;
  if (input.wasPressed("KeyE", "Enter")) {
    if (pl.car) {
      if (Math.abs(forwardSpeed(pl.car)) < MAX_EXIT_SPEED) exitCar(s, pl.car);
    } else {
      const car = nearestCar(s);
      if (car) enterCar(s, car);
    }
  }
  if (pl.car) {
    const car = pl.car;
    const ctl = { throttle: input.axisY(), steer: input.axisX(), handbrake: input.isDown("Space") };
    if (car.health <= 0) ctl.throttle = 0;
    const impact = updateCarPhysics(car, ctl, dt, s.map);
    applyImpactDamage(car, impact);
    if (impact > 70) playSound(s, "crash");
    pl.pos = { ...car.pos };
    pl.angle = car.angle;
    if (car.dead) {
      pl.health = 0;
      pl.car = null;
    }
  } else {
    updatePlayerOnFoot(pl, input, dt, s.map);
  }
};
