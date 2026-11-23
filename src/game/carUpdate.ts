import { dist } from "../engine/math";
import { applyImpactDamage, updateCarPhysics } from "../entities/car";
import type { Car } from "../entities/types";
import { ambulanceControls } from "../systems/ambulanceSystem";
import { scarePeds } from "../systems/pedAi";
import { policeControls, policeShoot } from "../systems/policeAi";
import { trafficControls } from "../systems/trafficAi";
import { killPed } from "../systems/weaponSystem";
import { type GameState, playSound } from "./state";

const BURN_TIME = 2.5;
const BLAST_RADIUS = 70;
const IDLE = { throttle: 0, steer: 0, handbrake: false };

const explode = (s: GameState, car: Car): void => {
  car.dead = true;
  car.vel = { x: 0, y: 0 };
  s.explosions.push({ pos: { ...car.pos }, time: 0 });
  playSound(s, "explosion");
  scarePeds(s, car.pos, 200);
  for (const p of s.peds)
    if (p.state !== "dead" && dist(p.pos, car.pos) < BLAST_RADIUS) killPed(s, p, false);
  for (const c of s.cars)
    if (c !== car && !c.dead && dist(c.pos, car.pos) < BLAST_RADIUS) c.health -= 60;
  const pl = s.player;
  if (pl.car === car) pl.health = 0;
  else if (!pl.car && dist(pl.pos, car.pos) < BLAST_RADIUS) pl.health -= 70;
};

export const updateCars = (s: GameState, dt: number): void => {
  for (const car of s.cars) {
    if (car.dead) continue;
    if (car.health <= 0) {
      car.burnTime += dt;
      // L'autista dell'IA abbandona l'auto in fiamme
      if (car.driver === "ai") car.driver = "none";
      if (car.burnTime > BURN_TIME) {
        explode(s, car);
        continue;
      }
    }
    if (car.driver === "player") continue;
    let ctl = IDLE;
    if (car.driver === "ai") {
      ctl =
        ambulanceControls(s, car) ??
        (car.police ? policeControls(car, s, dt) : trafficControls(car, s));
      if (car.police) policeShoot(car, s, dt);
    }
    applyImpactDamage(car, updateCarPhysics(car, ctl, dt, s.map));
  }
  for (const e of s.explosions) e.time += dt;
  s.explosions = s.explosions.filter((e) => e.time < 0.9);
};
