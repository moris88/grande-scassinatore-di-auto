import { describe, expect, it } from "vitest";
import { Input } from "../engine/input";
import { tileAtWorld } from "../world/cityMap";
import { Tile } from "../world/tiles";
import { createGame, updateGame } from "./game";
import { stars } from "./state";

describe("simulazione di gioco", () => {
  it("60 secondi di traffico senza errori e con auto sulle strade", () => {
    const s = createGame();
    // Input mai collegato alla finestra: nessun tasto premuto
    const input = new Input();
    const step = (seconds: number): void => {
      for (let i = 0; i < 60 * seconds; i++) updateGame(s, input, 1 / 60);
    };
    step(55);
    // Posizioni a 55 s per misurare chi si muove davvero (indipendente dai semafori)
    const before = new Map(s.cars.map((c) => [c, { ...c.pos }]));
    step(5);
    expect(s.cars.length).toBeGreaterThan(10);
    expect(s.peds.length).toBeGreaterThan(10);
    for (const c of s.cars) {
      expect(Number.isFinite(c.pos.x) && Number.isFinite(c.pos.y)).toBe(true);
      expect(tileAtWorld(s.map, c.pos)).not.toBe(Tile.Building);
    }
    const moving = s.cars.filter((c) => {
      const p = before.get(c);
      return c.driver === "ai" && p && Math.hypot(c.pos.x - p.x, c.pos.y - p.y) > 64;
    });
    expect(moving.length).toBeGreaterThan(8);
  });

  it("con 3 stelle la polizia insegue senza crash", () => {
    const s = createGame();
    s.heat = 3.5;
    const input = new Input();
    for (let i = 0; i < 60 * 30 && !s.downReason; i++) {
      s.searchTime = 99; // la polizia non rinuncia durante il test
      updateGame(s, input, 1 / 60);
    }
    expect(stars(s) >= 3 || s.downReason !== null).toBe(true);
  });
});
