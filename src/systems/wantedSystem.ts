import { dist } from "../engine/math";
import { forwardSpeed } from "../entities/car";
import { type GameState, showMessage, stars } from "../game/state";
import { tileAtWorld } from "../world/cityMap";
import { Tile } from "../world/tiles";

const MAX_HEAT = 4.99;
const COOLDOWN_PER_STAR = 14;
const SPRAY_COST = 500;

export const addHeat = (s: GameState, amount: number): void => {
  s.heat = Math.min(MAX_HEAT, s.heat + amount);
  s.heatCooldown = 0;
};

/** Un reato: se c'è una volante vicina conta il doppio */
export const crime = (s: GameState, amount: number): void => {
  const witnessed = s.cars.some((c) => c.police && !c.dead && dist(c.pos, s.player.pos) < 320);
  addHeat(s, witnessed ? amount * 2 : amount);
};

export const updateWanted = (s: GameState, dt: number): void => {
  const p = s.player;
  const pos = p.car ? p.car.pos : p.pos;
  const copsNear = s.cars.filter((c) => c.police && !c.dead && dist(c.pos, pos) < 360);

  // Il livello cala solo se nessuna volante ti vede
  if (s.heat > 0 && copsNear.length === 0) {
    s.heatCooldown += dt;
    if (s.heatCooldown > COOLDOWN_PER_STAR) {
      s.heat = Math.max(0, Math.ceil(s.heat) - 1.01);
      if (s.heat < 1) s.heat = 0;
      s.heatCooldown = 0;
    }
  }

  // Carrozzeria: riverniciatura e azzeramento del ricercato
  if (p.car && s.heat >= 1 && tileAtWorld(s.map, p.car.pos) === Tile.SprayShop) {
    if (s.money >= SPRAY_COST) {
      s.money -= SPRAY_COST;
      s.heat = 0;
      p.car.color = p.car.color === "#ecf0f1" ? "#2c3e50" : "#ecf0f1";
      showMessage(s, `Auto riverniciata! -$${SPRAY_COST}`);
    } else {
      showMessage(s, `Servono $${SPRAY_COST} per la riverniciatura`, 1);
    }
  }

  // Arresto: volante ferma accanto al giocatore lento o a piedi
  if (stars(s) === 0) {
    s.bustTimer = 0;
    return;
  }
  const slow = p.car ? Math.abs(forwardSpeed(p.car)) < 25 : true;
  const close = copsNear.some((c) => dist(c.pos, pos) < (p.car ? 40 : 30));
  s.bustTimer = slow && close ? s.bustTimer + dt : Math.max(0, s.bustTimer - dt);
};

export const isBusted = (s: GameState): boolean => s.bustTimer > (s.player.car ? 1.5 : 0.6);
