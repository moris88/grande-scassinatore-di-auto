import { dist } from "../engine/math";
import type { Fire } from "../entities/types";
import type { GameState } from "../game/state";

const FLAMES = 7;

/** Fiamme tremolanti (dal rosso al giallo) e fumo che sale; più piccole se l'incendio cala */
const drawFire = (g: CanvasRenderingContext2D, f: Fire, t: number): void => {
  const k = Math.max(0.2, f.strength);
  for (let i = 0; i < FLAMES; i++) {
    const phase = t * 9 + i * 1.7;
    const x = f.pos.x + Math.sin(phase) * 7 * k + (i - FLAMES / 2) * 2;
    const h = (8 + Math.sin(phase * 1.3) * 4) * k;
    const y = f.pos.y - h / 2;
    g.fillStyle = i % 3 === 0 ? "#ffd23f" : i % 3 === 1 ? "#ff8c1a" : "#e8401c";
    g.fillRect(Math.round(x - 2), Math.round(y), 4, Math.round(h));
  }
  // Fumo: sbuffi grigi che salgono e svaniscono
  for (let i = 0; i < 3; i++) {
    const p = (t * 0.6 + i / 3) % 1;
    g.fillStyle = `rgba(70,70,70,${0.45 * (1 - p) * k})`;
    const r = 4 + p * 8;
    g.fillRect(f.pos.x - r / 2 + Math.sin(t + i) * 4, f.pos.y - 10 - p * 30 - r / 2, r, r);
  }
};

/** Getto d'acqua dal camion dei pompieri verso il fuoco, con vapore */
const drawSpray = (g: CanvasRenderingContext2D, s: GameState): void => {
  const job = s.fireJob;
  if (!job || job.spray <= 0) return;
  const a = job.car.pos;
  const b = job.fire.pos;
  const n = Math.ceil(dist(a, b) / 6);
  for (let i = 0; i < n; i++) {
    const p = (i / n + s.time * 3) % 1;
    g.fillStyle = i % 2 ? "#7fd4ff" : "#d6f2ff";
    g.fillRect(
      a.x + (b.x - a.x) * p - 1.5,
      a.y + (b.y - a.y) * p - 1.5 + Math.sin(p * Math.PI) * -8,
      3,
      3,
    );
  }
  for (let i = 0; i < 4; i++) {
    const p = (s.time * 1.5 + i / 4) % 1;
    g.fillStyle = `rgba(235,235,235,${0.6 * (1 - p)})`;
    g.fillRect(b.x - 4 + Math.sin(i * 2 + s.time) * 6, b.y - 6 - p * 20, 8, 8);
  }
};

export const drawFires = (g: CanvasRenderingContext2D, s: GameState): void => {
  for (const f of s.fires) if (dist(f.pos, s.camera.pos) < 900) drawFire(g, f, s.time);
  drawSpray(g, s);
};
