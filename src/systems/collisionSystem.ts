import { CAR_RADIUS, PED_RADIUS, carHitsWall, circleBlocked } from "../engine/collision";
import { type Vec2, dist } from "../engine/math";
import { damageCar } from "../entities/car";
import type { Car } from "../entities/types";
import { VEHICLES, collisionCircles } from "../entities/vehicles";
import type { GameState } from "../game/state";
import { blocksCars, blocksPeds } from "../world/tiles";
import { scarePeds } from "./pedAi";
import { reactToAccident } from "./pedReactions";
import { crime } from "./wantedSystem";
import { killPed } from "./weaponSystem";

const KILL_SPEED = 45;

/** Coppia di cerchi più compenetrata tra due veicoli (null se non si toccano) */
const deepestOverlap = (a: Car, b: Car): { nx: number; ny: number; depth: number } | null => {
  if (dist(a.pos, b.pos) > (VEHICLES[a.kind].len + VEHICLES[b.kind].len) / 2 + 4) return null;
  let best: { nx: number; ny: number; depth: number } | null = null;
  for (const ca of collisionCircles(a.kind, a.pos, a.angle))
    for (const cb of collisionCircles(b.kind, b.pos, b.angle)) {
      const d = dist(ca.c, cb.c);
      const depth = ca.r + cb.r - d;
      if (depth <= 0 || d === 0 || (best && best.depth >= depth)) continue;
      best = { nx: (cb.c.x - ca.c.x) / d, ny: (cb.c.y - ca.c.y) / d, depth };
    }
  return best;
};

/** Urto semplificato tra due veicoli: il più pesante sposta di più il più leggero */
const collideCars = (s: GameState, a: Car, b: Car): void => {
  const hit = deepestOverlap(a, b);
  if (!hit) return;
  const { nx, ny, depth } = hit;
  const ma = VEHICLES[a.kind].mass;
  const mb = VEHICLES[b.kind].mass;
  const tryMove = (c: Car, dx: number, dy: number): void => {
    const p = { x: c.pos.x + dx, y: c.pos.y + dy };
    const { len, wid } = VEHICLES[c.kind];
    if (!carHitsWall(s.map, p, c.angle, blocksCars, len, wid)) c.pos = p;
  };
  tryMove(a, -nx * depth * (mb / (ma + mb)), -ny * depth * (mb / (ma + mb)));
  tryMove(b, nx * depth * (ma / (ma + mb)), ny * depth * (ma / (ma + mb)));

  const rel = (a.vel.x - b.vel.x) * nx + (a.vel.y - b.vel.y) * ny;
  if (rel <= 0) return;
  const j = (rel * 1.4) / (ma + mb);
  a.vel.x -= j * mb * nx;
  a.vel.y -= j * mb * ny;
  b.vel.x += j * ma * nx;
  b.vel.y += j * ma * ny;
  if (rel > 60) {
    const dmg = (rel - 60) * 0.15;
    damageCar(a, dmg);
    damageCar(b, dmg);
    const pc = s.player.car;
    if ((a === pc && b.police) || (b === pc && a.police)) crime(s, 0.25);
    // Scontro violento col giocatore: i passanti si fermano a guardare
    if (a === pc || b === pc) reactToAccident(s, a.pos);
  }
};

export const updateEntityCollisions = (s: GameState): void => {
  const cars = s.cars;
  for (let i = 0; i < cars.length; i++)
    for (let j = i + 1; j < cars.length; j++)
      // I rottami appesi al carro attrezzi non urtano niente
      if (!cars[i].towedBy && !cars[j].towedBy) collideCars(s, cars[i], cars[j]);

  for (const car of cars) {
    const speed = Math.hypot(car.vel.x, car.vel.y);
    const circles = collisionCircles(car.kind, car.pos, car.angle);
    const touches = (p: Vec2): boolean =>
      circles.some((c) => dist(c.c, p) < Math.max(c.r, CAR_RADIUS) + PED_RADIUS);
    for (const p of s.peds) {
      if (p.state === "dead" || !touches(p.pos)) continue;
      if (speed > KILL_SPEED) {
        killPed(s, p, car.driver === "player");
        reactToAccident(s, p.pos);
      } else {
        const a = Math.atan2(p.pos.y - car.pos.y, p.pos.x - car.pos.x);
        p.pos.x += Math.cos(a) * 2;
        p.pos.y += Math.sin(a) * 2;
        scarePeds(s, car.pos, 30);
      }
    }
    // Giocatore a piedi investito
    const pl = s.player;
    // Durante l'entrata/uscita (scivolata sul cofano) il giocatore non viene urtato
    if (!pl.car && !pl.transition && car.driver !== "player" && touches(pl.pos)) {
      if (speed > KILL_SPEED) pl.health -= speed * 0.25;
      const a = Math.atan2(pl.pos.y - car.pos.y, pl.pos.x - car.pos.x);
      const np = { x: pl.pos.x + Math.cos(a) * 6, y: pl.pos.y + Math.sin(a) * 6 };
      if (!circleBlocked(s.map, np, PED_RADIUS, blocksPeds)) pl.pos = np;
      car.vel.x *= 0.5;
      car.vel.y *= 0.5;
    }
  }
};
