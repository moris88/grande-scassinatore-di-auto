import { PED_RADIUS, moveCircle } from "../engine/collision";
import { type Vec2, angleTo, dist, pick } from "../engine/math";
import type { Pedestrian } from "../entities/types";
import type { GameState } from "../game/state";
import { tileAt, tileCenter, worldToTile } from "../world/cityMap";
import { ALL_DIRS, blocksPeds, dirVector, isWalkable } from "../world/tiles";

const FLEE_SPEED = 100;

/** Prossima tile pedonale adiacente, preferendo proseguire dritto */
const nextWalkTarget = (s: GameState, p: Pedestrian): Vec2 | null => {
  const here = worldToTile(p.pos);
  const options = ALL_DIRS.map(dirVector)
    .map((v) => ({ x: here.x + v.x, y: here.y + v.y, v }))
    .filter((t) => isWalkable(tileAt(s.map, t.x, t.y)));
  if (options.length === 0) return null;
  const fx = Math.round(Math.cos(p.angle));
  const fy = Math.round(Math.sin(p.angle));
  const straight = options.find((o) => o.v.x === fx && o.v.y === fy);
  const chosen = straight && Math.random() < 0.8 ? straight : pick(options);
  const c = tileCenter(chosen);
  return { x: c.x + (Math.random() - 0.5) * 14, y: c.y + (Math.random() - 0.5) * 14 };
};

/** Fa scappare i pedoni entro un raggio da un punto di pericolo */
export const scarePeds = (s: GameState, from: Vec2, radius: number): void => {
  for (const p of s.peds) {
    // Gli agenti non scappano
    if (p.state === "dead" || p.role === "cop" || dist(p.pos, from) > radius) continue;
    p.state = "flee";
    p.fleeTime = 3 + Math.random() * 2;
    p.angle = angleTo(from, p.pos);
  }
};

export const updatePed = (s: GameState, p: Pedestrian, dt: number): void => {
  if (p.state === "dead") {
    p.deadTime += dt;
    return;
  }
  if (p.state === "flee") {
    p.fleeTime -= dt;
    if (p.fleeTime <= 0) {
      p.state = "walk";
      p.target = null;
    }
    const before = { ...p.pos };
    moveCircle(
      s.map,
      p.pos,
      Math.cos(p.angle) * FLEE_SPEED * dt,
      Math.sin(p.angle) * FLEE_SPEED * dt,
      PED_RADIUS,
      blocksPeds,
    );
    if (dist(before, p.pos) < FLEE_SPEED * dt * 0.3) p.angle += Math.PI / 2;
    p.walkPhase += dt * 16;
    return;
  }
  walkPed(s, p, dt);
};

/** Camminata tranquilla da una tile pedonale all'altra (pedoni e agenti di pattuglia) */
export const walkPed = (s: GameState, p: Pedestrian, dt: number): void => {
  if (!p.target || dist(p.pos, p.target) < 4) p.target = nextWalkTarget(s, p);
  if (!p.target) return;
  p.angle = angleTo(p.pos, p.target);
  const before = { ...p.pos };
  moveCircle(
    s.map,
    p.pos,
    Math.cos(p.angle) * p.speed * dt,
    Math.sin(p.angle) * p.speed * dt,
    PED_RADIUS,
    blocksPeds,
  );
  if (dist(before, p.pos) < p.speed * dt * 0.3) p.target = null;
  p.walkPhase += dt * 9;
};
