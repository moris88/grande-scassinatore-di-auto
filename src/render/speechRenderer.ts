import { dist } from "../engine/math";
import type { Pedestrian } from "../entities/types";
import type { GameState } from "../game/state";

const FONT = "bold 6px monospace";
const CHAR_W = 3.7;

/** Nuvoletta bianca con la frase, sopra la testa del pedone */
const drawBubble = (g: CanvasRenderingContext2D, p: Pedestrian, text: string): void => {
  const w = Math.ceil(text.length * CHAR_W) + 6;
  const x = Math.round(p.pos.x - w / 2);
  const y = Math.round(p.pos.y - 22);
  g.fillStyle = "#000";
  g.fillRect(x - 1, y - 1, w + 2, 11);
  g.fillStyle = "#fff";
  g.fillRect(x, y, w, 9);
  g.fillRect(Math.round(p.pos.x) - 1, y + 9, 3, 3); // codina verso il pedone
  g.fillStyle = "#111";
  g.fillText(text, x + 3, y + 7);
};

/** Telefono all'orecchio (con indicatore che lampeggia) di chi chiama la polizia */
const drawPhone = (g: CanvasRenderingContext2D, p: Pedestrian, t: number): void => {
  g.fillStyle = "#111";
  g.fillRect(Math.round(p.pos.x) + 3, Math.round(p.pos.y) - 6, 3, 5);
  if (Math.floor(t * 4) % 2 === 0) {
    g.fillStyle = "#2ecc40";
    g.fillRect(Math.round(p.pos.x) + 4, Math.round(p.pos.y) - 5, 1, 1);
  }
};

/** Frasi e telefoni dei pedoni vicini alla camera (sopra i palazzi, per essere leggibili) */
export const drawPedSpeech = (g: CanvasRenderingContext2D, s: GameState): void => {
  g.font = FONT;
  for (const p of s.peds) {
    if (p.state === "dead" || dist(p.pos, s.camera.pos) > 700) continue;
    if (p.state === "call") drawPhone(g, p, s.time);
    if (p.speech) drawBubble(g, p, p.speech.text);
  }
};
