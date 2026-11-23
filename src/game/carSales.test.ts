import { describe, expect, it } from "vitest";
import { createCar, forwardSpeed, updateCarPhysics } from "../entities/car";
import { VEHICLES } from "../entities/vehicles";
import { updateWanted } from "../systems/wantedSystem";
import { SHOPS, SPRAY_SHOPS, buildCity, tileCenter } from "../world/cityMap";
import { salePrice } from "./carSales";
import { startExit, updateTransition } from "./carTransition";
import { createGame } from "./game";
import type { GameState } from "./state";

const exitAt = (s: GameState, pos: { x: number; y: number }) => {
  const car = createCar(pos, 0);
  car.driver = "player";
  s.player.car = car;
  s.cars.push(car);
  startExit(s, car);
  for (let i = 0; i < 60 && updateTransition(s, 1 / 60); i++);
  return car;
};

describe("danni ai veicoli", () => {
  it("un'auto molto danneggiata è più lenta", () => {
    const map = buildCity();
    const ok = createCar(tileCenter({ x: 5, y: 3 }), 0);
    const wrecked = createCar(tileCenter({ x: 5, y: 3 }), 0);
    wrecked.health = 10;
    for (let i = 0; i < 120; i++) {
      updateCarPhysics(ok, { throttle: 1, steer: 0, handbrake: false }, 1 / 60, map);
      updateCarPhysics(wrecked, { throttle: 1, steer: 0, handbrake: false }, 1 / 60, map);
    }
    expect(forwardSpeed(wrecked)).toBeLessThan(forwardSpeed(ok) * 0.75);
  });

  it("il garage ripara l'auto mentre la rivernicia", () => {
    const s = createGame();
    s.money = 500;
    const car = createCar(tileCenter({ x: SPRAY_SHOPS[0].x, y: SPRAY_SHOPS[0].y }), 0);
    car.health = 30;
    car.driver = "player";
    s.player.car = car;
    updateWanted(s, 1 / 60);
    expect(car.health).toBe(VEHICLES.car.health);
  });
});

describe("vendita delle auto", () => {
  it("il prezzo scende in proporzione ai danni", () => {
    const car = createCar({ x: 0, y: 0 }, 0);
    const full = salePrice(car);
    car.health = VEHICLES.car.health / 2;
    expect(salePrice(car)).toBe(full / 2);
  });

  it("scendendo davanti al concessionario l'auto viene venduta", () => {
    const s = createGame();
    const dealer = SHOPS.find((x) => x.kind === "cars");
    if (!dealer) throw new Error("manca il concessionario");
    const car = exitAt(s, tileCenter(dealer.outside));
    expect(s.cars.includes(car)).toBe(false);
    expect(s.money).toBe(salePrice(car));
  });

  it("scendendo in strada l'auto resta lì", () => {
    const s = createGame();
    const car = exitAt(s, tileCenter({ x: 10, y: 3 }));
    expect(s.cars.includes(car)).toBe(true);
    expect(s.money).toBe(0);
  });
});
