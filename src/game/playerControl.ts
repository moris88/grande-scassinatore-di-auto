import type { Input } from "../engine/input";
import { dist } from "../engine/math";
import { applyImpactDamage, forwardSpeed, updateCarPhysics } from "../entities/car";
import { updatePlayerOnFoot } from "../entities/player";
import type { Car } from "../entities/types";
import { stepSurface } from "./audioLevels";
import { enterRange, startEnter, startExit, updateTransition } from "./carTransition";
import { enterShop, shopAtDoor } from "./shopSystem";
import { type GameState, playSound } from "./state";

const MAX_EXIT_SPEED = 70;

/** Veicolo più vicino entro il raggio d'entrata (che dipende dalla sua lunghezza) */
const nearestCar = (s: GameState): Car | null => {
  let best: Car | null = null;
  let bestD = Number.POSITIVE_INFINITY;
  for (const c of s.cars) {
    const d = dist(c.pos, s.player.pos);
    if (!c.dead && c.health > 0 && d < enterRange(c) && d < bestD) {
      best = c;
      bestD = d;
    }
  }
  return best;
};

export const updatePlayerControl = (s: GameState, input: Input, dt: number): void => {
  const pl = s.player;
  // Durante l'animazione di entrata/uscita i comandi sono bloccati
  if (updateTransition(s, dt)) return;
  if (input.wasPressed("KeyE", "Enter")) {
    if (pl.car) {
      if (Math.abs(forwardSpeed(pl.car)) < MAX_EXIT_SPEED && startExit(s, pl.car)) return;
    } else {
      // Davanti alla porta di un negozio si entra (ha la precedenza sulle auto)
      const shop = shopAtDoor(s);
      if (shop) {
        enterShop(s, shop);
        return;
      }
      const car = nearestCar(s);
      if (car) {
        startEnter(s, car);
        return;
      }
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
    const step = Math.floor(pl.walkPhase / 2);
    updatePlayerOnFoot(pl, input, dt, s.map);
    // Un passo ogni due fotogrammi dell'animazione, col suono della superficie
    if (Math.floor(pl.walkPhase / 2) !== step) playSound(s, stepSurface(s));
  }
};
