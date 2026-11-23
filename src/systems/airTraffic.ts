import { type Vec2, clamp, dist, pick } from "../engine/math";
import type { Helicopter, Plane } from "../entities/types";
import type { GameState } from "../game/state";
import { MAP_W } from "../world/cityMap";
import { TILE } from "../world/tiles";

/** Elicotteri contemporaneamente in volo attorno alla camera */
const MAX_HELIS = 1;
const SPAWN_DIST = 900;
const DESPAWN_DIST = 1400;
/** Puntano a un punto entro questo raggio dalla camera, così attraversano lo schermo */
const AIM_SPREAD = 300;
const ROTOR_SPEED = 28;
const COLORS = ["#c0392b", "#f1c40f", "#ecf0f1", "#2e86c1", "#16a085"];
/** Probabilità per frame che parta un nuovo velivolo (elicottero o aereo) */
const SPAWN_CHANCE = 0.01;
const PLANE_SPEED = 260;
const M = MAP_W * TILE;
/** Rotte fisse dell'aereo, da bordo a bordo (un po' fuori dalla mappa) */
const PLANE_ROUTES: { from: Vec2; to: Vec2 }[] = [
  { from: { x: -120, y: M * 0.15 }, to: { x: M + 120, y: M * 0.85 } },
  { from: { x: M + 120, y: M * 0.3 }, to: { x: -120, y: M * 0.6 } },
  { from: { x: M * 0.45, y: -120 }, to: { x: M * 0.6, y: M + 120 } },
];

const spawnHeli = (s: GameState): Helicopter => {
  const a = Math.random() * Math.PI * 2;
  const pos = {
    x: s.camera.pos.x + Math.cos(a) * SPAWN_DIST,
    y: s.camera.pos.y + Math.sin(a) * SPAWN_DIST,
  };
  const aim = {
    x: s.camera.pos.x + (Math.random() - 0.5) * 2 * AIM_SPREAD,
    y: s.camera.pos.y + (Math.random() - 0.5) * 2 * AIM_SPREAD,
  };
  const angle = Math.atan2(aim.y - pos.y, aim.x - pos.x);
  const speed = 90 + Math.random() * 50;
  return {
    pos,
    vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
    angle,
    rotor: Math.random() * Math.PI,
    color: pick(COLORS),
  };
};

/** Distanza di un punto dal segmento a-b */
const segmentDist = (p: Vec2, a: Vec2, b: Vec2): number => {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const t = clamp(((p.x - a.x) * abx + (p.y - a.y) * aby) / (abx * abx + aby * aby), 0, 1);
  return dist(p, { x: a.x + abx * t, y: a.y + aby * t });
};

/** L'aereo parte dal bordo della mappa sulla rotta fissa che passa più vicino alla camera */
const spawnPlane = (s: GameState): Plane => {
  const route = PLANE_ROUTES.reduce((best, r) =>
    segmentDist(s.camera.pos, r.from, r.to) < segmentDist(s.camera.pos, best.from, best.to)
      ? r
      : best,
  );
  const angle = Math.atan2(route.to.y - route.from.y, route.to.x - route.from.x);
  return {
    pos: { ...route.from },
    vel: { x: Math.cos(angle) * PLANE_SPEED, y: Math.sin(angle) * PLANE_SPEED },
    angle,
    exit: route.to,
  };
};

/** Muove elicotteri e aereo, toglie quelli usciti e ne fa partire di nuovi
 * (l'aereo compare con la stessa frequenza degli elicotteri) */
export const updateAirTraffic = (s: GameState, dt: number): void => {
  for (const h of s.helis) {
    h.pos.x += h.vel.x * dt;
    h.pos.y += h.vel.y * dt;
    h.rotor += ROTOR_SPEED * dt;
  }
  s.helis = s.helis.filter((h) => dist(h.pos, s.camera.pos) < DESPAWN_DIST);
  if (s.helis.length < MAX_HELIS && Math.random() < SPAWN_CHANCE) s.helis.push(spawnHeli(s));

  const p = s.plane;
  if (p) {
    p.pos.x += p.vel.x * dt;
    p.pos.y += p.vel.y * dt;
    // Superata l'uscita lungo la direzione di volo: fuori mappa
    if ((p.exit.x - p.pos.x) * p.vel.x + (p.exit.y - p.pos.y) * p.vel.y < 0) s.plane = null;
  } else if (Math.random() < SPAWN_CHANCE) s.plane = spawnPlane(s);
};
