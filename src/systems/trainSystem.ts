import { PED_RADIUS } from "../engine/collision";
import type { Train } from "../entities/types";
import { collisionCircles } from "../entities/vehicles";
import { type GameState, playSound } from "../game/state";
import { MAP_W } from "../world/cityMap";
import { RAIL_Y } from "../world/railway";
import { TILE } from "../world/tiles";
import { killPed } from "./weaponSystem";

export const WAGON_LEN = 44;
export const WAGON_GAP = 4;
/** Metà larghezza del treno (asse y) */
export const TRAIN_HALF_W = 9;
const SPEED = 200;
const WAGONS = 4;
/** Attesa tra un treno e il successivo (secondi, casuale in questo intervallo) */
const WAIT_MIN = 25;
const WAIT_MAX = 40;
/** Il passaggio a livello si chiude quando il treno è entro questa distanza */
const CROSSING_WARN = 260;
const MAP_PX = MAP_W * TILE;

export const trainLength = (t: Train): number => t.wagons * (WAGON_LEN + WAGON_GAP) - WAGON_GAP;

/** Estensione del treno sull'asse x: [min, max] */
export const trainSpan = (t: Train): [number, number] =>
  t.dir > 0 ? [t.head - trainLength(t), t.head] : [t.head, t.head + trainLength(t)];

/** Il passaggio a livello alla colonna `col` (tile) è chiuso: treno vicino o in transito */
export const crossingClosed = (s: GameState, col: number): boolean => {
  if (!s.train) return false;
  const [a, b] = trainSpan(s.train);
  const cx = (col + 0.5) * TILE;
  return b > cx - CROSSING_WARN && a < cx + CROSSING_WARN;
};

const spawnTrain = (s: GameState): void => {
  const dir: 1 | -1 = s.trainDir;
  s.trainDir = dir > 0 ? -1 : 1;
  s.train = { head: dir > 0 ? -WAGON_LEN : MAP_PX + WAGON_LEN, dir, speed: SPEED, wagons: WAGONS };
  if (Math.abs(s.camera.pos.y - RAIL_Y) < 900) playSound(s, "horn");
};

/** Investe tutto ciò che si trova sul binario mentre passa */
const runOver = (s: GameState, t: Train): void => {
  const [a, b] = trainSpan(t);
  const onTrack = (x: number, y: number, r: number): boolean =>
    x + r > a && x - r < b && Math.abs(y - RAIL_Y) < TRAIN_HALF_W + r;
  for (const car of s.cars) {
    if (car.dead || car.health <= 0) continue;
    if (!collisionCircles(car.kind, car.pos, car.angle).some((c) => onTrack(c.c.x, c.c.y, c.r)))
      continue;
    // Veicolo distrutto e sbalzato via dal binario
    car.health = 0;
    car.vel.x = t.dir * t.speed * 0.8;
    car.vel.y = (car.pos.y < RAIL_Y ? -1 : 1) * 120;
    playSound(s, "crash");
  }
  for (const p of s.peds)
    if (p.state !== "dead" && onTrack(p.pos.x, p.pos.y, PED_RADIUS)) killPed(s, p, false);
  const pl = s.player;
  if (!pl.car && pl.health > 0 && onTrack(pl.pos.x, pl.pos.y, PED_RADIUS)) pl.health = 0;
};

export const updateTrains = (s: GameState, dt: number): void => {
  const t = s.train;
  if (!t) {
    s.trainTimer -= dt;
    if (s.trainTimer <= 0) {
      spawnTrain(s);
      s.trainTimer = WAIT_MIN + Math.random() * (WAIT_MAX - WAIT_MIN);
    }
    return;
  }
  t.head += t.dir * t.speed * dt;
  runOver(s, t);
  const [a, b] = trainSpan(t);
  if (a > MAP_PX + WAGON_LEN || b < -WAGON_LEN) s.train = null;
};
