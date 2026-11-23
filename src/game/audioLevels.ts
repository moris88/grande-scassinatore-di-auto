import type { AmbientLevels } from "../engine/ambientAudio";
import type { StepSurface } from "../engine/audio";
import { clamp, dist } from "../engine/math";
import { tileAt, tileAtWorld, worldToTile } from "../world/cityMap";
import { Tile } from "../world/tiles";
import type { GameState } from "./state";

const TRAFFIC_RANGE = 450;
const TRAFFIC_FULL = 8;
const PEOPLE_RANGE = 250;
const PEOPLE_FULL = 6;
/** Raggio (in tile) in cui si contano le tile di verde */
const NATURE_RADIUS = 5;

/** Livelli dei suoni ambientali attorno alla camera */
export const ambientLevels = (s: GameState): AmbientLevels => {
  const cam = s.camera.pos;
  const cars = s.cars.filter(
    (c) => !c.dead && c.driver === "ai" && dist(c.pos, cam) < TRAFFIC_RANGE,
  );
  const people = s.peds.filter((p) => p.state === "walk" && dist(p.pos, cam) < PEOPLE_RANGE).length;
  const center = worldToTile(cam);
  let green = 0;
  let total = 0;
  for (let dy = -NATURE_RADIUS; dy <= NATURE_RADIUS; dy++)
    for (let dx = -NATURE_RADIUS; dx <= NATURE_RADIUS; dx++) {
      total++;
      if (tileAt(s.map, center.x + dx, center.y + dy) === Tile.Grass) green++;
    }
  return {
    traffic: clamp(cars.length / TRAFFIC_FULL, 0, 1),
    nature: clamp((green / total) * 2, 0, 1),
    people: clamp(people / PEOPLE_FULL, 0, 1),
  };
};

/** Suono del passo secondo la superficie sotto il giocatore */
export const stepSurface = (s: GameState): StepSurface => {
  const t = tileAtWorld(s.map, s.player.pos);
  if (t === Tile.Grass) return "stepGrass";
  if (t === Tile.Rail) return "stepGravel";
  if (t === Tile.ParkingCovered || t === Tile.SprayShop) return "stepIndoor";
  if (t === Tile.Road || t === Tile.Parking) return "stepAsphalt";
  return "stepStone";
};
