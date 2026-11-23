import type { Train } from "../entities/types";
import type { GameState } from "../game/state";
import { TRAIN_HALF_W, WAGON_GAP, WAGON_LEN, crossingClosed } from "../systems/trainSystem";
import { RAIL_ROW, RAIL_Y, crossingColumns } from "../world/railway";
import { TILE } from "../world/tiles";

const W = TRAIN_HALF_W * 2;

/** Una carrozza tra x0 e x0 + WAGON_LEN; `front` = lato del muso per la locomotiva */
const drawWagon = (g: CanvasRenderingContext2D, x0: number, loco: boolean, front: 1 | -1): void => {
  const y0 = RAIL_Y - TRAIN_HALF_W;
  g.fillStyle = "rgba(0,0,0,0.3)";
  g.fillRect(x0 + 3, y0 + 3, WAGON_LEN, W);
  g.fillStyle = "#151515";
  g.fillRect(x0, y0, WAGON_LEN, W);
  g.fillStyle = loco ? "#c0392b" : "#7f8c8d";
  g.fillRect(x0 + 1, y0 + 1, WAGON_LEN - 2, W - 2);
  g.fillStyle = loco ? "#e74c3c" : "#95a5a6";
  g.fillRect(x0 + 1, y0 + 1, WAGON_LEN - 2, 2);
  if (loco) {
    // Muso giallo e cabina di guida col parabrezza
    const nose = front > 0 ? x0 + WAGON_LEN - 6 : x0 + 1;
    g.fillStyle = "#f1c40f";
    g.fillRect(nose, y0 + 1, 5, W - 2);
    g.fillStyle = "#5d8aa8";
    g.fillRect(front > 0 ? nose - 5 : nose + 5, y0 + 4, 3, W - 8);
    g.fillStyle = "#555";
    g.fillRect(x0 + 14, y0 + 6, 12, W - 12);
  } else {
    g.fillStyle = "#34495e";
    for (let x = x0 + 4; x < x0 + WAGON_LEN - 4; x += 7) {
      g.fillRect(x, y0 + 2, 4, 2);
      g.fillRect(x, y0 + W - 4, 4, 2);
    }
  }
};

const drawTrain = (g: CanvasRenderingContext2D, t: Train): void => {
  for (let i = 0; i < t.wagons; i++) {
    const back = t.head - t.dir * i * (WAGON_LEN + WAGON_GAP);
    const x0 = t.dir > 0 ? back - WAGON_LEN : back;
    drawWagon(g, x0, i === 0, t.dir);
  }
};

/** Sbarre abbassate e luci rosse lampeggianti sui passaggi a livello chiusi */
const drawCrossings = (g: CanvasRenderingContext2D, s: GameState): void => {
  const blink = Math.floor(s.time * 4) % 2 === 0;
  for (const col of crossingColumns(s.map)) {
    if (!crossingClosed(s, col)) continue;
    const x = col * TILE;
    for (const y of [RAIL_ROW * TILE - 5, (RAIL_ROW + 1) * TILE + 2]) {
      for (let i = 0; i < TILE; i += 8) {
        g.fillStyle = (i / 8) % 2 === 0 ? "#f5f5f5" : "#d63031";
        g.fillRect(x + i, y, 8, 3);
      }
      g.fillStyle = blink ? "#ff2b2b" : "#5a0a0a";
      g.fillRect(x + TILE / 2 - 2, y - 1, 4, 5);
    }
  }
};

/** Treno e passaggi a livello (sopra i veicoli, sotto gli elicotteri) */
export const drawRailway = (g: CanvasRenderingContext2D, s: GameState): void => {
  drawCrossings(g, s);
  if (s.train) drawTrain(g, s.train);
};
