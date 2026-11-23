import { describe, expect, it } from "vitest";
import { Input } from "../engine/input";
import { createPed } from "../entities/pedestrian";
import { createGame, updateGame } from "../game/game";
import { tileCenter } from "../world/cityMap";
import { killPed } from "./weaponSystem";

describe("ambulanze", () => {
  it("un'ambulanza raggiunge il pedone a terra e lo rianima", () => {
    let revived = 0;
    // Il traffico è casuale: su 3 tentativi almeno 2 interventi devono riuscire
    for (let attempt = 0; attempt < 3; attempt++) {
      const s = createGame();
      const input = new Input();
      const ped = createPed(tileCenter({ x: 12, y: 4 })); // marciapiede vicino alla partenza
      s.peds.push(ped);
      killPed(s, ped, false);
      let sawAmbulance = false;
      for (let i = 0; i < 60 * 45 && ped.state === "dead"; i++) {
        updateGame(s, input, 1 / 60);
        if (s.ambulanceJob?.ped === ped) sawAmbulance = true;
      }
      expect(sawAmbulance).toBe(true);
      if (ped.state !== "dead") revived++;
    }
    expect(revived).toBeGreaterThanOrEqual(2);
  });

  it("nel traffico ci sono anche camion e autobus", () => {
    const s = createGame();
    const input = new Input();
    const kinds = new Set<string>();
    for (let i = 0; i < 60 * 30; i++) {
      updateGame(s, input, 1 / 60);
      for (const c of s.cars) kinds.add(c.kind);
    }
    expect(kinds.has("truck")).toBe(true);
    expect(kinds.has("bus")).toBe(true);
  });
});
