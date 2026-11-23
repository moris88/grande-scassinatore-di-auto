import type { Helicopter } from "../entities/types";
import type { GameState } from "../game/state";
import { cached, makeCanvas, shade } from "./sprites";

/** L'ombra a terra è spostata: l'elicottero vola in alto */
const SHADOW_OFFSET = 26;
const BLADE_LEN = 22;

/** Fusoliera vista dall'alto, muso verso destra (40×16) */
const heliBody = (color: string): HTMLCanvasElement =>
  cached(`heli:${color}`, () => {
    const [c, g] = makeCanvas(40, 16);
    const px = (x: number, y: number, w: number, h: number, col: string): void => {
      g.fillStyle = col;
      g.fillRect(x, y, w, h);
    };
    // Trave di coda, rotore di coda e pattini
    px(1, 7, 18, 2, shade(color, 0.7));
    px(0, 4, 2, 8, "#222");
    px(18, 1, 16, 1, "#333");
    px(18, 14, 16, 1, "#333");
    // Cabina con vetrata
    px(17, 3, 20, 10, "#151515");
    px(18, 4, 18, 8, color);
    px(18, 4, 18, 1, shade(color, 1.3));
    px(30, 5, 6, 6, "#5d8aa8");
    px(32, 6, 2, 2, "#a9d0ea");
    return c;
  });

const drawOne = (g: CanvasRenderingContext2D, h: Helicopter, shadow: boolean): void => {
  g.save();
  g.translate(
    Math.round(h.pos.x + (shadow ? SHADOW_OFFSET : 0)),
    Math.round(h.pos.y + (shadow ? SHADOW_OFFSET : 0)),
  );
  g.rotate(h.angle);
  if (shadow) {
    g.fillStyle = "rgba(0,0,0,0.3)";
    g.fillRect(-20, -5, 40, 10);
    g.beginPath();
    g.arc(6, 0, BLADE_LEN, 0, Math.PI * 2);
    g.fillStyle = "rgba(0,0,0,0.1)";
    g.fill();
  } else {
    const body = heliBody(h.color);
    g.drawImage(body, -body.width / 2, -body.height / 2);
    // Due pale del rotore principale che girano sopra la cabina
    g.strokeStyle = "rgba(30,30,30,0.85)";
    g.lineWidth = 2;
    g.beginPath();
    for (const off of [0, Math.PI / 2]) {
      const a = h.rotor + off;
      g.moveTo(6 - Math.cos(a) * BLADE_LEN, -Math.sin(a) * BLADE_LEN);
      g.lineTo(6 + Math.cos(a) * BLADE_LEN, Math.sin(a) * BLADE_LEN);
    }
    g.stroke();
    g.fillStyle = "#222";
    g.fillRect(4, -2, 4, 4);
  }
  g.restore();
};

/** Elicotteri sopra a tutto (prima le ombre a terra, poi i velivoli) */
export const drawHelicopters = (g: CanvasRenderingContext2D, s: GameState): void => {
  for (const h of s.helis) drawOne(g, h, true);
  for (const h of s.helis) drawOne(g, h, false);
};
