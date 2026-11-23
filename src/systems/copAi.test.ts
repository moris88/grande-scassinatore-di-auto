import { describe, expect, it } from "vitest";
import { Input } from "../engine/input";
import { createCop } from "../entities/pedestrian";
import { createGame, updateGame } from "../game/game";
import { addHeat } from "./wantedSystem";

describe("agenti a piedi", () => {
  it("un agente che ti vede ti corre incontro e ti arresta", () => {
    const s = createGame();
    const input = new Input();
    s.cars = s.cars.filter((c) => !c.police);
    addHeat(s, 1.5);
    s.peds.push(createCop({ x: s.player.pos.x + 80, y: s.player.pos.y }));
    for (let i = 0; i < 60 * 6 && !s.downReason; i++) updateGame(s, input, 1 / 60);
    expect(s.downReason).toBe("busted");
  });

  it("ci sono agenti di pattuglia in città", () => {
    const s = createGame();
    const input = new Input();
    for (let i = 0; i < 60 * 10; i++) updateGame(s, input, 1 / 60);
    expect(s.peds.some((p) => p.role === "cop")).toBe(true);
  });
});
