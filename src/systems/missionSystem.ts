import { dist } from "../engine/math";
import { createPed } from "../entities/pedestrian";
import {
  type GameState,
  type Mission,
  type MissionKind,
  playSound,
  showMessage,
} from "../game/state";
import { tileAtWorld, tileCenter } from "../world/cityMap";
import { Tile } from "../world/tiles";
import { findSpawnTile, spawnLaneCar } from "./spawnSystem";

/** Secondi in cui resta a schermo il banner "MISSIONE COMPIUTA" */
const SUCCESS_BANNER_TIME = 3;
const KINDS: MissionKind[] = ["checkpoint", "deliver", "eliminate"];

const createMission = (s: GameState, kind: MissionKind): Mission | null => {
  const from = s.player.pos;
  if (kind === "checkpoint") {
    const t = findSpawnTile(s, from, "lanes", 700, 1500);
    if (!t) return null;
    const target = tileCenter(t);
    return {
      kind,
      title: "Corsa contro il tempo: raggiungi il punto segnato",
      target,
      timeLeft: Math.round(dist(from, target) / 95 + 20),
      reward: 1000,
      stage: 0,
      car: null,
      ped: null,
    };
  }
  if (kind === "deliver") {
    const t = findSpawnTile(s, from, "lanes", 300, 700);
    if (!t) return null;
    const car = spawnLaneCar(s, t, false);
    car.driver = "none";
    car.missionTag = true;
    car.color = "#ff66cc";
    return {
      kind,
      title: "Ruba l'auto rosa e portala al garage",
      target: car.pos,
      timeLeft: 150,
      reward: 2000,
      stage: 0,
      car,
      ped: null,
    };
  }
  const t = findSpawnTile(s, from, "walk", 600, 1300);
  if (!t) return null;
  const ped = createPed(tileCenter(t));
  ped.missionTarget = true;
  ped.color = "#ffffff";
  s.peds.push(ped);
  return {
    kind,
    title: "Elimina il bersaglio in camicia bianca",
    target: ped.pos,
    timeLeft: 100,
    reward: 1500,
    stage: 0,
    car: null,
    ped,
  };
};

const finish = (s: GameState, success: boolean): void => {
  const m = s.mission;
  if (!m) return;
  if (m.car) m.car.missionTag = false;
  if (m.ped) m.ped.missionTarget = false;
  if (success) {
    const reward = m.reward * s.multiplier;
    s.money += reward;
    s.multiplier = Math.min(5, s.multiplier + 1);
    s.banner = {
      kind: "success",
      detail: `+$${reward.toLocaleString("it-IT")} · moltiplicatore x${s.multiplier}`,
      time: SUCCESS_BANNER_TIME,
    };
    playSound(s, "success");
  } else {
    showMessage(s, "MISSIONE FALLITA", 4);
    playSound(s, "fail");
  }
  s.mission = null;
  s.phoneCooldown = 5;
};

export const failMission = (s: GameState): void => finish(s, false);

export const updateMissions = (s: GameState, dt: number): void => {
  s.phoneCooldown -= dt;
  const p = s.player;
  if (!s.mission) {
    if (p.car || s.phoneCooldown > 0 || tileAtWorld(s.map, p.pos) !== Tile.Phone) return;
    const kind = KINDS[Math.floor(s.time) % KINDS.length];
    s.mission = createMission(s, kind);
    s.phoneCooldown = 2;
    if (s.mission) showMessage(s, `☎ ${s.mission.title}`, 5);
    return;
  }

  const m = s.mission;
  m.timeLeft -= dt;
  if (m.timeLeft <= 0) {
    finish(s, false);
    return;
  }

  if (m.kind === "checkpoint") {
    if (dist(p.car ? p.car.pos : p.pos, m.target) < 40) finish(s, true);
  } else if (m.kind === "deliver" && m.car) {
    if (m.car.dead || m.car.health <= 0) {
      finish(s, false);
      return;
    }
    if (m.stage === 0 && p.car === m.car) {
      const t = findSpawnTile(s, m.car.pos, "lanes", 800, 1500);
      if (!t) return;
      m.stage = 1;
      m.target = tileCenter(t);
      showMessage(s, "Ottimo! Ora porta l'auto al garage", 3);
    } else if (m.stage === 0) {
      m.target = m.car.pos;
    } else if (p.car === m.car && dist(m.car.pos, m.target) < 48) {
      finish(s, true);
    }
  } else if (m.kind === "eliminate" && m.ped) {
    m.target = m.ped.pos;
    if (m.ped.state === "dead") finish(s, true);
  }
};
