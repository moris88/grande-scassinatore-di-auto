import { dist } from "../engine/math";
import type { CarControls } from "../entities/car";
import { forwardSpeed } from "../entities/car";
import type { Car } from "../entities/types";
import { type GameState, showMessage } from "../game/state";
import { laneAt, worldToTile } from "../world/cityMap";
import { findLaneRoute, nearestLaneTile } from "../world/laneRoute";
import { findSpawnTile, spawnLaneCar } from "./spawnSystem";

/** Secondi a terra prima che parta la chiamata */
const CALL_DELAY = 2;
/** Raggio dalla camera entro cui si soccorrono i pedoni */
const CALL_RANGE = 900;
/** Distanza dal pedone a cui l'ambulanza si ferma */
const ARRIVE_DIST = 56;
/** Distanza massima se il pedone è lontano dalla strada (es. in un parco) */
const ROADSIDE_DIST = 160;
/** Secondi di soccorso sul posto */
const TREAT_TIME = 3;
/** Raggio in cui i paramedici rianimano i pedoni a terra */
const TREAT_RADIUS = 170;
/** Dopo questo tempo l'intervento viene abbandonato */
const GIVE_UP = 45;

/** Ricalcola il percorso dell'ambulanza fino al pedone */
const routeTo = (s: GameState, car: Car): void => {
  const job = s.ambulanceJob;
  if (!job) return;
  const goal = nearestLaneTile(s.map, worldToTile(job.ped.pos));
  const from = car.aiTarget ?? worldToTile(car.pos);
  car.route = goal ? findLaneRoute(s.map, from, car.laneDir, goal) : null;
};

const dispatch = (s: GameState): void => {
  const ped = s.peds.find(
    (p) =>
      p.state === "dead" &&
      p.deadTime > CALL_DELAY &&
      !p.missionTarget &&
      dist(p.pos, s.camera.pos) < CALL_RANGE,
  );
  if (!ped) return;
  const tile = findSpawnTile(s, ped.pos, "lanes", 500, 800);
  if (!tile || laneAt(s.map, tile.x, tile.y) === 0) return;
  const car = spawnLaneCar(s, tile, false, "ambulance");
  s.ambulanceJob = { car, ped, treat: 0, time: 0 };
  routeTo(s, car);
};

/** Avvia e gestisce gli interventi (uno alla volta) */
export const updateAmbulances = (s: GameState, dt: number): void => {
  const job = s.ambulanceJob;
  if (!job) {
    dispatch(s);
    return;
  }
  const { car, ped } = job;
  job.time += dt;
  const gone = !s.cars.includes(car) || car.dead || car.driver !== "ai";
  if (gone || job.time > GIVE_UP || (ped.state !== "dead" && job.treat === 0)) {
    if (!gone) car.route = null;
    s.ambulanceJob = null;
    return;
  }
  if (job.treat > 0) {
    job.treat -= dt;
    if (job.treat > 0) return;
    // Rianimazione dei pedoni a terra vicini
    let saved = 0;
    for (const p of s.peds)
      if (p.state === "dead" && dist(p.pos, car.pos) < TREAT_RADIUS) {
        p.state = "walk";
        p.health = 100;
        p.deadTime = 0;
        p.target = null;
        saved++;
      }
    if (saved > 0 && dist(car.pos, s.player.pos) < 400)
      showMessage(s, "I paramedici rianimano i feriti", 2);
    car.route = null;
    s.ambulanceJob = null;
    return;
  }
  // Arrivata: vicina al pedone, o a fine percorso sulla corsia più vicina (pedone lontano dalla strada)
  const d = dist(car.pos, ped.pos);
  const routeDone = car.route !== null && car.route.length === 0;
  if (d < ARRIVE_DIST || (routeDone && d < ROADSIDE_DIST)) job.treat = TREAT_TIME;
  else if (car.route === null || routeDone) routeTo(s, car);
};

/** Ambulanza ferma durante il soccorso (null = guida normale) */
export const ambulanceControls = (s: GameState, car: Car): CarControls | null => {
  if (s.ambulanceJob?.car !== car || s.ambulanceJob.treat <= 0) return null;
  return { steer: 0, throttle: forwardSpeed(car) > 5 ? -1 : 0, handbrake: true };
};
