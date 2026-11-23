import { describe, expect, it } from "vitest";
import { dist } from "../engine/math";
import { createCar } from "../entities/car";
import { tileCenter } from "../world/cityMap";
import {
  carLocalToWorld,
  isSliding,
  startEnter,
  startExit,
  updateTransition,
} from "./carTransition";
import { createGame } from "./game";
import type { GameState } from "./state";

/** Auto parcheggiata vuota su una strada orizzontale, muso a est */
const setup = (playerSide: number): { s: GameState; car: ReturnType<typeof createCar> } => {
  const s = createGame();
  s.cars = [];
  s.peds = [];
  const car = createCar(tileCenter({ x: 10, y: 3 }), 0);
  s.cars.push(car);
  s.player.pos = carLocalToWorld(car, { x: 0, y: playerSide * 20 });
  return { s, car };
};

const runTransition = (s: GameState, onFrame?: () => void): void => {
  for (let i = 0; i < 120 && updateTransition(s, 1 / 60); i++) onFrame?.();
};

describe("entrata e uscita dall'auto", () => {
  it("dal lato del guidatore cammina alla portiera e sale, senza scivolare", () => {
    const { s, car } = setup(-1);
    startEnter(s, car);
    let slid = false;
    runTransition(s, () => {
      slid ||= isSliding(s);
    });
    expect(slid).toBe(false);
    expect(s.player.car).toBe(car);
    expect(car.driver).toBe("player");
  });

  it("dal lato opposto scivola sul cofano prima di salire", () => {
    const { s, car } = setup(1);
    startEnter(s, car);
    let slid = false;
    runTransition(s, () => {
      slid ||= isSliding(s);
    });
    expect(slid).toBe(true);
    expect(s.player.car).toBe(car);
  });

  it("uscendo il giocatore finisce a piedi accanto all'auto", () => {
    const { s, car } = setup(-1);
    car.driver = "player";
    s.player.car = car;
    expect(startExit(s, car)).toBe(true);
    runTransition(s);
    expect(s.player.car).toBeNull();
    expect(s.player.transition).toBeNull();
    expect(car.driver).toBe("none");
    const d = dist(s.player.pos, car.pos);
    expect(d).toBeGreaterThan(12);
    expect(d).toBeLessThan(30);
  });
});
