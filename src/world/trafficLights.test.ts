import { describe, expect, it } from "vitest";
import { buildCity } from "./cityMap";
import { Dir } from "./tiles";
import {
  LIGHT_PHASE,
  isIntersectionTile,
  isJunctionTile,
  lightFor,
  stopLines,
} from "./trafficLights";

describe("semafori", () => {
  it("orizzontale e verticale non sono mai verdi insieme", () => {
    for (let t = 0; t < LIGHT_PHASE * 4; t += 0.25) {
      const h = lightFor(Dir.E, t);
      const v = lightFor(Dir.N, t);
      expect(h === "red" || v === "red").toBe(true);
      expect(lightFor(Dir.W, t)).toBe(h);
      expect(lightFor(Dir.S, t)).toBe(v);
    }
  });

  it("ogni linea di arresto precede un incrocio", () => {
    const map = buildCity();
    const lines = stopLines(map);
    expect(lines.length).toBeGreaterThan(50);
    for (const l of lines) expect(isIntersectionTile(map, l.tile)).toBe(false);
  });

  it("le curve agli angoli non hanno semaforo, gli incroci a T e a croce sì", () => {
    const map = buildCity();
    expect(isJunctionTile(map, { x: 2, y: 2 })).toBe(true);
    expect(isIntersectionTile(map, { x: 2, y: 2 })).toBe(false); // angolo in alto a sinistra
    expect(isIntersectionTile(map, { x: 3, y: 3 })).toBe(false);
    expect(isIntersectionTile(map, { x: 15, y: 2 })).toBe(true); // incrocio a T
    expect(isIntersectionTile(map, { x: 16, y: 14 })).toBe(true); // incrocio a croce
    expect(stopLines(map).some((l) => l.tile.x <= 4 && l.tile.y <= 4)).toBe(false);
  });
});
