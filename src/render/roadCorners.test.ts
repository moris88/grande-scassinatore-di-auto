import { describe, expect, it } from "vitest";
import { buildCity } from "../world/cityMap";
import { isIntersectionTile } from "../world/trafficLights";
import { cornerBlocks } from "./roadCorners";

describe("curve agli angoli", () => {
  it("trova le curve ai 4 angoli della città e nessun incrocio con semaforo", () => {
    const map = buildCity();
    const blocks = cornerBlocks(map);
    for (const [x, y] of [
      [2, 2],
      [60, 2],
      [2, 60],
      [60, 60],
    ])
      expect(blocks.some((b) => b.bx === x && b.by === y)).toBe(true);
    for (const b of blocks) expect(isIntersectionTile(map, { x: b.bx, y: b.by })).toBe(false);
  });
});
