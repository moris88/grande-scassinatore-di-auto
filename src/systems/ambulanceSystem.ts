import { dist } from "../engine/math";
import type { CarControls } from "../entities/car";
import { forwardSpeed } from "../entities/car";
import type { Car } from "../entities/types";
import { type GameState, showMessage } from "../game/state";
import { arrivedAt, dispatchVehicle, routeToPoint } from "./dispatch";

/** Secondi a terra prima che parta la chiamata */
const CALL_DELAY = 2;
/** Raggio dalla camera entro cui si soccorrono i pedoni */
const CALL_RANGE = 900;
/** Distanza dal pedone a cui l'ambulanza si ferma passandogli accanto (pedone sul marciapiede) */
const ARRIVE_DIST = 110;
/** Distanza massima se il pedone è lontano dalla strada (es. in un parco) */
const ROADSIDE_DIST = 160;
/** Secondi di soccorso sul posto */
const TREAT_TIME = 3;
/** Raggio in cui i paramedici rianimano i pedoni a terra */
const TREAT_RADIUS = 170;
/** Dopo questo tempo l'intervento viene abbandonato */
const GIVE_UP = 45;

/** Manda l'ambulanza libera più vicina (o una nuova) dal primo pedone a terra */
const dispatch = (s: GameState): void => {
  const ped = s.peds.find(
    (p) =>
      p.state === "dead" &&
      p.deadTime > CALL_DELAY &&
      !p.missionTarget &&
      dist(p.pos, s.camera.pos) < CALL_RANGE,
  );
  if (!ped) return;
  const car = dispatchVehicle(s, "ambulance", ped.pos);
  if (!car) return;
  s.ambulanceJob = { car, ped, treat: 0, time: 0 };
  routeToPoint(s, car, ped.pos);
};

/** Avvia e gestisce gli interventi (uno alla volta); senza chiamate le ambulanze girano
 * come auto normali, a lampeggianti spenti */
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
  if (arrivedAt(car, ped.pos, ARRIVE_DIST, ROADSIDE_DIST)) job.treat = TREAT_TIME;
  else if (car.route === null || car.route.length === 0) routeToPoint(s, car, ped.pos);
};

/** Ambulanza ferma durante il soccorso (null = guida normale) */
export const ambulanceControls = (s: GameState, car: Car): CarControls | null => {
  if (s.ambulanceJob?.car !== car || s.ambulanceJob.treat <= 0) return null;
  return { steer: 0, throttle: forwardSpeed(car) > 5 ? -1 : 0, handbrake: true };
};
