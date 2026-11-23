import type { Vec2 } from "../engine/math";
import type { Dir } from "../world/tiles";
import type { VehicleKind } from "./vehicles";

export type WeaponKind = "fists" | "pistol" | "smg";

export interface Car {
  id: number;
  pos: Vec2;
  vel: Vec2;
  angle: number;
  angularVel: number;
  health: number;
  color: string;
  kind: VehicleKind;
  police: boolean;
  driver: "player" | "ai" | "none";
  /** Percorso sulle corsie da seguire (ambulanze, volanti in ricerca); null = giro libero */
  route: Vec2[] | null;
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
  /** Civile oppure agente di polizia a piedi */
  role: "civil" | "cop";
  /** Secondi prima del prossimo colpo (solo agenti) */
  shootCooldown: number;
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
  /** Animazione di entrata/uscita dall'auto in corso (comandi bloccati) */
  transition: CarTransition | null;
}

export interface CarTransition {
  kind: "enter" | "exit";
  car: Car;
  /** Tappe da raggiungere, in coordinate locali dell'auto (x avanti, y a destra) */
  path: Vec2[];
  /** Indici delle tappe in cui si scivola sul cofano (giocatore disegnato sopra l'auto) */
  slideSteps: number[];
  /** Secondi trascorsi nella fase finale "sale in auto" (0 finché cammina) */
  getIn: number;
}

/** Elicottero del traffico aereo: vola sopra la città, non collide con niente */
export interface Helicopter {
  pos: Vec2;
  vel: Vec2;
  angle: number;
  /** Angolo del rotore (gira continuamente) */
  rotor: number;
  color: string;
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
