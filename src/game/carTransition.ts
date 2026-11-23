import { PED_RADIUS, circleBlocked } from "../engine/collision";
import { type Vec2, angleTo, dist } from "../engine/math";
import { exitPoint } from "../entities/car";
import { createPed } from "../entities/pedestrian";
import type { Car } from "../entities/types";
import { VEHICLES } from "../entities/vehicles";
import { LINES, reactToCrime, say } from "../systems/pedReactions";
import { crime, loseIdentity } from "../systems/wantedSystem";
import { blocksPeds } from "../world/tiles";
import { sellCar } from "./carSales";
import { type GameState, showMessage } from "./state";

/** Velocità a piedi verso la portiera e durante la scivolata sul cofano */
const WALK_TO_DOOR = 110;
const SLIDE_SPEED = 140;
/** Uscendo ci si sposta dall'abitacolo alla portiera in fretta */
const EXIT_SPEED = 160;
/** Durata della fase "sale in auto" */
export const GET_IN_TIME = 0.2;
/** Se l'auto si allontana così tanto l'entrata viene annullata */
const ABORT_DIST = 80;

/** Da coordinate locali dell'auto (x avanti, y a destra) a coordinate del mondo */
export const carLocalToWorld = (car: Car, p: Vec2): Vec2 => {
  const c = Math.cos(car.angle);
  const s = Math.sin(car.angle);
  return { x: car.pos.x + p.x * c - p.y * s, y: car.pos.y + p.x * s + p.y * c };
};

/** Distanza massima per avviare l'entrata (cresce con la lunghezza del veicolo) */
export const enterRange = (car: Car): number => VEHICLES[car.kind].len / 2 + 18;

/** Inizia ad andare verso la portiera del guidatore (sinistra); dal lato destro si scivola
 * sul cofano */
export const startEnter = (s: GameState, car: Car): void => {
  const { len, wid } = VEHICLES[car.kind];
  const door = { x: -len / 4, y: -(wid / 2 + 9) };
  const dx = s.player.pos.x - car.pos.x;
  const dy = s.player.pos.y - car.pos.y;
  const right = -dx * Math.sin(car.angle) + dy * Math.cos(car.angle) > 0;
  const path = right
    ? [{ x: len / 4, y: wid / 2 + 6 }, { x: len / 4, y: -(wid / 2 + 6) }, door]
    : [door];
  s.player.transition = { kind: "enter", car, path, slideSteps: right ? [1] : [], getIn: 0 };
};

/** Esce dall'abitacolo verso la portiera libera (sinistra, o destra se c'è un muro) */
export const startExit = (s: GameState, car: Car): boolean => {
  const left = exitPoint(car);
  const rightSide = { x: 2 * car.pos.x - left.x, y: 2 * car.pos.y - left.y };
  const free = (q: Vec2): boolean => !circleBlocked(s.map, q, PED_RADIUS, blocksPeds);
  if (!free(left) && !free(rightSide)) return false;
  const { len, wid } = VEHICLES[car.kind];
  const sign = free(left) ? -1 : 1;
  car.driver = "none";
  s.player.car = null;
  s.player.pos = carLocalToWorld(car, { x: -len / 4, y: (sign * wid) / 4 });
  s.player.angle = car.angle;
  s.player.transition = {
    kind: "exit",
    car,
    path: [{ x: -len / 4, y: sign * (wid / 2 + 9) }],
    slideSteps: [],
    getIn: 0,
  };
  return true;
};

/** Il giocatore prende posto: l'eventuale autista viene buttato fuori */
const takeSeat = (s: GameState, car: Car): void => {
  // Cambiare veicolo senza essere visto fa perdere le tracce alla polizia
  loseIdentity(s);
  if (car.driver === "ai") {
    const ped = createPed(exitPoint(car));
    ped.state = "flee";
    ped.fleeTime = 4;
    s.peds.push(ped);
    say(ped, LINES.jacked, true);
    reactToCrime(s, car.pos, ped);
    crime(s, car.police ? 1 : 0.1);
  }
  car.driver = "player";
  s.player.car = car;
  if (car.police) showMessage(s, "Hai rubato una volante!", 2);
};

/** Avanza l'animazione; ritorna true finché è in corso (comandi bloccati) */
export const updateTransition = (s: GameState, dt: number): boolean => {
  const pl = s.player;
  const tr = pl.transition;
  if (!tr) return false;
  const car = tr.car;
  const lost = car.dead || car.health <= 0 || !s.cars.includes(car);
  if (tr.kind === "enter" && (lost || dist(pl.pos, car.pos) > ABORT_DIST)) {
    pl.transition = null;
    return false;
  }
  if (tr.path.length === 0) {
    if (tr.kind === "exit") {
      pl.transition = null;
      // Scendendo in un garage o davanti al concessionario l'auto si vende
      sellCar(s, car);
      return false;
    }
    tr.getIn += dt;
    if (tr.getIn >= GET_IN_TIME) {
      pl.transition = null;
      takeSeat(s, car);
    }
    return true;
  }
  const sliding = tr.slideSteps.includes(0);
  const speed = tr.kind === "exit" ? EXIT_SPEED : sliding ? SLIDE_SPEED : WALK_TO_DOOR;
  const target = carLocalToWorld(car, tr.path[0]);
  const d = dist(pl.pos, target);
  const step = speed * dt;
  if (d <= step) {
    pl.pos = target;
    tr.path.shift();
    tr.slideSteps = tr.slideSteps.map((i) => i - 1).filter((i) => i >= 0);
  } else {
    pl.angle = angleTo(pl.pos, target);
    pl.pos = { x: pl.pos.x + Math.cos(pl.angle) * step, y: pl.pos.y + Math.sin(pl.angle) * step };
    pl.walkPhase += dt * 12;
  }
  return true;
};

/** Sta scivolando sul cofano (va disegnato sopra le auto) */
export const isSliding = (s: GameState): boolean =>
  s.player.transition?.slideSteps.includes(0) ?? false;
