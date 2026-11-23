import { GET_IN_TIME, isSliding } from "../game/carTransition";
import type { GameState } from "../game/state";
import { deadPedSprite, pedSprite, punchSprite } from "./sprites";

const PLAYER_SHIRT = "#4a6b2a";
/** Sul cofano il giocatore appare un po' più grande (è più in alto) */
const SLIDE_SCALE = 1.25;

/** Giocatore a piedi: `onTop` = passata disegnata sopra i veicoli (solo durante la scivolata) */
export const drawPlayer = (g: CanvasRenderingContext2D, s: GameState, onTop: boolean): void => {
  const pl = s.player;
  if (pl.car) return;
  if (s.downReason) {
    if (s.downReason === "wasted" && !onTop) drawScaled(g, deadPedSprite(PLAYER_SHIRT), s, 1);
    return;
  }
  const sliding = isSliding(s);
  if (sliding !== onTop) return;
  const tr = pl.transition;
  // Mentre sale in auto si rimpicciolisce fino a sparire nell'abitacolo
  const scale = sliding ? SLIDE_SCALE : tr && tr.getIn > 0 ? 1 - (tr.getIn / GET_IN_TIME) * 0.7 : 1;
  const sprite =
    pl.punchTime > 0
      ? punchSprite(PLAYER_SHIRT, pl.punchLeft)
      : pedSprite(PLAYER_SHIRT, Math.floor(pl.walkPhase) % 2);
  drawScaled(g, sprite, s, scale);
};

const drawScaled = (
  g: CanvasRenderingContext2D,
  img: HTMLCanvasElement,
  s: GameState,
  scale: number,
): void => {
  const { pos, angle } = s.player;
  g.save();
  g.translate(Math.round(pos.x), Math.round(pos.y));
  g.rotate(angle);
  g.scale(scale, scale);
  g.drawImage(img, -img.width / 2, -img.height / 2);
  g.restore();
};
