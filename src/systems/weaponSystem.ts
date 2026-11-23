import { PED_RADIUS, circleBlocked, moveCircle } from "../engine/collision";
import type { Input } from "../engine/input";
import { dist } from "../engine/math";
import type { Pedestrian, WeaponKind } from "../entities/types";
import { type GameState, playSound, showMessage } from "../game/state";
import { blocksCars, blocksPeds } from "../world/tiles";
import { scarePeds } from "./pedAi";
import { crime } from "./wantedSystem";

interface WeaponSpec {
  cooldown: number;
  spread: number;
}

const SPECS: Record<WeaponKind, WeaponSpec> = {
  fists: { cooldown: 0.45, spread: 0 },
  pistol: { cooldown: 0.35, spread: 0.04 },
  smg: { cooldown: 0.09, spread: 0.12 },
};

export const WEAPON_NAMES: Record<WeaponKind, string> = {
  fists: "Pugni",
  pistol: "Pistola",
  smg: "Mitraglietta",
};

const ORDER: WeaponKind[] = ["fists", "pistol", "smg"];
const BULLET_SPEED = 650;
/** Durata dell'animazione del braccio teso */
export const PUNCH_ANIM = 0.18;
const PUNCH_DAMAGE = 50;
const PUNCH_KNOCKBACK = 6;
const COP_KILL_HEAT = 0.9;

/** Uccide un pedone e applica le conseguenze se è stato il giocatore */
export const killPed = (s: GameState, ped: Pedestrian, byPlayer: boolean): void => {
  if (ped.state === "dead") return;
  ped.state = "dead";
  ped.deadTime = 0;
  scarePeds(s, ped.pos, 120);
  if (!byPlayer) return;
  s.money += 10 * s.multiplier;
  // Uccidere un agente è un reato molto più grave
  crime(s, ped.role === "cop" ? COP_KILL_HEAT : 0.35);
};

/** Pugno (alterna destro e sinistro): 2 colpi stendono un pedone, che intanto arretra e scappa */
export const punch = (s: GameState): void => {
  const p = s.player;
  p.punchTime = PUNCH_ANIM;
  p.punchLeft = !p.punchLeft;
  const hit = { x: p.pos.x + Math.cos(p.angle) * 12, y: p.pos.y + Math.sin(p.angle) * 12 };
  const ped = s.peds.find((q) => q.state !== "dead" && dist(q.pos, hit) < 12);
  if (!ped) return;
  playSound(s, "punch");
  ped.health -= PUNCH_DAMAGE;
  if (ped.health <= 0) {
    killPed(s, ped, true);
    return;
  }
  const kx = Math.cos(p.angle) * PUNCH_KNOCKBACK;
  const ky = Math.sin(p.angle) * PUNCH_KNOCKBACK;
  moveCircle(s.map, ped.pos, kx, ky, PED_RADIUS, blocksPeds);
  scarePeds(s, p.pos, 30);
  crime(s, ped.role === "cop" ? 0.3 : 0.05);
};

export const cycleWeapon = (s: GameState): void => {
  const p = s.player;
  const start = ORDER.indexOf(p.weapon);
  for (let i = 1; i <= ORDER.length; i++) {
    const w = ORDER[(start + i) % ORDER.length];
    if (p.ammo[w] > 0) {
      p.weapon = w;
      return;
    }
  }
};

export const updateWeapons = (s: GameState, input: Input, dt: number): void => {
  const p = s.player;
  p.fireCooldown -= dt;
  p.punchTime = Math.max(0, p.punchTime - dt);
  if (input.wasPressed("KeyQ")) cycleWeapon(s);
  if (p.car || !input.isDown("Space") || p.fireCooldown > 0) return;

  const spec = SPECS[p.weapon];
  p.fireCooldown = spec.cooldown;
  if (p.weapon === "fists") {
    punch(s);
    return;
  }
  p.ammo[p.weapon]--;
  const a = p.angle + (Math.random() - 0.5) * spec.spread;
  s.bullets.push({
    pos: { x: p.pos.x + Math.cos(a) * 10, y: p.pos.y + Math.sin(a) * 10 },
    vel: { x: Math.cos(a) * BULLET_SPEED, y: Math.sin(a) * BULLET_SPEED },
    life: 0.7,
    fromPlayer: true,
  });
  scarePeds(s, p.pos, 160);
  playSound(s, "shot");
  if (p.ammo[p.weapon] <= 0) cycleWeapon(s);
};

export const updateBullets = (s: GameState, dt: number): void => {
  for (const b of s.bullets) {
    b.life -= dt;
    b.pos.x += b.vel.x * dt;
    b.pos.y += b.vel.y * dt;
    if (circleBlocked(s.map, b.pos, 1, blocksCars)) {
      b.life = 0;
      continue;
    }
    // I colpi della polizia non feriscono gli agenti
    const ped = s.peds.find(
      (q) =>
        q.state !== "dead" &&
        (b.fromPlayer || q.role !== "cop") &&
        dist(q.pos, b.pos) < PED_RADIUS + 2,
    );
    if (ped) {
      killPed(s, ped, b.fromPlayer);
      b.life = 0;
      continue;
    }
    const car = s.cars.find((c) => !c.dead && c !== s.player.car && dist(c.pos, b.pos) < 11);
    if (car && (b.fromPlayer || !car.police)) {
      car.health -= 9;
      if (b.fromPlayer && car.police) crime(s, 0.15);
      b.life = 0;
      continue;
    }
    if (!b.fromPlayer) {
      const target = s.player.car ?? s.player;
      if (dist(target.pos, b.pos) < (s.player.car ? 11 : PED_RADIUS + 2)) {
        if (s.player.car) s.player.car.health -= 7;
        else s.player.health -= 12;
        b.life = 0;
      }
    }
  }
  s.bullets = s.bullets.filter((b) => b.life > 0);
};

/** Raccolta delle armi a terra */
export const updatePickups = (s: GameState, dt: number): void => {
  for (const pk of s.pickups) {
    if (pk.respawn > 0) {
      pk.respawn -= dt;
      continue;
    }
    if (s.player.car || dist(pk.pos, s.player.pos) > 14) continue;
    s.player.ammo[pk.weapon] += pk.weapon === "smg" ? 120 : 30;
    s.player.weapon = pk.weapon;
    pk.respawn = 30;
    showMessage(s, `Raccolta: ${WEAPON_NAMES[pk.weapon]}`, 2);
  }
};
