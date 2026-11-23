import type { Vec2 } from "../engine/math";
import type { Dir } from "../world/tiles";

export type WeaponKind = "fists" | "pistol" | "smg";

export interface Car {
  id: number;
  pos: Vec2;
  vel: Vec2;
  angle: number;
  angularVel: number;
  health: number;
  color: string;
  police: boolean;
  driver: "player" | "ai" | "none";
  /** Corsia attuale per l'IA del traffico */
  laneDir: Dir;
  /** Tile verso cui l'IA si sta dirigendo */
  aiTarget: Vec2 | null;
  /** Mossa successiva già pianificata (per rallentare e sterzare prima delle curve) */
  aiNext: { dir: Dir; tile: Vec2 } | null;
  /** Secondi in cui l'auto è rimasta bloccata (per lo sblocco IA) */
  stuckTime: number;
  reverseTime: number;
  /** Secondi in cui l'IA ignora gli ostacoli dopo un'attesa lunga */
  pushThroughTime: number;
  burnTime: number;
  sirenPhase: number;
  missionTag: boolean;
  dead: boolean;
}

export interface Pedestrian {
  id: number;
  pos: Vec2;
  angle: number;
  speed: number;
  color: string;
  state: "walk" | "flee" | "dead";
  target: Vec2 | null;
  fleeTime: number;
  walkPhase: number;
  missionTarget: boolean;
  deadTime: number;
  /** Salute (i pugni tolgono 50) */
  health: number;
}

export interface Player {
  pos: Vec2;
  angle: number;
  health: number;
  car: Car | null;
  weapon: WeaponKind;
  ammo: Record<WeaponKind, number>;
  fireCooldown: number;
  walkPhase: number;
  /** Secondi rimanenti dell'animazione del pugno */
  punchTime: number;
  /** Il prossimo/ultimo pugno è col braccio sinistro (si alternano) */
  punchLeft: boolean;
}

export interface Bullet {
  pos: Vec2;
  vel: Vec2;
  life: number;
  fromPlayer: boolean;
}

export interface Explosion {
  pos: Vec2;
  time: number;
}

export interface Pickup {
  pos: Vec2;
  weapon: "pistol" | "smg";
  respawn: number;
}
