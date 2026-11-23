import { dist, pick } from "../engine/math";
import { CIVIL_COLORS, forwardSpeed } from "../entities/car";
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
/** Riverniciatura: da ricercato costa di più ma azzera l'inseguimento */
const SPRAY_COST_WANTED = 500;
const SPRAY_COST = 100;
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

/** Garage: entrando con l'auto la si riverniscia di un colore nuovo (una volta per ingresso);
 * da ricercato costa di più ma la polizia perde le tracce */
const updateGarage = (s: GameState): void => {
  const car = s.player.car;
  const inside = car !== null && tileAtWorld(s.map, car.pos) === Tile.SprayShop;
  if (!inside || s.inGarage) {
    s.inGarage = inside;
    return;
  }
  s.inGarage = true;
  const wanted = stars(s) > 0;
  const cost = wanted ? SPRAY_COST_WANTED : SPRAY_COST;
  if (s.money < cost) {
    showMessage(s, `Servono $${cost} per la riverniciatura`, 2);
    return;
  }
  s.money -= cost;
  car.color = pick(CIVIL_COLORS.filter((c) => c !== car.color));
  if (wanted) {
    s.heat = 0;
    s.searchTime = 0;
    s.lastSeen = null;
  }
  showMessage(s, `Auto riverniciata! -$${cost}${wanted ? " · la polizia ti ha perso" : ""}`);
};

export const updateWanted = (s: GameState, dt: number): void => {
  const p = s.player;
  updateSearch(s, dt);

  updateGarage(s);

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
