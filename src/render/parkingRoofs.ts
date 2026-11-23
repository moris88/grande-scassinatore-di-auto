import { dist } from "../engine/math";
import type { GameState } from "../game/state";
import { PARKING_LOTS } from "../world/cityMap";
import { TILE } from "../world/tiles";

/** Tetti dei parcheggi coperti, disegnati sopra i veicoli: nascondono chi c'è dentro.
 * Se dentro c'è il giocatore il tetto diventa semitrasparente, così si vede. */
export const drawParkingRoofs = (g: CanvasRenderingContext2D, s: GameState): void => {
  const pl = s.player.car ? s.player.car.pos : s.player.pos;
  for (const lot of PARKING_LOTS) {
    if (!lot.covered) continue;
    const x = lot.x * TILE;
    const y = lot.y * TILE;
    const w = lot.w * TILE;
    const h = lot.h * TILE;
    if (dist({ x: x + w / 2, y: y + h / 2 }, s.camera.pos) > 900) continue;
    const inside = pl.x > x && pl.x < x + w && pl.y > y && pl.y < y + h;
    g.globalAlpha = inside ? 0.4 : 0.95;
    g.fillStyle = "#8a8578";
    g.fillRect(x, y, w, h);
    g.fillStyle = "#6f6a5e";
    for (let i = 8; i < w; i += 16) g.fillRect(x + i, y, 2, h);
    g.fillStyle = "#5b574d";
    g.fillRect(x, y, w, 3);
    g.fillRect(x, y + h - 3, w, 3);
    g.fillStyle = "#2e86c1";
    g.fillRect(x + w / 2 - 7, y + h / 2 - 7, 14, 14);
    g.fillStyle = "#fff";
    g.font = "bold 12px monospace";
    g.fillText("P", x + w / 2 - 4, y + h / 2 + 4);
    g.globalAlpha = 1;
  }
};
