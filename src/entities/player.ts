import { PED_RADIUS, moveCircle } from "../engine/collision";
import type { Input } from "../engine/input";
import type { Vec2 } from "../engine/math";
import type { CityMap } from "../world/cityMap";
import { blocksPeds } from "../world/tiles";
import type { Player } from "./types";

const WALK_SPEED = 95;
const TURN_SPEED = 4.2;

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
});

/** Movimento a piedi con controlli "a carro armato": sinistra/destra ruotano */
export const updatePlayerOnFoot = (p: Player, input: Input, dt: number, map: CityMap): void => {
  p.angle += input.axisX() * TURN_SPEED * dt;
  const fwd = input.axisY();
  const speed = fwd > 0 ? WALK_SPEED : WALK_SPEED * 0.55;
  if (fwd !== 0) {
    const dx = Math.cos(p.angle) * speed * fwd * dt;
    const dy = Math.sin(p.angle) * speed * fwd * dt;
    moveCircle(map, p.pos, dx, dy, PED_RADIUS, blocksPeds);
    p.walkPhase += dt * 10;
  }
};
