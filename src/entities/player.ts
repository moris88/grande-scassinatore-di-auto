import { PED_RADIUS, moveCircle } from "../engine/collision";
import type { Input } from "../engine/input";
import type { Vec2 } from "../engine/math";
import type { CityMap } from "../world/cityMap";
import { blocksPeds } from "../world/tiles";
import type { Player } from "./types";

const WALK_SPEED = 55;
/** Di corsa si è più veloci degli agenti a piedi (75), ma molto più lenti di un'auto */
const RUN_SPEED = 95;
const TURN_SPEED = 4.2;
export const MAX_STAMINA = 100;
/** Giacca di partenza del giocatore */
export const PLAYER_SHIRT = "#4a6b2a";
/** Consumo e recupero della barra della corsa (al secondo) */
const STAMINA_DRAIN = 25;
const STAMINA_REGEN = 15;
/** Dopo aver svuotato la barra si torna a correre solo oltre questa soglia */
const STAMINA_RECOVER = 30;

export const createPlayer = (pos: Vec2): Player => ({
  pos: { ...pos },
  angle: 0,
  health: 100,
  car: null,
  weapon: "fists",
  ammo: { fists: Number.POSITIVE_INFINITY, pistol: 0, smg: 0 },
  fireCooldown: 0,
  walkPhase: 0,
  punchTime: 0,
  punchLeft: false,
  transition: null,
  stamina: MAX_STAMINA,
  shirt: PLAYER_SHIRT,
  exhausted: false,
});

/** Movimento a piedi con controlli "a carro armato": sinistra/destra ruotano.
 * Shift + avanti = corsa, finché c'è fiato nella barra. */
export const updatePlayerOnFoot = (p: Player, input: Input, dt: number, map: CityMap): void => {
  p.angle += input.axisX() * TURN_SPEED * dt;
  const fwd = input.axisY();
  if (p.exhausted && p.stamina >= STAMINA_RECOVER) p.exhausted = false;
  const running = fwd > 0 && !p.exhausted && input.isDown("ShiftLeft", "ShiftRight");
  if (running) {
    p.stamina = Math.max(0, p.stamina - STAMINA_DRAIN * dt);
    if (p.stamina === 0) p.exhausted = true;
  } else {
    p.stamina = Math.min(MAX_STAMINA, p.stamina + STAMINA_REGEN * dt);
  }
  const speed = running ? RUN_SPEED : fwd > 0 ? WALK_SPEED : WALK_SPEED * 0.55;
  if (fwd !== 0) {
    const dx = Math.cos(p.angle) * speed * fwd * dt;
    const dy = Math.sin(p.angle) * speed * fwd * dt;
    moveCircle(map, p.pos, dx, dy, PED_RADIUS, blocksPeds);
    p.walkPhase += dt * (running ? 16 : 10);
  }
};
