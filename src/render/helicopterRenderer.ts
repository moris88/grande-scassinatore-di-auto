import type { Helicopter, Plane } from "../entities/types";
import type { GameState } from "../game/state";
import { cached, makeCanvas, shade } from "./sprites";

/** L'ombra a terra è spostata: l'elicottero vola in alto */
const SHADOW_OFFSET = 26;
const BLADE_LEN = 22;
/** L'aereo vola molto più in alto: ombra molto più spostata */
const PLANE_SHADOW_OFFSET = 70;

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

/** Aereo visto dall'alto (muso verso destra): fusoliera, ali e coda; `shadow` = sagoma scura */
const drawPlane = (g: CanvasRenderingContext2D, p: Plane, shadow: boolean): void => {
  const off = shadow ? PLANE_SHADOW_OFFSET : 0;
  g.save();
  g.translate(Math.round(p.pos.x + off), Math.round(p.pos.y + off));
  g.rotate(p.angle);
  const body = shadow ? "rgba(0,0,0,0.25)" : "#ecf0f1";
  const wing = shadow ? "rgba(0,0,0,0.25)" : "#bdc3c7";
  g.fillStyle = wing;
  g.fillRect(-6, -30, 14, 60); // ali
  g.fillRect(-28, -12, 7, 24); // impennaggio di coda
  g.fillStyle = body;
  g.fillRect(-30, -5, 60, 10); // fusoliera
  if (!shadow) {
    g.fillStyle = "#2e86c1";
    g.fillRect(24, -4, 6, 8); // muso
    g.fillStyle = "#5d8aa8";
    for (let x = -18; x < 20; x += 5) g.fillRect(x, -4, 2, 1);
    g.fillStyle = "#e74c3c";
    g.fillRect(-2, -30, 3, 3); // luci di posizione
    g.fillStyle = "#2ecc40";
    g.fillRect(-2, 27, 3, 3);
  }
  g.restore();
};

/** Velivoli sopra a tutto (prima le ombre a terra, poi elicotteri e aereo) */
export const drawHelicopters = (g: CanvasRenderingContext2D, s: GameState): void => {
  for (const h of s.helis) drawOne(g, h, true);
  if (s.plane) drawPlane(g, s.plane, true);
  for (const h of s.helis) drawOne(g, h, false);
  if (s.plane) drawPlane(g, s.plane, false);
};
