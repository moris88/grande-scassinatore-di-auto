import { CAR_RADIUS, PED_RADIUS, carHitsWall, circleBlocked } from "../engine/collision";
import { dist } from "../engine/math";
import type { Car } from "../entities/types";
import type { GameState } from "../game/state";
import { blocksCars, blocksPeds } from "../world/tiles";
import { scarePeds } from "./pedAi";
import { crime } from "./wantedSystem";
import { killPed } from "./weaponSystem";

const KILL_SPEED = 45;

/** Urto elastico semplificato tra due auto della stessa massa */
const collideCars = (s: GameState, a: Car, b: Car): void => {
  const d = dist(a.pos, b.pos);
  const min = CAR_RADIUS * 2;
  if (d >= min || d === 0) return;
  const nx = (b.pos.x - a.pos.x) / d;
  const ny = (b.pos.y - a.pos.y) / d;
  const push = (min - d) / 2;
  const tryMove = (c: Car, dx: number, dy: number): void => {
    const p = { x: c.pos.x + dx, y: c.pos.y + dy };
    if (!carHitsWall(s.map, p, c.angle, blocksCars)) c.pos = p;
  };
  tryMove(a, -nx * push, -ny * push);
  tryMove(b, nx * push, ny * push);

  const rel = (a.vel.x - b.vel.x) * nx + (a.vel.y - b.vel.y) * ny;
  if (rel <= 0) return;
  const j = rel * 0.7;
  a.vel.x -= j * nx;
  a.vel.y -= j * ny;
  b.vel.x += j * nx;
  b.vel.y += j * ny;
  if (rel > 60) {
    const dmg = (rel - 60) * 0.15;
    a.health -= dmg;
    b.health -= dmg;
    const pc = s.player.car;
    if ((a === pc && b.police) || (b === pc && a.police)) crime(s, 0.25);
  }
};

export const updateEntityCollisions = (s: GameState): void => {
  const cars = s.cars;
  for (let i = 0; i < cars.length; i++)
    for (let j = i + 1; j < cars.length; j++) collideCars(s, cars[i], cars[j]);

  for (const car of cars) {
    const speed = Math.hypot(car.vel.x, car.vel.y);
    for (const p of s.peds) {
      if (p.state === "dead" || dist(car.pos, p.pos) > CAR_RADIUS + PED_RADIUS) continue;
      if (speed > KILL_SPEED) killPed(s, p, car.driver === "player");
      else {
        const a = Math.atan2(p.pos.y - car.pos.y, p.pos.x - car.pos.x);
        p.pos.x += Math.cos(a) * 2;
        p.pos.y += Math.sin(a) * 2;
        scarePeds(s, car.pos, 30);
      }
    }
    // Giocatore a piedi investito
    const pl = s.player;
    if (!pl.car && car.driver !== "player" && dist(car.pos, pl.pos) < CAR_RADIUS + PED_RADIUS) {
      if (speed > KILL_SPEED) pl.health -= speed * 0.25;
      const a = Math.atan2(pl.pos.y - car.pos.y, pl.pos.x - car.pos.x);
      const np = { x: pl.pos.x + Math.cos(a) * 6, y: pl.pos.y + Math.sin(a) * 6 };
      if (!circleBlocked(s.map, np, PED_RADIUS, blocksPeds)) pl.pos = np;
      car.vel.x *= 0.5;
      car.vel.y *= 0.5;
    }
  }
};
