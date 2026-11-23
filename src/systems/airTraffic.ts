import { dist, pick } from "../engine/math";
import type { Helicopter } from "../entities/types";
import type { GameState } from "../game/state";

/** Elicotteri contemporaneamente in volo attorno alla camera */
const MAX_HELIS = 2;
const SPAWN_DIST = 900;
const DESPAWN_DIST = 1400;
/** Puntano a un punto entro questo raggio dalla camera, così attraversano lo schermo */
const AIM_SPREAD = 300;
const ROTOR_SPEED = 28;
const COLORS = ["#c0392b", "#f1c40f", "#ecf0f1", "#2e86c1", "#16a085"];

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

/** Muove gli elicotteri, toglie quelli lontani e ne fa partire di nuovi */
export const updateAirTraffic = (s: GameState, dt: number): void => {
  for (const h of s.helis) {
    h.pos.x += h.vel.x * dt;
    h.pos.y += h.vel.y * dt;
    h.rotor += ROTOR_SPEED * dt;
  }
  s.helis = s.helis.filter((h) => dist(h.pos, s.camera.pos) < DESPAWN_DIST);
  if (s.helis.length < MAX_HELIS && Math.random() < 0.01) s.helis.push(spawnHeli(s));
};
