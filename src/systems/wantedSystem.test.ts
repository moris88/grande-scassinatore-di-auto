import { describe, expect, it } from "vitest";
import { createCop } from "../entities/pedestrian";
import { createGame } from "../game/game";
import { stars } from "../game/state";
import { tileCenter } from "../world/cityMap";
import { SEARCH_PER_STAR, addHeat, loseIdentity, updateWanted } from "./wantedSystem";

/** Partita senza polizia in giro, per controllare la vista a mano */
const quietGame = () => {
  const s = createGame();
  s.cars = s.cars.filter((c) => !c.police);
  s.peds = [];
  return s;
};

const run = (s: ReturnType<typeof createGame>, seconds: number): void => {
  for (let i = 0; i < 60 * seconds; i++) updateWanted(s, 1 / 60);
};

describe("livello ricercato", () => {
  it("se nessuno ti vede, allo scadere della ricerca l'inseguimento finisce", () => {
    const s = quietGame();
    addHeat(s, 2.2);
    expect(stars(s)).toBe(2);
    run(s, 2 * SEARCH_PER_STAR - 1);
    expect(stars(s)).toBe(2);
    run(s, 2);
    expect(stars(s)).toBe(0);
    expect(s.banner?.kind).toBe("escaped");
  });

  it("finché un agente ti vede la ricerca non scorre", () => {
    const s = quietGame();
    addHeat(s, 1.5);
    s.peds.push(createCop({ x: s.player.pos.x + 60, y: s.player.pos.y }));
    run(s, SEARCH_PER_STAR + 5);
    expect(s.seen).toBe(true);
    expect(stars(s)).toBe(1);
  });

  it("gli edifici bloccano la vista", () => {
    const s = quietGame();
    addHeat(s, 1.5);
    // Agente dall'altra parte dell'isolato, a sud del giocatore
    s.player.pos = tileCenter({ x: 8, y: 4 });
    s.peds.push(createCop(tileCenter({ x: 8, y: 12 })));
    updateWanted(s, 1 / 60);
    expect(s.seen).toBe(false);
  });

  it("cambiare veicolo senza essere visto riduce la ricerca", () => {
    const s = quietGame();
    addHeat(s, 3.5);
    loseIdentity(s);
    expect(s.searchTime).toBeLessThanOrEqual(3);
  });

  it("non supera le 4 stelle", () => {
    const s = createGame();
    addHeat(s, 10);
    expect(stars(s)).toBe(4);
  });
});
