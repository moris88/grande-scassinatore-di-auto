import { type Vec2, angleTo, dist, pick } from "../engine/math";
import { forwardSpeed } from "../entities/car";
import type { Pedestrian } from "../entities/types";
import { type GameState, stars } from "../game/state";
import { hasSiren } from "./trafficAi";

const SPEECH_TIME = 2.2;
const SPEECH_COOLDOWN = 6;
/** Raggio in cui i passanti notano un reato o un incidente */
const NOTICE_RADIUS = 160;
const WATCH_TIME = 4;
/** Secondi al telefono prima che la chiamata alla polizia vada a segno */
export const CALL_TIME = 3;

export const LINES = {
  greet: ["Ciao!", "Buongiorno!", "Bella giornata!", "Salve!"],
  armed: ["Non sparare!", "Metti giù quell'arma!", "Ti prego, no!"],
  hit: ["Ahi!", "Aiuto!", "Ma sei matto?!", "Basta!"],
  nearMiss: ["Guarda dove vai!", "Pirata della strada!", "Ehi! Rallenta!"],
  jacked: ["La mia auto!", "Ladro!", "Fermatelo!"],
  call: ["Pronto, polizia?!", "Venite subito!"],
  watch: ["Che è successo?", "Oh no...", "Guarda là!"],
} as const;

/** Fa dire una frase al pedone (se non ha appena parlato, salvo `force`) */
export const say = (p: Pedestrian, lines: readonly string[], force = false): void => {
  if (p.state === "dead" || (!force && p.speechCooldown > 0)) return;
  p.speech = { text: pick([...lines]), time: SPEECH_TIME };
  p.speechCooldown = SPEECH_COOLDOWN;
};

const flee = (p: Pedestrian, from: Vec2): void => {
  p.state = "flee";
  p.fleeTime = 3 + Math.random() * 2;
  p.angle = angleTo(from, p.pos);
};

const watch = (p: Pedestrian, at: Vec2, time = WATCH_TIME): void => {
  p.state = "watch";
  p.lookAt = { ...at };
  p.reactTime = time;
};

/** Reato commesso dal giocatore: la maggior parte scappa, qualcuno guarda,
 * qualcuno chiama la polizia */
export const reactToCrime = (s: GameState, at: Vec2): void => {
  for (const p of s.peds) {
    if (p.role === "cop" || p.state === "dead" || p.state === "call") continue;
    if (dist(p.pos, at) > NOTICE_RADIUS) continue;
    const r = Math.random();
    if (r < 0.2) {
      p.state = "call";
      p.reactTime = CALL_TIME;
      say(p, LINES.call, true);
    } else if (r < 0.35) {
      watch(p, at);
      say(p, LINES.watch);
    } else flee(p, at);
  }
};

/** Incidente (scontro, investimento): molti si fermano a guardare */
export const reactToAccident = (s: GameState, at: Vec2): void => {
  for (const p of s.peds) {
    if (p.role === "cop" || p.state !== "walk" || dist(p.pos, at) > NOTICE_RADIUS) continue;
    if (Math.random() < 0.6) {
      watch(p, at);
      say(p, LINES.watch);
    }
  }
};

/** Frasi e reazioni continue: saluti, arma in pugno, auto che sfreccia, sirene */
export const updatePedChatter = (s: GameState, dt: number): void => {
  const pl = s.player;
  const armed = !pl.car && pl.weapon !== "fists";
  const speed = pl.car ? Math.abs(forwardSpeed(pl.car)) : 0;
  const sirens = s.cars.filter((c) => hasSiren(c, s));
  for (const p of s.peds) {
    p.speechCooldown = Math.max(0, p.speechCooldown - dt);
    if (p.speech) {
      p.speech.time -= dt;
      if (p.speech.time <= 0) p.speech = null;
    }
    if (p.role === "cop" || p.state === "dead") continue;
    const d = dist(p.pos, pl.pos);
    if (!pl.car && armed && d < 60) {
      say(p, LINES.armed);
      if (p.state === "walk") flee(p, pl.pos);
    } else if (!pl.car && d < 22 && p.state === "walk" && stars(s) === 0 && Math.random() < 0.02)
      say(p, LINES.greet);
    else if (pl.car && speed > 60 && d < 34 && p.state === "walk") say(p, LINES.nearMiss);
    // Al passaggio di una sirena ci si gira a guardare
    const siren = p.state === "walk" ? sirens.find((c) => dist(c.pos, p.pos) < 110) : undefined;
    if (siren) watch(p, siren.pos, 1.5);
  }
};
