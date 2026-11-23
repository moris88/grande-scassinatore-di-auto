import { describe, expect, it } from "vitest";
import { buildCity, laneAt } from "./cityMap";
import { findLaneRoute, nearestLaneTile } from "./laneRoute";
import { Dir, dirVector } from "./tiles";

describe("percorsi sulle corsie", () => {
  const map = buildCity();

  it("trova un percorso valido tra due punti lontani della città", () => {
    const from = { x: 10, y: 3 }; // corsia verso est
    const goal = nearestLaneTile(map, { x: 50, y: 50 });
    if (!goal) throw new Error("nessuna corsia vicino all'obiettivo");
    const route = findLaneRoute(map, from, Dir.E, goal);
    expect(route).not.toBeNull();
    if (!route) return;
    expect(route[route.length - 1]).toEqual(goal);
    // Ogni passo è adiacente e percorribile nel senso di marcia
    let cur = from;
    for (const step of route) {
      const dx = step.x - cur.x;
      const dy = step.y - cur.y;
      expect(Math.abs(dx) + Math.abs(dy)).toBe(1);
      const dir = [Dir.N, Dir.E, Dir.S, Dir.W].find((d) => {
        const v = dirVector(d);
        return v.x === dx && v.y === dy;
      });
      expect(dir && laneAt(map, cur.x, cur.y) & dir).toBeTruthy();
      cur = step;
    }
  });
});
