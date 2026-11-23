import { dist } from "../engine/math";
import type { CarControls } from "../entities/car";
import { forwardSpeed } from "../entities/car";
import type { Car } from "../entities/types";
import { VEHICLES } from "../entities/vehicles";
import type { GameState } from "../game/state";
import { arrivedAt, dispatchVehicle, routeToPoint } from "./dispatch";

const CALL_RANGE = 900;
const ARRIVE_DIST = 60;
const ROADSIDE_DIST = 160;
/** Secondi per agganciare il rottame */
const HOOK_TIME = 2;
const GIVE_UP = 50;

/** Rottame da portare via: non in fiamme e non già agganciato */
const findWreck = (s: GameState): Car | undefined =>
  s.cars.find(
    (c) =>
      c.dead &&
      !c.towedBy &&
      dist(c.pos, s.camera.pos) < CALL_RANGE &&
      !s.fires.some((f) => dist(f.pos, c.pos) < 30),
  );

/** Il rottame agganciato segue il carro attrezzi, appeso dietro */
const followTower = (s: GameState): void => {
  for (const w of s.cars) {
    const t = w.towedBy;
    if (!t) continue;
    const back = VEHICLES[t.kind].len / 2 + VEHICLES[w.kind].len / 2 + 2;
    w.angle = t.angle;
    w.pos = { x: t.pos.x - Math.cos(t.angle) * back, y: t.pos.y - Math.sin(t.angle) * back };
    w.vel = { ...t.vel };
  }
  // Se il carro attrezzi sparisce (lontano dalla camera) sparisce anche il rottame
  s.cars = s.cars.filter((c) => !c.towedBy || s.cars.includes(c.towedBy));
};

/** Carri attrezzi che portano via i rottami (un intervento alla volta) */
export const updateTowing = (s: GameState, dt: number): void => {
  followTower(s);
  const job = s.towJob;
  if (!job) {
    const wreck = findWreck(s);
    const car = wreck && dispatchVehicle(s, "tow", wreck.pos);
    if (!wreck || !car) return;
    s.towJob = { car, wreck, hook: 0, time: 0 };
    routeToPoint(s, car, wreck.pos);
    return;
  }
  const { car, wreck } = job;
  job.time += dt;
  const gone = !s.cars.includes(car) || car.dead || car.driver !== "ai" || !s.cars.includes(wreck);
  if (gone || job.time > GIVE_UP) {
    if (s.cars.includes(car)) car.route = null;
    s.towJob = null;
    return;
  }
  if (job.hook > 0 || arrivedAt(car, wreck.pos, ARRIVE_DIST, ROADSIDE_DIST)) {
    job.hook += dt;
    if (job.hook < HOOK_TIME) return;
    wreck.towedBy = car;
    car.route = null; // Torna nel traffico col rottame appeso
    s.towJob = null;
  } else if (car.route === null || car.route.length === 0) routeToPoint(s, car, wreck.pos);
};

/** Carro attrezzi fermo mentre aggancia (null = guida normale) */
export const towControls = (s: GameState, car: Car): CarControls | null => {
  if (s.towJob?.car !== car || s.towJob.hook <= 0) return null;
  return { steer: 0, throttle: forwardSpeed(car) > 5 ? -1 : 0, handbrake: true };
};
