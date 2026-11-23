import { describe, expect, it } from "vitest";
import { Input } from "../engine/input";
import { createCar, updateCarPhysics } from "../entities/car";
import { createGame, updateGame } from "../game/game";
import { tileAtWorld, tileCenter } from "../world/cityMap";
import { Dir, Tile } from "../world/tiles";
import { updateEntityCollisions } from "./collisionSystem";
import { trafficControls } from "./trafficAi";

describe("IA traffico", () => {
  // Prima della correzione il 17% dei campioni era fuori strada; resta un margine per gli urti
  it("le auto in curva restano sulla strada (non salgono sul marciapiede)", () => {
    const s = createGame();
    const input = new Input();
    let samples = 0;
    let offRoad = 0;
    for (let i = 0; i < 60 * 60; i++) {
      updateGame(s, input, 1 / 60);
      for (const c of s.cars) {
        if (c.driver !== "ai" || c.police) continue;
        samples++;
        if (tileAtWorld(s.map, c.pos) !== Tile.Road) offRoad++;
      }
    }
    expect(offRoad / samples).toBeLessThan(0.005);
  });
});

describe("precedenza ai mezzi con le sirene", () => {
  it("l'auto davanti accosta e l'ambulanza in servizio la supera", () => {
    const s = createGame();
    s.cars = [];
    s.peds = [];
    // Corsia verso est della prima strada orizzontale (riga 3), lunga e dritta
    const lane = (x: number) => tileCenter({ x, y: 3 });
    const civil = createCar(lane(12), 0);
    civil.driver = "ai";
    civil.laneDir = Dir.E;
    civil.aiTarget = { x: 13, y: 3 };
    const amb = createCar(lane(9), 0, false, "ambulance");
    amb.driver = "ai";
    amb.laneDir = Dir.E;
    amb.aiTarget = { x: 10, y: 3 };
    amb.route = Array.from({ length: 12 }, (_, i) => ({ x: 11 + i, y: 3 }));
    s.cars.push(civil, amb);
    let yielded = false;
    for (let i = 0; i < 60 * 8 && amb.pos.x <= civil.pos.x + 20; i++) {
      for (const c of s.cars) updateCarPhysics(c, trafficControls(c, s), 1 / 60, s.map);
      updateEntityCollisions(s);
      yielded ||= civil.yieldTime > 0;
    }
    expect(yielded).toBe(true);
    expect(amb.pos.x).toBeGreaterThan(civil.pos.x + 20);
  });
});
