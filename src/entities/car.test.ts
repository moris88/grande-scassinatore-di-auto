import { describe, expect, it } from "vitest";
import { buildCity, tileCenter } from "../world/cityMap";
import { createCar, damageCar, forwardSpeed, updateCarPhysics } from "./car";
import { VEHICLES } from "./vehicles";

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

describe("optional del concessionario", () => {
  const map = buildCity();

  it("il motore potenziato rende l'auto più veloce", () => {
    const base = createCar(tileCenter({ x: 5, y: 3 }), 0);
    const tuned = createCar(tileCenter({ x: 5, y: 3 }), 0);
    tuned.upgrades.engine = true;
    for (let i = 0; i < 90; i++) {
      updateCarPhysics(base, { throttle: 1, steer: 0, handbrake: false }, 1 / 60, map);
      updateCarPhysics(tuned, { throttle: 1, steer: 0, handbrake: false }, 1 / 60, map);
    }
    expect(forwardSpeed(tuned)).toBeGreaterThan(forwardSpeed(base) * 1.2);
  });

  it("la blindatura dimezza i danni", () => {
    const car = createCar({ x: 0, y: 0 }, 0);
    car.upgrades.armor = true;
    damageCar(car, 40);
    expect(car.health).toBe(80);
  });
});

describe("tipi di veicolo", () => {
  it("camion e autobus sono più lenti delle auto, la sportiva più veloce", () => {
    expect(VEHICLES.truck.maxSpeed).toBeLessThan(VEHICLES.car.maxSpeed * 0.7);
    expect(VEHICLES.bus.cruise).toBeLessThan(VEHICLES.car.cruise * 0.7);
    expect(VEHICLES.sport.maxSpeed).toBeGreaterThan(VEHICLES.car.maxSpeed);
  });

  it("a piedi, anche correndo, si va molto più piano che in auto", () => {
    expect(VEHICLES.car.maxSpeed).toBeGreaterThan(95 * 2.5);
  });
});
