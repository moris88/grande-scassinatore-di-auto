import type { SoundEvent } from "../engine/audio";
import type { Camera } from "../engine/camera";
import type { Vec2 } from "../engine/math";
import type { Bullet, Car, Explosion, Pedestrian, Pickup, Player } from "../entities/types";
import type { CityMap } from "../world/cityMap";

export type MissionKind = "checkpoint" | "deliver" | "eliminate";

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
}

export interface GameState {
  map: CityMap;
  player: Player;
  cars: Car[];
  peds: Pedestrian[];
  bullets: Bullet[];
  explosions: Explosion[];
  pickups: Pickup[];
  camera: Camera;
  /** Livello di ricercato continuo 0..4 (le stelle sono la parte intera arrotondata) */
  heat: number;
  heatCooldown: number;
  money: number;
  multiplier: number;
  lives: number;
  mission: Mission | null;
  /** Cabina usata per ultima: non riattiva subito una missione */
  phoneCooldown: number;
  message: { text: string; time: number } | null;
  /** Schermata grande "MISSIONE COMPIUTA" (ricompensa e secondi rimanenti) */
  successBanner: { reward: number; time: number } | null;
  /** Schermata "MORTO"/"ARRESTATO" prima del respawn */
  downTime: number;
  downReason: "wasted" | "busted" | null;
  gameOver: boolean;
  bustTimer: number;
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
