import { type Vec2, dist, pick } from "../engine/math";
import { createCar } from "../entities/car";
import { createCop, createPed } from "../entities/pedestrian";
import type { VehicleKind } from "../entities/vehicles";
import { type GameState, stars } from "../game/state";
import { type CityMap, MAP_H, MAP_W, laneAt, tileAt, tileCenter } from "../world/cityMap";
import { ALL_DIRS, dirAngle, isWalkable } from "../world/tiles";
import { needsPatrolCop } from "./copAi";

const TRAFFIC = 26;
const PEDS = 40;
const SPAWN_MIN = 480;
const SPAWN_MAX = 820;
const DESPAWN = 1100;
const TRUCK_SHARE = 0.15;
const BUS_SHARE = 0.12;

interface SpawnLists {
  lanes: Vec2[];
  walk: Vec2[];
}

const cache = new WeakMap<CityMap, SpawnLists>();

/** Tile di corsia singola (no incroci) e tile pedonali, calcolate una sola volta */
const lists = (map: CityMap): SpawnLists => {
  const hit = cache.get(map);
  if (hit) return hit;
  const out: SpawnLists = { lanes: [], walk: [] };
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const l = laneAt(map, x, y);
      if (ALL_DIRS.includes(l)) out.lanes.push({ x, y });
      if (isWalkable(tileAt(map, x, y))) out.walk.push({ x, y });
    }
  }
  cache.set(map, out);
  return out;
};

/** Cerca una tile a distanza [min, max] dal punto, libera da auto */
export const findSpawnTile = (
  s: GameState,
  from: Vec2,
  kind: "lanes" | "walk",
  min: number,
  max: number,
): Vec2 | null => {
  const pool = lists(s.map)[kind];
  for (let i = 0; i < 12; i++) {
    const t = pick(pool);
    const c = tileCenter(t);
    const d = dist(c, from);
    if (d < min || d > max) continue;
    if (s.cars.some((car) => dist(car.pos, c) < 40)) continue;
    return t;
  }
  return null;
};

export const spawnLaneCar = (s: GameState, tile: Vec2, police: boolean, kind?: VehicleKind) => {
  const dir = laneAt(s.map, tile.x, tile.y);
  const car = createCar(tileCenter(tile), dirAngle(dir), police, kind);
  car.driver = "ai";
  car.laneDir = dir;
  car.aiTarget = tile;
  s.cars.push(car);
  return car;
};

/** Tipo di veicolo civile: soprattutto auto, qualche camion e autobus */
const randomTrafficKind = (): VehicleKind => {
  const r = Math.random();
  return r < TRUCK_SHARE ? "truck" : r < TRUCK_SHARE + BUS_SHARE ? "bus" : "car";
};

const keep = (from: Vec2, pos: Vec2, protectedEntity: boolean): boolean =>
  protectedEntity || dist(pos, from) < DESPAWN;

export const updateSpawns = (s: GameState): void => {
  const from = s.camera.pos;
  const job = s.ambulanceJob;
  s.cars = s.cars.filter((c) =>
    keep(
      from,
      c.pos,
      c.driver === "player" || c.missionTag || c === s.player.car || c === job?.car,
    ),
  );
  // I pedoni a terra spariscono dopo un po', tranne quello che l'ambulanza sta soccorrendo
  s.peds = s.peds.filter(
    (p) =>
      keep(from, p.pos, p.missionTarget || p === job?.ped) &&
      !(p.state === "dead" && p.deadTime > 20 && p !== job?.ped),
  );

  const civil = s.cars.filter((c) => !c.police && c.driver === "ai").length;
  if (civil < TRAFFIC) {
    const t = findSpawnTile(s, from, "lanes", SPAWN_MIN, SPAWN_MAX);
    if (t) spawnLaneCar(s, t, false, randomTrafficKind());
  }
  const wantCops = 2 + stars(s) * 2;
  const cops = s.cars.filter((c) => c.police && c.driver === "ai" && !c.dead).length;
  if (cops < wantCops) {
    const t = findSpawnTile(s, from, "lanes", SPAWN_MIN, SPAWN_MAX);
    if (t) spawnLaneCar(s, t, true);
  }
  if (needsPatrolCop(s)) {
    const t = findSpawnTile(s, from, "walk", SPAWN_MIN - 100, SPAWN_MAX);
    if (t) s.peds.push(createCop(tileCenter(t)));
  }
  if (s.peds.filter((p) => p.state !== "dead").length < PEDS) {
    const t = findSpawnTile(s, from, "walk", SPAWN_MIN - 100, SPAWN_MAX);
    if (t) s.peds.push(createPed(tileCenter(t)));
  }
};
