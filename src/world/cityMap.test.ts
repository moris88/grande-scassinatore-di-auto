import { describe, expect, it } from "vitest";
import { chooseNext } from "../systems/trafficAi";
import {
  HOSPITAL,
  MAP_H,
  MAP_W,
  PARKING_LOTS,
  PHONE_BOOTHS,
  PLAYER_START,
  POLICE_STATION,
  SHOPS,
  buildCity,
  laneAt,
  tileAt,
} from "./cityMap";
import { ALL_DIRS, Tile, isWalkable } from "./tiles";

describe("cityMap", () => {
  const map = buildCity();

  it("ha i bordi d'acqua", () => {
    expect(tileAt(map, 0, 0)).toBe(Tile.Water);
    expect(tileAt(map, MAP_W - 1, MAP_H - 1)).toBe(Tile.Water);
  });

  it("i punti speciali sono su tile pedonali", () => {
    for (const p of [PLAYER_START, HOSPITAL, POLICE_STATION, ...SHOPS.map((sh) => sh.outside)])
      expect(isWalkable(tileAt(map, p.x, p.y))).toBe(true);
    for (const b of PHONE_BOOTHS) expect(tileAt(map, b.x, b.y)).toBe(Tile.Phone);
  });

  it("i parcheggi sono interi e accessibili da un marciapiede", () => {
    for (const p of PARKING_LOTS) {
      const kind = p.covered ? Tile.ParkingCovered : Tile.Parking;
      let sidewalk = false;
      for (let y = p.y - 1; y <= p.y + p.h; y++)
        for (let x = p.x - 1; x <= p.x + p.w; x++) {
          const inside = x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h;
          if (inside) expect(tileAt(map, x, y)).toBe(kind);
          else if (tileAt(map, x, y) === Tile.Sidewalk) sidewalk = true;
        }
      expect(sidewalk).toBe(true);
    }
  });

  it("ogni corsia ha sempre una tile successiva valida", () => {
    for (let y = 0; y < MAP_H; y++)
      for (let x = 0; x < MAP_W; x++) {
        const l = laneAt(map, x, y);
        for (const d of ALL_DIRS) if (l & d) expect(chooseNext(map, { x, y }, d)).not.toBeNull();
      }
  });
});
