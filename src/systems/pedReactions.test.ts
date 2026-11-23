import { describe, expect, it } from "vitest";
import { createPed } from "../entities/pedestrian";
import { createGame } from "../game/game";
import { stars } from "../game/state";
import { updatePed } from "./pedAi";
import { CALL_TIME, LINES, reactToAccident, reactToCrime, updatePedChatter } from "./pedReactions";
import { punch } from "./weaponSystem";

/** Partita con un gruppo di pedoni attorno al giocatore */
const crowd = (n: number) => {
  const s = createGame();
  s.peds = [];
  s.cars = s.cars.filter((c) => !c.police);
  for (let i = 0; i < n; i++)
    s.peds.push(createPed({ x: s.player.pos.x + 30 + (i % 10) * 6, y: s.player.pos.y }));
  return s;
};

describe("reazioni dei pedoni", () => {
  it("dopo un reato c'è chi scappa, chi guarda e chi chiama la polizia", () => {
    const s = crowd(60);
    reactToCrime(s, s.player.pos);
    const states = new Set(s.peds.map((p) => p.state));
    expect(states.has("flee")).toBe(true);
    expect(states.has("watch")).toBe(true);
    expect(states.has("call")).toBe(true);
  });

  it("se nessuno lo ferma, chi telefona fa salire il ricercato", () => {
    const s = crowd(1);
    const p = s.peds[0];
    p.state = "call";
    p.reactTime = CALL_TIME;
    for (let i = 0; i < 60 * (CALL_TIME + 0.5); i++) updatePed(s, p, 1 / 60);
    expect(stars(s)).toBe(0); // 0.4 di ricercato: non ancora una stella
    expect(s.heat).toBeGreaterThan(0);
    expect(p.state).toBe("flee");
  });

  it("il pedone preso a pugni dice qualcosa", () => {
    const s = crowd(1);
    const p = s.peds[0];
    p.pos = { x: s.player.pos.x + 10, y: s.player.pos.y };
    s.player.angle = 0;
    punch(s);
    expect(LINES.hit).toContain(p.speech?.text);
  });

  it("con un'arma in pugno i pedoni vicini implorano e scappano", () => {
    const s = crowd(1);
    s.player.weapon = "pistol";
    updatePedChatter(s, 1 / 60);
    expect(LINES.armed).toContain(s.peds[0].speech?.text);
    expect(s.peds[0].state).toBe("flee");
  });

  it("dopo un incidente i passanti si fermano a guardare", () => {
    const s = crowd(30);
    reactToAccident(s, s.player.pos);
    expect(s.peds.some((p) => p.state === "watch")).toBe(true);
  });
});
