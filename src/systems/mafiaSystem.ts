import { angleTo, dist } from "../engine/math";
import type { CarControls } from "../entities/car";
import { forwardSpeed } from "../entities/car";
import type { Car } from "../entities/types";
import { type GameState, type Mission, playSound, showMessage } from "../game/state";
import { PARKING_LOTS, worldToTile } from "../world/cityMap";
import { findLaneRoute, nearestLaneTile } from "../world/laneRoute";
import { TILE } from "../world/tiles";
import { playerPos, sees } from "./policeVision";
import { findSpawnTile, spawnLaneCar } from "./spawnSystem";
import { steerTowards, trafficControls } from "./trafficAi";

const GANG_CARS = 3;
const SPAWN_TRIES = 10;
const GANG_COLOR = "#141414";
const SURVIVE_TIME = 60;
const REWARD = 2500;
const SIGHT = 360;
const CHASE_SPEED = 220;
const SHOOT_RANGE = 220;
const SHOOT_EVERY = 1;
/** Auto della mafia addosso al giocatore fermo per così tanto: catturato */
const CAPTURE_DIST = 34;
const CAPTURE_TIME = 1.2;

/** Rifugio: il parcheggio coperto più lontano dal giocatore */
const hideout = (s: GameState) => {
  const covered = PARKING_LOTS.filter((l) => l.covered).map((l) => ({
    x: (l.x + l.w / 2) * TILE,
    y: (l.y + l.h / 2) * TILE,
  }));
  return covered.reduce((a, b) => (dist(b, s.player.pos) > dist(a, s.player.pos) ? b : a));
};

/** Missione di fuga: la mafia ti dà la caccia, sopravvivi o raggiungi il rifugio */
export const createEscapeMission = (s: GameState): Mission | null => {
  const gang: Car[] = [];
  for (let i = 0; i < GANG_CARS; i++) {
    // La ricerca di una tile libera è casuale: si riprova qualche volta
    let t = null;
    for (let tries = 0; tries < SPAWN_TRIES && !t; tries++)
      t = findSpawnTile(s, s.player.pos, "lanes", 500, 800);
    if (!t) continue;
    const car = spawnLaneCar(s, t, false, i % 2 === 0 ? "suv" : "sport");
    car.color = GANG_COLOR;
    car.gang = true;
    car.missionTag = true;
    gang.push(car);
  }
  if (gang.length === 0) return null;
  return {
    kind: "escape",
    title: `La mafia ti dà la caccia! Resisti ${SURVIVE_TIME} s o raggiungi il rifugio`,
    target: hideout(s),
    timeLeft: SURVIVE_TIME,
    reward: REWARD,
    stage: 0,
    car: null,
    ped: null,
    gang,
    gangLastSeen: { ...s.player.pos },
  };
};

/** Le auto della mafia tornano normale traffico a missione finita */
export const releaseGang = (m: Mission): void => {
  for (const c of m.gang) {
    c.gang = false;
    c.missionTag = false;
    c.route = null;
  }
};

/** Guida di un'auto della mafia: insegue se ti vede, altrimenti va dove ti ha visto l'ultima volta */
export const gangControls = (car: Car, s: GameState, dt: number): CarControls => {
  const m = s.mission;
  if (!m || m.kind !== "escape") return trafficControls(car, s);
  if (car.reverseTime > 0) {
    car.reverseTime -= dt;
    return { throttle: -1, steer: 1, handbrake: false };
  }
  const target = playerPos(s);
  if (sees(s, car.pos, SIGHT)) {
    m.gangLastSeen = { ...target };
    car.route = null;
    const d = dist(car.pos, target);
    car.stuckTime = Math.abs(forwardSpeed(car)) < 15 && d > 50 ? car.stuckTime + dt : 0;
    if (car.stuckTime > 1) {
      car.stuckTime = 0;
      car.reverseTime = 0.8;
    }
    return steerTowards(car, target, d < 100 ? 90 : CHASE_SPEED);
  }
  if (m.gangLastSeen && car.route === null) {
    const goal = nearestLaneTile(s.map, worldToTile(m.gangLastSeen));
    const from = car.aiTarget ?? worldToTile(car.pos);
    car.route = (goal && findLaneRoute(s.map, from, car.laneDir, goal)) || [];
  }
  return trafficControls(car, s);
};

/** Spari dal finestrino e cattura del giocatore */
export const updateGang = (s: GameState, dt: number): void => {
  const m = s.mission;
  if (!m || m.kind !== "escape") return;
  const target = playerPos(s);
  const slow = s.player.car ? Math.abs(forwardSpeed(s.player.car)) < 25 : true;
  let close = false;
  for (const car of m.gang) {
    if (car.dead || car.health <= 0 || car.driver !== "ai") continue;
    car.sirenPhase += dt;
    const d = dist(car.pos, target);
    if (d < CAPTURE_DIST) close = true;
    const before = Math.floor((car.sirenPhase - dt) / SHOOT_EVERY);
    if (d > SHOOT_RANGE || Math.floor(car.sirenPhase / SHOOT_EVERY) === before) continue;
    if (!sees(s, car.pos, SHOOT_RANGE)) continue;
    const a = angleTo(car.pos, target) + (Math.random() - 0.5) * 0.3;
    s.bullets.push({
      pos: { x: car.pos.x + Math.cos(a) * 16, y: car.pos.y + Math.sin(a) * 16 },
      vel: { x: Math.cos(a) * 500, y: Math.sin(a) * 500 },
      life: 0.6,
      fromPlayer: false,
    });
    playSound(s, "shot");
  }
  // Nella fuga `stage` conta i secondi in cui la mafia ti sta addosso mentre sei fermo
  m.stage = slow && close ? m.stage + dt : 0;
  if (m.stage > CAPTURE_TIME) {
    showMessage(s, "La mafia ti ha preso!", 3);
    s.player.health = 0;
  }
};
