import { describe, expect, it } from "vitest";
import { createPed } from "../entities/pedestrian";
import { createGame } from "../game/game";
import { PUNCH_ANIM, punch } from "./weaponSystem";

describe("pugni", () => {
  it("due pugni stendono un pedone, con animazione e spinta all'indietro", () => {
    const s = createGame();
    s.peds = [];
    const p = s.player;
    p.angle = 0;
    const ped = createPed({ x: p.pos.x + 10, y: p.pos.y });
    s.peds.push(ped);

    punch(s);
    expect(p.punchTime).toBe(PUNCH_ANIM);
    expect(ped.state).toBe("flee");
    expect(ped.health).toBe(50);
    const firstSide = p.punchLeft;

    ped.pos = { x: p.pos.x + 10, y: p.pos.y };
    punch(s);
    expect(p.punchLeft).toBe(!firstSide);
    expect(ped.state).toBe("dead");
  });

  it("il pugno a vuoto non colpisce nessuno", () => {
    const s = createGame();
    s.peds = [createPed({ x: s.player.pos.x + 60, y: s.player.pos.y })];
    s.player.angle = 0;
    punch(s);
    expect(s.peds[0].health).toBe(100);
  });
});
