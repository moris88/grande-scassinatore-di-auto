import { describe, expect, it } from "vitest";
import { createCar, forwardSpeed } from "../entities/car";
import { createPed } from "../entities/pedestrian";
import { createGame } from "../game/game";
import { MAP_W, laneAt, tileAt, tileCenter } from "../world/cityMap";
import { RAIL_ROW, RAIL_Y, crossingColumns } from "../world/railway";
import { Dir, TILE, Tile } from "../world/tiles";
import { trafficControls } from "./trafficAi";
import { crossingClosed, updateTrains } from "./trainSystem";

describe("treni", () => {
  it("il binario attraversa tutta la città con 6 passaggi a livello", () => {
    const s = createGame();
    for (let x = 1; x < MAP_W - 1; x++)
      expect([Tile.Rail, Tile.Road]).toContain(tileAt(s.map, x, RAIL_ROW));
    // 6 strade verticali attraversate, ognuna con 2 corsie
    expect(crossingColumns(s.map).length).toBe(12);
  });

  it("il treno attraversa la città e poi sparisce", () => {
    const s = createGame();
    s.trainTimer = 0;
    updateTrains(s, 1 / 60);
    expect(s.train).not.toBeNull();
    for (let i = 0; i < 60 * 15 && s.train; i++) updateTrains(s, 1 / 60);
    expect(s.train).toBeNull();
  });

  it("distrugge i veicoli e uccide chi è sui binari", () => {
    const s = createGame();
    s.cars = [];
    s.peds = [];
    const car = createCar({ x: 10 * TILE, y: RAIL_Y }, Math.PI / 2);
    const ped = createPed({ x: 20 * TILE, y: RAIL_Y });
    s.cars.push(car);
    s.peds.push(ped);
    s.trainTimer = 0;
    for (let i = 0; i < 60 * 15; i++) updateTrains(s, 1 / 60);
    expect(car.health).toBeLessThanOrEqual(0);
    expect(ped.state).toBe("dead");
  });

  it("il traffico si ferma davanti al passaggio a livello chiuso", () => {
    const s = createGame();
    s.cars = [];
    // Corsia verso sud della prima strada verticale con passaggio a livello
    const col = crossingColumns(s.map).find((x) => laneAt(s.map, x, RAIL_ROW - 2) === Dir.S);
    if (col === undefined) throw new Error("nessuna corsia verso sud sul binario");
    const car = createCar(tileCenter({ x: col, y: RAIL_ROW - 2 }), Math.PI / 2);
    car.driver = "ai";
    car.laneDir = Dir.S;
    car.aiTarget = { x: col, y: RAIL_ROW };
    car.vel = { x: 0, y: 60 };
    s.trainTimer = 0;
    updateTrains(s, 1 / 60);
    if (!s.train) throw new Error("treno non partito");
    s.train.head = (col + 0.5) * TILE; // treno proprio sul passaggio
    expect(crossingClosed(s, col)).toBe(true);
    const ctl = trafficControls(car, s);
    expect(ctl.throttle).toBeLessThanOrEqual(0);
    expect(forwardSpeed(car)).toBeGreaterThan(0);
  });
});
