import { describe, expect, it } from "vitest";
import { buildCity, tileCenter } from "../world/cityMap";
import { createCar, forwardSpeed, updateCarPhysics } from "./car";

describe("fisica auto", () => {
  const map = buildCity();

  it("accelera in avanti lungo una strada", () => {
    const car = createCar(tileCenter({ x: 10, y: 3 }), 0);
    for (let i = 0; i < 60; i++)
      updateCarPhysics(car, { throttle: 1, steer: 0, handbrake: false }, 1 / 60, map);
    expect(forwardSpeed(car)).toBeGreaterThan(150);
    expect(car.pos.x).toBeGreaterThan(tileCenter({ x: 10, y: 3 }).x);
  });

  it("non attraversa gli edifici", () => {
    // Auto rivolta a sud verso un isolato
    const car = createCar(tileCenter({ x: 10, y: 3 }), Math.PI / 2);
    for (let i = 0; i < 180; i++)
      updateCarPhysics(car, { throttle: 1, steer: 0, handbrake: false }, 1 / 60, map);
    expect(car.pos.y).toBeLessThan(5 * 32);
  });
});
