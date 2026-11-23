import { dist } from "../engine/math";
import { forwardSpeed } from "../entities/car";
import { type GameState, playSound, showMessage, stars } from "../game/state";
import { tileAtWorld } from "../world/cityMap";
import { Tile } from "../world/tiles";
import { playerHidden, playerPos, policeSeesPlayer } from "./policeVision";

const MAX_HEAT = 4.99;
/** Secondi di ricerca per ogni stella, dopo che la polizia ti ha perso di vista */
export const SEARCH_PER_STAR = 10;
/** Nascosto (parcheggio coperto, carrozzeria) il tempo di ricerca scorre più in fretta */
const HIDDEN_SPEEDUP = 2;
/** Cambiando veicolo (o vestiti) senza essere visto la ricerca si riduce a questi secondi */
const DISGUISE_TIME = 3;
const SPRAY_COST = 500;
const BANNER_TIME = 3;

export const addHeat = (s: GameState, amount: number): void => {
  const wasClean = stars(s) === 0;
  s.heat = Math.min(MAX_HEAT, s.heat + amount);
  // Primo reato: la polizia parte da dove l'hai commesso. I reati successivi alzano le stelle,
  // ma la ricerca riparte solo quando qualcuno ti vede.
  if (wasClean && stars(s) > 0) {
    s.lastSeen = { ...playerPos(s) };
    s.searchTime = stars(s) * SEARCH_PER_STAR;
  }
};

/** Un reato: se c'è una volante vicina conta il doppio */
export const crime = (s: GameState, amount: number): void => {
  const witnessed = s.cars.some((c) => c.police && !c.dead && dist(c.pos, playerPos(s)) < 320);
  addHeat(s, witnessed ? amount * 2 : amount);
};

/** Cambio di veicolo o di vestiti non visto: la polizia non ti riconosce più */
export const loseIdentity = (s: GameState): void => {
  if (stars(s) === 0 || s.seen) return;
  s.searchTime = Math.min(s.searchTime, DISGUISE_TIME);
  showMessage(s, "La polizia ha perso le tue tracce...", 2);
};

const clearWanted = (s: GameState): void => {
  s.heat = 0;
  s.searchTime = 0;
  s.lastSeen = null;
  s.seen = false;
  s.banner = { kind: "escaped", detail: "Inseguimento terminato", time: BANNER_TIME };
  playSound(s, "success");
};

/** Vista, ricerca e fine dell'inseguimento */
const updateSearch = (s: GameState, dt: number): void => {
  if (stars(s) === 0) {
    s.seen = false;
    return;
  }
  s.seen = policeSeesPlayer(s);
  if (s.seen) {
    s.lastSeen = { ...playerPos(s) };
    s.searchTime = stars(s) * SEARCH_PER_STAR;
    return;
  }
  s.searchTime -= dt * (playerHidden(s) ? HIDDEN_SPEEDUP : 1);
  if (s.searchTime <= 0) clearWanted(s);
};

export const updateWanted = (s: GameState, dt: number): void => {
  const p = s.player;
  updateSearch(s, dt);

  // Carrozzeria: riverniciatura e azzeramento del ricercato
  if (p.car && s.heat >= 1 && tileAtWorld(s.map, p.car.pos) === Tile.SprayShop) {
    if (s.money >= SPRAY_COST) {
      s.money -= SPRAY_COST;
      s.heat = 0;
      s.searchTime = 0;
      s.lastSeen = null;
      p.car.color = p.car.color === "#ecf0f1" ? "#2c3e50" : "#ecf0f1";
      showMessage(s, `Auto riverniciata! -$${SPRAY_COST}`);
    } else {
      showMessage(s, `Servono $${SPRAY_COST} per la riverniciatura`, 1);
    }
  }

  // Arresto: volante o agente fermi accanto al giocatore lento o a piedi
  if (stars(s) === 0) {
    s.bustTimer = 0;
    return;
  }
  const pos = playerPos(s);
  const slow = p.car ? Math.abs(forwardSpeed(p.car)) < 25 : true;
  const carClose = s.cars.some(
    (c) => c.police && c.driver === "ai" && !c.dead && dist(c.pos, pos) < (p.car ? 40 : 30),
  );
  const copClose = s.peds.some(
    (c) => c.role === "cop" && c.state !== "dead" && dist(c.pos, pos) < (p.car ? 24 : 14),
  );
  s.bustTimer = slow && (carClose || copClose) ? s.bustTimer + dt : Math.max(0, s.bustTimer - dt);
};

export const isBusted = (s: GameState): boolean => s.bustTimer > (s.player.car ? 1.5 : 0.6);
