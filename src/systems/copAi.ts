import { PED_RADIUS, moveCircle } from "../engine/collision";
import { angleTo, dist } from "../engine/math";
import { exitPoint } from "../entities/car";
import { createCop } from "../entities/pedestrian";
import type { Car, Pedestrian } from "../entities/types";
import { type GameState, playSound, stars } from "../game/state";
import { blocksPeds } from "../world/tiles";
import { walkPed } from "./pedAi";
import { lineOfSight, playerPos } from "./policeVision";

/** Gli agenti corrono un po' più veloci del giocatore che cammina (95) */
const COP_RUN = 100;
const SHOOT_RANGE = 200;
const SHOOT_EVERY = 1.3;
/** Agenti a piedi massimi: crescono con le stelle */
export const maxCopsOnFoot = (s: GameState): number => 3 + stars(s) * 2;

const copsOnFoot = (s: GameState): number =>
  s.peds.filter((p) => p.role === "cop" && p.state !== "dead").length;

/** Agente che spara al giocatore (da 2 stelle in su) */
const shoot = (s: GameState, cop: Pedestrian): void => {
  const a = angleTo(cop.pos, playerPos(s)) + (Math.random() - 0.5) * 0.3;
  cop.shootCooldown = SHOOT_EVERY;
  cop.angle = a;
  s.bullets.push({
    pos: { x: cop.pos.x + Math.cos(a) * 8, y: cop.pos.y + Math.sin(a) * 8 },
    vel: { x: Math.cos(a) * 480, y: Math.sin(a) * 480 },
    life: 0.6,
    fromPlayer: false,
  });
  playSound(s, "shot");
};

/** Agente a piedi: pattuglia, insegue il giocatore o va dove l'hanno visto l'ultima volta */
export const updateCop = (s: GameState, cop: Pedestrian, dt: number): void => {
  if (cop.state === "dead") {
    cop.deadTime += dt;
    return;
  }
  cop.state = "walk";
  cop.shootCooldown -= dt;
  const target = stars(s) === 0 ? null : s.seen ? playerPos(s) : s.lastSeen;
  if (!target || (!s.seen && dist(cop.pos, target) < 24)) {
    walkPed(s, cop, dt);
    return;
  }
  const d = dist(cop.pos, playerPos(s));
  if (s.seen && stars(s) >= 2 && d < SHOOT_RANGE && cop.shootCooldown <= 0)
    if (lineOfSight(s.map, cop.pos, playerPos(s))) shoot(s, cop);
  if (s.seen && d < 10) return; // Addosso al giocatore: lo sta arrestando
  cop.angle = angleTo(cop.pos, target);
  const before = { ...cop.pos };
  const step = COP_RUN * dt;
  moveCircle(
    s.map,
    cop.pos,
    Math.cos(cop.angle) * step,
    Math.sin(cop.angle) * step,
    PED_RADIUS,
    blocksPeds,
  );
  // Bloccato da un muro: prova ad aggirarlo di lato
  if (dist(before, cop.pos) < step * 0.3) {
    const side = cop.angle + Math.PI / 2;
    moveCircle(
      s.map,
      cop.pos,
      Math.cos(side) * step,
      Math.sin(side) * step,
      PED_RADIUS,
      blocksPeds,
    );
  }
  cop.walkPhase += dt * 16;
};

/** Volante vicina al giocatore e quasi ferma: scendono due agenti e la volante resta lì */
export const dropCops = (s: GameState, car: Car): boolean => {
  if (copsOnFoot(s) + 2 > maxCopsOnFoot(s)) return false;
  const left = exitPoint(car);
  const right = { x: 2 * car.pos.x - left.x, y: 2 * car.pos.y - left.y };
  for (const p of [left, right]) s.peds.push(createCop(p));
  car.driver = "none";
  return true;
};

/** Agenti di pattuglia in città anche senza inseguimento */
export const needsPatrolCop = (s: GameState): boolean =>
  copsOnFoot(s) < Math.min(3, maxCopsOnFoot(s));
