import { VEHICLES } from "../entities/vehicles";
import { PAINT_TIME } from "../game/paintJob";
import type { GameState } from "../game/state";
import { hash } from "./mapRenderer";
import { vehicleSprite } from "./vehicleSprites";

const MIST_PUFFS = 10;

/** Verniciatura nel garage: il colore nuovo copre l'auto dal retro al muso, seguendo l'ugello,
 * con una nebbiolina di vernice attorno */
export const drawPaintJob = (g: CanvasRenderingContext2D, s: GameState): void => {
  const job = s.paintJob;
  if (!job) return;
  const car = job.car;
  const { len, wid } = VEHICLES[car.kind];
  const progress = Math.min(1, job.time / PAINT_TIME);
  const sweep = -len / 2 + len * progress;
  g.save();
  g.translate(Math.round(car.pos.x), Math.round(car.pos.y));
  g.rotate(car.angle);
  // Parte già verniciata: sprite col colore nuovo, ritagliato fino all'ugello
  g.save();
  g.beginPath();
  g.rect(-len / 2 - 1, -wid / 2 - 1, sweep + len / 2 + 1, wid + 2);
  g.clip();
  const fresh = vehicleSprite(car.kind, job.to, car.police, false);
  g.drawImage(fresh, -fresh.width / 2, -fresh.height / 2);
  g.restore();
  // Nebbiolina di vernice attorno all'ugello, che si allarga e svanisce
  for (let i = 0; i < MIST_PUFFS; i++) {
    const phase = (s.time * 3 + hash(i, 1)) % 1;
    const x = sweep + (hash(i, 2) - 0.5) * 10;
    const y = (hash(i, 3) - 0.5) * (wid + 14) * (0.5 + phase);
    g.globalAlpha = 0.5 * (1 - phase);
    g.fillStyle = job.to;
    const r = 2 + phase * 4;
    g.fillRect(x - r / 2, y - r / 2, r, r);
  }
  // Ugello della pistola a spruzzo, sopra l'auto
  g.globalAlpha = 1;
  g.fillStyle = "#222";
  g.fillRect(sweep - 2, -wid / 2 - 7, 4, 5);
  g.fillStyle = "#aaa";
  g.fillRect(sweep - 1, -wid / 2 - 3, 2, 3);
  g.restore();
};
