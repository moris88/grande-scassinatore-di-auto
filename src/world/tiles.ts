export const TILE = 32;

export enum Tile {
  Building = 0,
  Road = 1,
  Sidewalk = 2,
  Grass = 3,
  Water = 4,
  Phone = 5,
  SprayShop = 6,
  Parking = 7,
  /** Parcheggio coperto: dall'alto non si vede chi c'è dentro (nascondiglio) */
  ParkingCovered = 8,
}

/** Direzioni di corsia come bitmask */
export enum Dir {
  N = 1,
  E = 2,
  S = 4,
  W = 8,
}

export const ALL_DIRS = [Dir.N, Dir.E, Dir.S, Dir.W] as const;

export const dirVector = (d: Dir): { x: number; y: number } => {
  switch (d) {
    case Dir.N:
      return { x: 0, y: -1 };
    case Dir.E:
      return { x: 1, y: 0 };
    case Dir.S:
      return { x: 0, y: 1 };
    default:
      return { x: -1, y: 0 };
  }
};

export const dirAngle = (d: Dir): number => {
  const v = dirVector(d);
  return Math.atan2(v.y, v.x);
};

export const oppositeDir = (d: Dir): Dir =>
  d === Dir.N ? Dir.S : d === Dir.S ? Dir.N : d === Dir.E ? Dir.W : Dir.E;

/** Blocca le auto */
export const blocksCars = (t: Tile): boolean => t === Tile.Building || t === Tile.Water;

/** Blocca i pedoni (l'acqua uccide, ma la trattiamo come muro) */
export const blocksPeds = (t: Tile): boolean => t === Tile.Building || t === Tile.Water;

export const isWalkable = (t: Tile): boolean =>
  t === Tile.Sidewalk ||
  t === Tile.Grass ||
  t === Tile.Phone ||
  t === Tile.Parking ||
  t === Tile.ParkingCovered;
