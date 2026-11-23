import { describe, expect, it } from "vitest";
import { dist } from "../engine/math";
import { createGame } from "../game/game";
import { STALLS } from "./parkingSystem";

describe("parcheggi", () => {
  it("a inizio partita ci sono auto vuote parcheggiate negli stalli", () => {
    const s = createGame();
    const parked = s.cars.filter(
      (c) => c.driver === "none" && STALLS.some((st) => dist(st.pos, c.pos) < 1),
    );
    expect(parked.length).toBeGreaterThan(STALLS.length * 0.4);
  });
});
