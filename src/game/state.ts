import type { SoundEvent } from "../engine/audio";
import type { Camera } from "../engine/camera";
import type { Vec2 } from "../engine/math";
import type {
  Bullet,
  Car,
  Explosion,
  Fire,
  Helicopter,
  Pedestrian,
  Plane,
  Player,
  Train,
} from "../entities/types";
import type { CityMap, ShopKind } from "../world/cityMap";

export type MissionKind = "checkpoint" | "deliver" | "eliminate" | "escape";

export interface Mission {
  kind: MissionKind;
  title: string;
  /** Posizione dell'obiettivo corrente (in pixel) */
  target: Vec2;
  timeLeft: number;
  reward: number;
  stage: number;
  car: Car | null;
  ped: Pedestrian | null;
  /** Fuga dalla mafia: auto della mafia e ultimo punto in cui ti hanno visto */
  gang: Car[];
  gangLastSeen: Vec2 | null;
}

export interface GameState {
  map: CityMap;
  player: Player;
  cars: Car[];
  peds: Pedestrian[];
  bullets: Bullet[];
  explosions: Explosion[];
  /** Traffico aereo (solo grafico) */
  helis: Helicopter[];
  /** Aereo in volo (al massimo uno) */
  plane: Plane | null;
  /** Treno in transito (uno alla volta), secondi al prossimo e direzione del prossimo */
  train: Train | null;
  trainTimer: number;
  trainDir: 1 | -1;
  camera: Camera;
  /** Livello di ricercato continuo 0..4 (le stelle sono la parte intera arrotondata) */
  heat: number;
  /** La polizia ti vede in questo momento */
  seen: boolean;
  /** Ultima posizione in cui la polizia ti ha visto */
  lastSeen: Vec2 | null;
  /** Secondi di ricerca rimasti prima che la polizia rinunci (scorrono solo se non ti vede) */
  searchTime: number;
  money: number;
  multiplier: number;
  lives: number;
  mission: Mission | null;
  /** Cabina usata per ultima: non riattiva subito una missione */
  phoneCooldown: number;
  message: { text: string; time: number } | null;
  /** Schermata grande: missione compiuta o polizia seminata */
  banner: { kind: "success" | "escaped"; detail: string; time: number } | null;
  /** Negozio in cui si trova il giocatore (il mondo è fermo), con l'ultimo avviso */
  shop: { kind: ShopKind; notice: string; dealer: DealerConfig } | null;
  /** Intervento dell'ambulanza in corso (uno alla volta); treat = secondi di soccorso rimasti */
  ambulanceJob: { car: Car; ped: Pedestrian; treat: number; time: number } | null;
  /** Incendi in corso (rottami in fiamme) e interventi di pompieri e carro attrezzi */
  fires: Fire[];
  fireJob: { car: Car; fire: Fire; spray: number; time: number } | null;
  towJob: { car: Car; wreck: Car; hook: number; time: number } | null;
  /** Schermata "MORTO"/"ARRESTATO" prima del respawn */
  downTime: number;
  downReason: "wasted" | "busted" | null;
  gameOver: boolean;
  bustTimer: number;
  /** Il giocatore è dentro un garage con l'auto (la riverniciatura avviene una volta per ingresso) */
  inGarage: boolean;
  /** Verniciatura in corso nel garage: auto ferma, colore che passa da `from` a `to` */
  paintJob: { car: Car; from: string; to: string; time: number } | null;
  time: number;
  /** Suoni da riprodurre nel prossimo frame */
  sounds: SoundEvent[];
}

export const stars = (s: GameState): number => Math.min(4, Math.floor(s.heat));

export const playSound = (s: GameState, e: SoundEvent): void => {
  if (s.sounds.length < 16) s.sounds.push(e);
};

export const showMessage = (s: GameState, text: string, time = 3): void => {
  s.message = { text, time };
};

/** Configurazione scelta al concessionario prima dell'acquisto */
export interface DealerConfig {
  /** Indice nella lista dei colori disponibili */
  color: number;
  engine: boolean;
  armor: boolean;
  brakes: boolean;
}
