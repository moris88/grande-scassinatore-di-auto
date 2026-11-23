import type { Car } from "../entities/types";
import type { GameState } from "./state";

/** Durata della verniciatura nel garage */
export const PAINT_TIME = 1.5;

/** Avvia la verniciatura: il colore nuovo viene steso man mano, dal retro al muso */
export const startPaint = (s: GameState, car: Car, to: string): void => {
  s.paintJob = { car, from: car.color, to, time: 0 };
};

/** Avanza la verniciatura; a fine lavoro l'auto prende il colore nuovo */
export const updatePaint = (s: GameState, dt: number): void => {
  const job = s.paintJob;
  if (!job) return;
  job.time += dt;
  if (job.time < PAINT_TIME && s.cars.includes(job.car)) return;
  job.car.color = job.to;
  s.paintJob = null;
};

/** L'auto è ferma in verniciatura (il giocatore non può guidarla) */
export const isBeingPainted = (s: GameState, car: Car): boolean => s.paintJob?.car === car;
