import { describe, expect, it } from "vitest";
import { Input } from "../engine/input";
import { dist } from "../engine/math";
import { createCar } from "../entities/car";
import { createGame, updateGame } from "../game/game";
import { tileCenter } from "../world/cityMap";

/** Auto vuota in fiamme sulla strada vicino alla partenza */
const burningCar = (s: ReturnType<typeof createGame>) => {
  const car = createCar(tileCenter({ x: 12, y: 3 }), 0);
  car.health = 0;
  s.cars.push(car);
  return car;
};

describe("pompieri e carro attrezzi", () => {
  it("un'auto esplosa lascia un incendio che i pompieri arrivano a spegnere", () => {
    let extinguished = 0;
    for (let attempt = 0; attempt < 3; attempt++) {
      const s = createGame();
      const input = new Input();
      burningCar(s);
      for (let i = 0; i < 60 * 4; i++) updateGame(s, input, 1 / 60);
      expect(s.fires.length).toBe(1);
      let sawTruck = false;
      for (let i = 0; i < 60 * 45 && s.fires.length > 0; i++) {
        updateGame(s, input, 1 / 60);
        if (s.fireJob?.car.kind === "firetruck") sawTruck = true;
      }
      expect(sawTruck).toBe(true);
      if (s.fires.length === 0) extinguished++;
    }
    expect(extinguished).toBeGreaterThanOrEqual(2);
  });

  it("il carro attrezzi aggancia il rottame e se lo porta via", () => {
    let towed = 0;
    for (let attempt = 0; attempt < 3; attempt++) {
      const s = createGame();
      const input = new Input();
      const wreck = burningCar(s);
      wreck.dead = true; // rottame già spento
      wreck.driver = "none";
      for (let i = 0; i < 60 * 60 && !wreck.towedBy; i++) updateGame(s, input, 1 / 60);
      if (wreck.towedBy) {
        towed++;
        expect(wreck.towedBy.kind).toBe("tow");
        for (let i = 0; i < 30; i++) updateGame(s, input, 1 / 60);
        expect(dist(wreck.pos, wreck.towedBy.pos)).toBeLessThan(45);
      }
    }
    expect(towed).toBeGreaterThanOrEqual(2);
  });
});
