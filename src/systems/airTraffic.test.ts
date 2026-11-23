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
    expect(maxSeen).toBeLessThanOrEqual(1);
  });
});

describe("aereo", () => {
  it("attraversa la città su una rotta fissa passando vicino alla camera, poi sparisce", () => {
    const s = createGame();
    let appeared = false;
    let closest = Number.POSITIVE_INFINITY;
    let disappeared = false;
    for (let i = 0; i < 60 * 120 && !disappeared; i++) {
      updateAirTraffic(s, 1 / 60);
      if (s.plane) {
        appeared = true;
        closest = Math.min(closest, dist(s.plane.pos, s.camera.pos));
      } else if (appeared) disappeared = true;
    }
    expect(appeared).toBe(true);
    expect(closest).toBeLessThan(700);
    expect(disappeared).toBe(true);
  });
});
