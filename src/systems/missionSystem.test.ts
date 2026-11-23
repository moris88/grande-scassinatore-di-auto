import { describe, expect, it } from "vitest";
import { createGame } from "../game/game";
import { PHONE_BOOTHS, tileCenter } from "../world/cityMap";
import { updateMissions } from "./missionSystem";

describe("missioni", () => {
  it("la cabina avvia una missione e raggiungere l'obiettivo la completa", () => {
    const s = createGame();
    s.time = 0; // tipo "checkpoint"
    s.player.pos = tileCenter(PHONE_BOOTHS[0]);
    updateMissions(s, 1 / 60);
    expect(s.mission?.kind).toBe("checkpoint");
    const target = s.mission?.target;
    if (!target) throw new Error("missione senza obiettivo");
    s.player.pos = { ...target };
    updateMissions(s, 1 / 60);
    expect(s.mission).toBeNull();
    expect(s.money).toBe(1000);
    expect(s.multiplier).toBe(2);
  });

  it("la missione fallisce allo scadere del tempo", () => {
    const s = createGame();
    s.time = 2; // tipo "eliminate"
    s.player.pos = tileCenter(PHONE_BOOTHS[1]);
    updateMissions(s, 1 / 60);
    expect(s.mission?.kind).toBe("eliminate");
    updateMissions(s, 999);
    expect(s.mission).toBeNull();
    expect(s.money).toBe(0);
  });
});
