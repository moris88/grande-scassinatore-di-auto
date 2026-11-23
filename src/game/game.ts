import { updateCamera } from "../engine/camera";
import type { Input } from "../engine/input";
import { createPlayer } from "../entities/player";
import { updateAirTraffic } from "../systems/airTraffic";
import { updateAmbulances } from "../systems/ambulanceSystem";
import { updateEntityCollisions } from "../systems/collisionSystem";
import { updateCop } from "../systems/copAi";
import { failMission, updateMissions } from "../systems/missionSystem";
import { fillParking, updateParking } from "../systems/parkingSystem";
import { updatePed } from "../systems/pedAi";
import { updateSpawns } from "../systems/spawnSystem";
import { updateTrains } from "../systems/trainSystem";
import { isBusted, updateWanted } from "../systems/wantedSystem";
import { updateBullets, updateWeapons } from "../systems/weaponSystem";
import { HOSPITAL, PLAYER_START, POLICE_STATION, buildCity, tileCenter } from "../world/cityMap";
import { updateCars } from "./carUpdate";
import { updatePlayerControl } from "./playerControl";
import { updateShop } from "./shopSystem";
import { type GameState, showMessage } from "./state";

const DOWN_TIME = 3;

export const createGame = (): GameState => {
  const start = tileCenter(PLAYER_START);
  const s: GameState = {
    map: buildCity(),
    player: createPlayer(start),
    cars: [],
    peds: [],
    bullets: [],
    explosions: [],
    helis: [],
    train: null,
    trainTimer: 8,
    trainDir: 1,
    camera: { pos: { ...start }, zoom: 2 },
    heat: 0,
    seen: false,
    lastSeen: null,
    searchTime: 0,
    money: 0,
    multiplier: 1,
    lives: 3,
    mission: null,
    phoneCooldown: 0,
    message: null,
    banner: null,
    shop: null,
    ambulanceJob: null,
    downTime: 0,
    downReason: null,
    gameOver: false,
    bustTimer: 0,
    time: 0,
    sounds: [],
  };
  fillParking(s);
  showMessage(s, "Benvenuto in città. Cerca le cabine telefoniche ☎ per le missioni", 5);
  return s;
};

const knockDown = (s: GameState, reason: "wasted" | "busted"): void => {
  s.downReason = reason;
  s.downTime = DOWN_TIME;
  s.player.transition = null;
  if (s.player.car) {
    s.player.car.driver = "none";
    s.player.car = null;
  }
  if (s.mission) failMission(s);
};

const respawn = (s: GameState): void => {
  s.lives--;
  if (s.lives <= 0) {
    s.gameOver = true;
    return;
  }
  const at = tileCenter(s.downReason === "busted" ? POLICE_STATION : HOSPITAL);
  if (s.downReason === "busted") s.money = Math.floor(s.money / 2);
  s.player = createPlayer(at);
  s.camera.pos = { ...at };
  s.heat = 0;
  s.bustTimer = 0;
  s.downReason = null;
};

export const updateGame = (s: GameState, input: Input, dt: number): void => {
  if (s.gameOver) return;
  if (s.shop) {
    updateShop(s, input);
    return;
  }
  s.time += dt;
  if (s.message) {
    s.message.time -= dt;
    if (s.message.time <= 0) s.message = null;
  }
  if (s.banner) {
    s.banner.time -= dt;
    if (s.banner.time <= 0) s.banner = null;
  }

  if (s.downReason) {
    s.downTime -= dt;
    if (s.downTime <= 0) respawn(s);
  } else {
    updatePlayerControl(s, input, dt);
    if (!s.player.transition) updateWeapons(s, input, dt);
  }

  updateCars(s, dt);
  for (const p of s.peds)
    if (p.role === "cop") updateCop(s, p, dt);
    else updatePed(s, p, dt);
  updateBullets(s, dt);
  updateEntityCollisions(s);
  updateWanted(s, dt);
  updateMissions(s, dt);
  updateAmbulances(s, dt);
  updateSpawns(s);
  updateParking(s);
  updateAirTraffic(s, dt);
  updateTrains(s, dt);

  if (!s.downReason) {
    if (s.player.health <= 0) knockDown(s, "wasted");
    else if (isBusted(s)) knockDown(s, "busted");
  }

  const pl = s.player;
  updateCamera(s.camera, pl.car ? pl.car.pos : pl.pos, pl.car ? pl.car.vel : { x: 0, y: 0 }, dt);
};
