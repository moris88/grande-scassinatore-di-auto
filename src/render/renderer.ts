import { type Vec2, angleTo, dist } from "../engine/math";
import type { Car } from "../entities/types";
import { type GameState, stars } from "../game/state";
import { PHONE_BOOTHS, tileCenter } from "../world/cityMap";
import { dirVector } from "../world/tiles";
import { lightFor, stopLines } from "../world/trafficLights";
import { drawMinimap } from "./minimap";
import { carSprite, deadPedSprite, pedSprite, pickupSprite, punchSprite } from "./sprites";

const drawRotated = (
  g: CanvasRenderingContext2D,
  img: HTMLCanvasElement,
  pos: Vec2,
  angle: number,
): void => {
  g.save();
  g.translate(Math.round(pos.x), Math.round(pos.y));
  g.rotate(angle);
  g.drawImage(img, -img.width / 2, -img.height / 2);
  g.restore();
};

const drawCar = (g: CanvasRenderingContext2D, s: GameState, car: Car): void => {
  drawRotated(g, carSprite(car.color, car.police, car.dead), car.pos, car.angle);
  if (car.dead) return;
  // Sirene lampeggianti durante l'inseguimento
  if (car.police && stars(s) > 0) {
    const on = Math.floor(s.time * 8) % 2 === 0;
    g.save();
    g.translate(car.pos.x, car.pos.y);
    g.rotate(car.angle);
    g.fillStyle = on ? "rgba(255,40,40,0.55)" : "rgba(60,120,255,0.55)";
    g.beginPath();
    g.arc(-1, on ? -4 : 4, 7, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
  // Fumo e fiamme
  if (car.health < 40) {
    const t = s.time * 3 + car.id;
    g.fillStyle =
      car.health <= 0 ? (Math.floor(t * 4) % 2 ? "#ff8c1a" : "#ffd23f") : "rgba(90,90,90,0.6)";
    for (let i = 0; i < 3; i++) {
      const r = 3 + ((t + i) % 1) * 4;
      g.fillRect(
        car.pos.x + Math.cos(car.angle) * 8 + Math.sin(t + i * 2) * 3 - r / 2,
        car.pos.y + Math.sin(car.angle) * 8 - ((t + i) % 1) * 10 - r / 2,
        r,
        r,
      );
    }
  }
};

/** Freccia gialla attorno al giocatore che punta all'obiettivo */
const drawMissionArrow = (g: CanvasRenderingContext2D, s: GameState, from: Vec2): void => {
  const m = s.mission;
  if (!m) return;
  const pulse = 1 + Math.sin(s.time * 6) * 0.15;
  g.strokeStyle = "#ffe600";
  g.lineWidth = 2;
  g.beginPath();
  g.arc(m.target.x, m.target.y, 14 * pulse, 0, Math.PI * 2);
  g.stroke();
  if (dist(from, m.target) < 90) return;
  const a = angleTo(from, m.target);
  g.save();
  g.translate(from.x + Math.cos(a) * 32, from.y + Math.sin(a) * 32);
  g.rotate(a);
  g.fillStyle = "#ffe600";
  g.strokeStyle = "#000";
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(8, 0);
  g.lineTo(-5, -6);
  g.lineTo(-2, 0);
  g.lineTo(-5, 6);
  g.closePath();
  g.fill();
  g.stroke();
  g.restore();
};

const LIGHT_COLORS = { green: "#2ecc40", yellow: "#ffdc00", red: "#ff2b2b" };

/** Linee di arresto e semafori vicino alla camera */
const drawTrafficLights = (g: CanvasRenderingContext2D, s: GameState): void => {
  for (const sl of stopLines(s.map)) {
    const c = tileCenter(sl.tile);
    if (dist(c, s.camera.pos) > 700) continue;
    const v = dirVector(sl.dir);
    const r = { x: -v.y, y: v.x };
    // Linea bianca di arresto sul bordo verso l'incrocio
    g.fillStyle = "#e8e8e8";
    const lx = c.x + v.x * 14 - r.x * 14;
    const ly = c.y + v.y * 14 - r.y * 14;
    g.fillRect(
      Math.min(lx, lx + r.x * 28),
      Math.min(ly, ly + r.y * 28),
      v.x ? 2 : 28,
      v.y ? 2 : 28,
    );
    // Semaforo sul marciapiede a destra
    const px = Math.round(c.x + v.x * 14 + r.x * 21);
    const py = Math.round(c.y + v.y * 14 + r.y * 21);
    g.fillStyle = "#111";
    g.fillRect(px - 3, py - 3, 6, 6);
    g.fillStyle = LIGHT_COLORS[lightFor(sl.dir, s.time)];
    g.fillRect(px - 2, py - 2, 4, 4);
  }
};

export const renderGame = (
  g: CanvasRenderingContext2D,
  s: GameState,
  mapCanvas: HTMLCanvasElement,
): void => {
  const { width, height } = g.canvas;
  const cam = s.camera;
  g.imageSmoothingEnabled = false;
  g.fillStyle = "#1f4e79";
  g.fillRect(0, 0, width, height);
  g.save();
  g.translate(Math.round(width / 2), Math.round(height / 2));
  g.scale(cam.zoom, cam.zoom);
  g.translate(-Math.round(cam.pos.x), -Math.round(cam.pos.y));

  // Solo la parte di mappa visibile
  const hw = width / 2 / cam.zoom + 2;
  const hh = height / 2 / cam.zoom + 2;
  const sx = Math.max(0, Math.floor(cam.pos.x - hw));
  const sy = Math.max(0, Math.floor(cam.pos.y - hh));
  const sw = Math.min(mapCanvas.width - sx, Math.ceil(hw * 2));
  const sh = Math.min(mapCanvas.height - sy, Math.ceil(hh * 2));
  if (sw > 0 && sh > 0) g.drawImage(mapCanvas, sx, sy, sw, sh, sx, sy, sw, sh);

  drawTrafficLights(g, s);

  // Cabine attive: lampada sul tetto accesa a intermittenza con alone che pulsa
  if (!s.mission && Math.floor(s.time * 2) % 2 === 0) {
    const pulse = (s.time * 2) % 1;
    for (const b of PHONE_BOOTHS) {
      const c = tileCenter(b);
      g.fillStyle = `rgba(255,230,0,${0.45 * (1 - pulse)})`;
      g.beginPath();
      g.arc(c.x, c.y, 8 + pulse * 14, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#ffe600";
      g.fillRect(c.x - 2, c.y - 2, 4, 4);
    }
  }

  for (const pk of s.pickups)
    if (pk.respawn <= 0) drawRotated(g, pickupSprite(pk.weapon), pk.pos, 0);
  for (const p of s.peds)
    if (p.state === "dead") drawRotated(g, deadPedSprite(p.color), p.pos, p.angle);
  for (const c of s.cars) if (c.dead) drawCar(g, s, c);
  for (const p of s.peds)
    if (p.state !== "dead")
      drawRotated(g, pedSprite(p.color, Math.floor(p.walkPhase) % 2), p.pos, p.angle);

  const pl = s.player;
  if (!pl.car && !s.downReason) {
    const sprite =
      pl.punchTime > 0
        ? punchSprite("#4a6b2a", pl.punchLeft)
        : pedSprite("#4a6b2a", Math.floor(pl.walkPhase) % 2);
    drawRotated(g, sprite, pl.pos, pl.angle);
  }
  if (!pl.car && s.downReason === "wasted")
    drawRotated(g, deadPedSprite("#4a6b2a"), pl.pos, pl.angle);
  for (const c of s.cars) if (!c.dead) drawCar(g, s, c);

  g.fillStyle = "#ffe98a";
  for (const b of s.bullets) g.fillRect(b.pos.x - 1, b.pos.y - 1, 2, 2);
  for (const e of s.explosions) {
    const r = 10 + e.time * 70;
    g.fillStyle = `rgba(255,${Math.floor(200 - e.time * 200)},40,${1 - e.time})`;
    g.beginPath();
    g.arc(e.pos.x, e.pos.y, r, 0, Math.PI * 2);
    g.fill();
  }
  if (!s.downReason) drawMissionArrow(g, s, pl.car ? pl.car.pos : pl.pos);
  g.restore();
  drawMinimap(g, s);
};
