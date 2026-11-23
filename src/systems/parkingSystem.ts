import { type Vec2, dist, pick } from "../engine/math";
import { createCar } from "../entities/car";
import type { GameState } from "../game/state";
import { PARKING_LOTS, tileCenter } from "../world/cityMap";

interface Stall {
  pos: Vec2;
  angle: number;
}

/** Quota di stalli occupati a inizio partita */
const START_FILL = 0.7;
/** Uno stallo vuoto si riempie solo fuori dalla vista (tra queste distanze dalla camera) */
const REFILL_MIN = 600;
const REFILL_MAX = 1100;

/** Uno stallo per tile: nei piazzali le auto sono in verticale, lungo i marciapiedi in parallelo */
export const STALLS: Stall[] = PARKING_LOTS.flatMap((lot) => {
  const out: Stall[] = [];
  for (let y = lot.y; y < lot.y + lot.h; y++)
    for (let x = lot.x; x < lot.x + lot.w; x++)
      out.push({ pos: tileCenter({ x, y }), angle: lot.h === 1 ? 0 : -Math.PI / 2 });
  return out;
});

const free = (s: GameState, st: Stall): boolean => !s.cars.some((c) => dist(c.pos, st.pos) < 22);

const park = (s: GameState, st: Stall): void => {
  const car = createCar(st.pos, st.angle + (Math.random() < 0.5 ? 0 : Math.PI));
  car.driver = "none";
  s.cars.push(car);
};

/** Riempie i parcheggi a inizio partita */
export const fillParking = (s: GameState): void => {
  for (const st of STALLS) if (Math.random() < START_FILL) park(s, st);
};

/** Riempie uno stallo vuoto lontano dalla vista (al massimo uno per frame) */
export const updateParking = (s: GameState): void => {
  const st = pick(STALLS);
  const d = dist(st.pos, s.camera.pos);
  if (d > REFILL_MIN && d < REFILL_MAX && free(s, st) && Math.random() < 0.05) park(s, st);
};
