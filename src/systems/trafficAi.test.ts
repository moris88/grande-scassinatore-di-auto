import { describe, expect, it } from "vitest";
import { Input } from "../engine/input";
import { createGame, updateGame } from "../game/game";
import { tileAtWorld } from "../world/cityMap";
import { Tile } from "../world/tiles";

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
