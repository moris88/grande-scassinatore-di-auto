import { describe, expect, it } from "vitest";
import { dist } from "../engine/math";
import { createGame } from "../game/game";
import { updateAirTraffic } from "./airTraffic";

describe("traffico aereo", () => {
  it("gli elicotteri attraversano la zona visibile e poi spariscono", () => {
    const s = createGame();
    let passedNear = false;
    let maxSeen = 0;
    for (let i = 0; i < 60 * 90; i++) {
      updateAirTraffic(s, 1 / 60);
      maxSeen = Math.max(maxSeen, s.helis.length);
      if (s.helis.some((h) => dist(h.pos, s.camera.pos) < 400)) passedNear = true;
    }
    expect(passedNear).toBe(true);
    expect(maxSeen).toBeLessThanOrEqual(2);
  });
});
