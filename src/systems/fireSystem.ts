import { type Vec2, dist } from "../engine/math";
import type { CarControls } from "../entities/car";
import { damageCar, forwardSpeed } from "../entities/car";
import type { Car } from "../entities/types";
import { type GameState, showMessage } from "../game/state";
import { arrivedAt, dispatchVehicle, routeToPoint } from "./dispatch";

/** Senza pompieri un incendio si spegne da solo in circa un minuto */
const BURN_OUT = 60;
/** Il getto d'acqua spegne un incendio pieno in questi secondi */
const SPRAY_TIME = 3;
/** Raggio in cui il fuoco brucia chi ci passa */
const HEAT_RADIUS = 18;
const CALL_RANGE = 900;
const ARRIVE_DIST = 70;
const ROADSIDE_DIST = 160;
const GIVE_UP = 50;

/** Un rottame appena esploso resta in fiamme */
export const startFire = (s: GameState, pos: Vec2): void => {
  s.fires.push({ pos: { ...pos }, strength: 1 });
};

/** Il fuoco brucia pedoni, giocatore e veicoli troppo vicini, e intanto si consuma */
const burn = (s: GameState, dt: number): void => {
  for (const f of s.fires) {
    f.strength -= dt / BURN_OUT;
    const r = HEAT_RADIUS * f.strength + 6;
    const pl = s.player;
    if (!pl.car && dist(pl.pos, f.pos) < r) pl.health -= 25 * dt;
    for (const c of s.cars)
      if (!c.dead && c.health > 0 && dist(c.pos, f.pos) < r + 8) damageCar(c, 15 * dt);
  }
  s.fires = s.fires.filter((f) => f.strength > 0);
};

const dispatch = (s: GameState): void => {
  const fire = s.fires.find((f) => dist(f.pos, s.camera.pos) < CALL_RANGE);
  if (!fire) return;
  const car = dispatchVehicle(s, "firetruck", fire.pos);
  if (!car) return;
  s.fireJob = { car, fire, spray: 0, time: 0 };
  routeToPoint(s, car, fire.pos);
};

/** Incendi e interventi dei pompieri (uno alla volta) */
export const updateFires = (s: GameState, dt: number): void => {
  burn(s, dt);
  const job = s.fireJob;
  if (!job) {
    dispatch(s);
    return;
  }
  const { car, fire } = job;
  job.time += dt;
  const gone = !s.cars.includes(car) || car.dead || car.driver !== "ai";
  const out = !s.fires.includes(fire);
  if (gone || out || job.time > GIVE_UP) {
    if (!gone) car.route = null;
    if (out && job.spray > 0 && dist(car.pos, s.player.pos) < 400)
      showMessage(s, "I pompieri hanno spento l'incendio", 2);
    s.fireJob = null;
    return;
  }
  if (job.spray > 0 || arrivedAt(car, fire.pos, ARRIVE_DIST, ROADSIDE_DIST)) {
    job.spray += dt;
    fire.strength -= dt / SPRAY_TIME;
    if (fire.strength <= 0) s.fires = s.fires.filter((f) => f !== fire);
  } else if (car.route === null || car.route.length === 0) routeToPoint(s, car, fire.pos);
};

/** Camion fermo mentre spara l'acqua (null = guida normale) */
export const fireControls = (s: GameState, car: Car): CarControls | null => {
  if (s.fireJob?.car !== car || s.fireJob.spray <= 0) return null;
  return { steer: 0, throttle: forwardSpeed(car) > 5 ? -1 : 0, handbrake: true };
};
