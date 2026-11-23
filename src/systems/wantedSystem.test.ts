import { describe, expect, it } from "vitest";
import { createGame } from "../game/game";
import { stars } from "../game/state";
import { addHeat, updateWanted } from "./wantedSystem";

describe("livello ricercato", () => {
  it("sale con i reati e scende senza polizia vicina", () => {
    const s = createGame();
    addHeat(s, 2.2);
    expect(stars(s)).toBe(2);
    for (let i = 0; i < 60 * 15; i++) updateWanted(s, 1 / 60);
    expect(stars(s)).toBe(1);
  });

  it("non supera le 4 stelle", () => {
    const s = createGame();
    addHeat(s, 10);
    expect(stars(s)).toBe(4);
  });
});
