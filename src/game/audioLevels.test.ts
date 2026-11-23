import { describe, expect, it } from "vitest";
import { Input } from "../engine/input";
import { RAIL_ROW, tileCenter } from "../world/cityMap";
import { ambientLevels, stepSurface } from "./audioLevels";
import { createGame } from "./game";
import { updatePlayerControl } from "./playerControl";

class Forward extends Input {
  override axisY(): number {
    return 1;
  }
}

describe("suoni", () => {
  it("il passo cambia suono con la superficie", () => {
    const s = createGame();
    const at = (x: number, y: number) => {
      s.player.pos = tileCenter({ x, y });
      return stepSurface(s);
    };
    expect(at(10, 3)).toBe("stepAsphalt");
    expect(at(10, 4)).toBe("stepStone");
    expect(at(8, 20)).toBe("stepGrass"); // parco
    expect(at(25, RAIL_ROW)).toBe("stepGravel"); // massicciata
  });

  it("camminando si sentono i passi", () => {
    const s = createGame();
    s.player.angle = 0; // lungo il marciapiede
    for (let i = 0; i < 60; i++) updatePlayerControl(s, new Forward(), 1 / 60);
    expect(s.sounds.filter((e) => e.startsWith("step")).length).toBeGreaterThanOrEqual(3);
  });

  it("vicino al parco ci sono più uccellini che in mezzo ai palazzi", () => {
    const s = createGame();
    s.camera.pos = tileCenter({ x: 8, y: 20 });
    const park = ambientLevels(s).nature;
    s.camera.pos = tileCenter({ x: 50, y: 8 });
    expect(park).toBeGreaterThan(ambientLevels(s).nature);
  });
});
