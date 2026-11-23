import { describe, expect, it } from "vitest";
import { Input } from "../engine/input";
import { dist } from "../engine/math";
import { createGame, updateGame } from "../game/game";
import { PHONE_BOOTHS, tileCenter } from "../world/cityMap";
import { createEscapeMission } from "./mafiaSystem";
import { updateMissions } from "./missionSystem";

describe("fuga dalla mafia", () => {
  it("dalla cabina parte anche la missione di fuga, con le auto della mafia", () => {
    const s = createGame();
    s.time = 3; // quarta missione della rotazione
    s.player.pos = tileCenter(PHONE_BOOTHS[0]);
    updateMissions(s, 1 / 60);
    expect(s.mission?.kind).toBe("escape");
    expect(s.mission?.gang.length).toBeGreaterThan(0);
    expect(s.cars.filter((c) => c.gang).length).toBe(s.mission?.gang.length);
  });

  it("se resisti fino allo scadere del tempo la missione riesce e la mafia se ne va", () => {
    const s = createGame();
    s.mission = createEscapeMission(s);
    const gang = s.mission?.gang ?? [];
    if (!s.mission) throw new Error("missione non creata");
    s.mission.timeLeft = 0.01;
    updateMissions(s, 1 / 60);
    expect(s.mission).toBeNull();
    expect(s.banner?.kind).toBe("success");
    expect(gang.every((c) => !c.gang)).toBe(true);
  });

  it("raggiungere il rifugio completa la missione", () => {
    const s = createGame();
    s.mission = createEscapeMission(s);
    if (!s.mission) throw new Error("missione non creata");
    s.player.pos = { ...s.mission.target };
    updateMissions(s, 1 / 60);
    expect(s.mission).toBeNull();
    expect(s.money).toBeGreaterThan(0);
  });

  it("se il giocatore resta fermo la mafia lo raggiunge e lo cattura", () => {
    const s = createGame();
    const input = new Input();
    s.mission = createEscapeMission(s);
    if (!s.mission) throw new Error("missione non creata");
    s.mission.timeLeft = 999;
    // Una delle auto parte già vicina al giocatore
    const car = s.mission.gang[0];
    car.pos = { x: s.player.pos.x + 60, y: s.player.pos.y - 30 };
    let closest = Number.POSITIVE_INFINITY;
    for (let i = 0; i < 60 * 20 && !s.downReason; i++) {
      updateGame(s, input, 1 / 60);
      closest = Math.min(closest, dist(car.pos, s.player.pos));
    }
    expect(closest).toBeLessThan(60);
    expect(s.downReason).toBe("wasted");
  });
});
