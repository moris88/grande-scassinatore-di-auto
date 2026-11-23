import { type CityMap, MAP_H, MAP_W, SPRAY_SHOP, laneAt, tileAt } from "../world/cityMap";
import { Dir, TILE, Tile } from "../world/tiles";
import { shade } from "./sprites";

const ROOFS = ["#7a5c4f", "#6b6b7a", "#8a7f6a", "#5e6e5e", "#7d4f4f", "#6a5a72"];

/** Hash deterministico per dettagli "casuali" ma stabili */
const hash = (x: number, y: number, k = 0): number => {
  let h = (x * 374761393 + y * 668265263 + k * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};

type Px = (x: number, y: number, w: number, h: number, col: string) => void;

const drawRoad = (map: CityMap, tx: number, ty: number, px: Px): void => {
  px(0, 0, TILE, TILE, "#3a3a3e");
  for (let i = 0; i < 10; i++)
    px(Math.floor(hash(tx, ty, i) * 31), Math.floor(hash(ty, tx, i) * 31), 1, 1, "#45454a");
  const l = laneAt(map, tx, ty);
  // Linea di mezzeria tratteggiata, solo fuori dagli incroci
  if (l === Dir.W && laneAt(map, tx, ty + 1) === Dir.E)
    for (let x = 2; x < TILE; x += 16) px(x, TILE - 1, 9, 1, "#e8d44d");
  if (l === Dir.E && laneAt(map, tx, ty - 1) === Dir.W)
    for (let x = 2; x < TILE; x += 16) px(x, 0, 9, 1, "#e8d44d");
  if (l === Dir.S && laneAt(map, tx + 1, ty) === Dir.N)
    for (let y = 2; y < TILE; y += 16) px(TILE - 1, y, 1, 9, "#e8d44d");
  if (l === Dir.N && laneAt(map, tx - 1, ty) === Dir.S)
    for (let y = 2; y < TILE; y += 16) px(0, y, 1, 9, "#e8d44d");
};

const drawSidewalk = (map: CityMap, tx: number, ty: number, px: Px): void => {
  px(0, 0, TILE, TILE, "#9c9a94");
  for (let i = 0; i < TILE; i += 8) {
    px(i, 0, 1, TILE, "#8b8983");
    px(0, i, TILE, 1, "#8b8983");
  }
  // Cordolo verso la strada
  const road = (dx: number, dy: number): boolean => tileAt(map, tx + dx, ty + dy) === Tile.Road;
  if (road(0, -1)) px(0, 0, TILE, 2, "#c9c6bd");
  if (road(0, 1)) px(0, TILE - 2, TILE, 2, "#c9c6bd");
  if (road(-1, 0)) px(0, 0, 2, TILE, "#c9c6bd");
  if (road(1, 0)) px(TILE - 2, 0, 2, TILE, "#c9c6bd");
};

const drawBuilding = (map: CityMap, tx: number, ty: number, px: Px): void => {
  const roof = ROOFS[Math.floor(hash(Math.floor(tx / 7), Math.floor(ty / 6), 3) * ROOFS.length)];
  px(0, 0, TILE, TILE, roof);
  const wall = (dx: number, dy: number): boolean => tileAt(map, tx + dx, ty + dy) !== Tile.Building;
  const edge = shade(roof, 0.55);
  const lip = shade(roof, 1.25);
  if (wall(0, -1)) {
    px(0, 0, TILE, 3, edge);
    px(0, 3, TILE, 1, lip);
  }
  if (wall(0, 1)) px(0, TILE - 3, TILE, 3, edge);
  if (wall(-1, 0)) {
    px(0, 0, 3, TILE, edge);
    px(3, 0, 1, TILE, lip);
  }
  if (wall(1, 0)) px(TILE - 3, 0, 3, TILE, edge);
  const r = hash(tx, ty, 7);
  if (r < 0.18) {
    // Condizionatore
    px(10, 10, 10, 8, "#b8b8b8");
    px(11, 11, 8, 6, "#8d8d8d");
    for (let i = 12; i < 19; i += 2) px(i, 12, 1, 4, "#5a5a5a");
  } else if (r < 0.3) {
    // Lucernario
    px(8, 9, 14, 12, "#2c3e50");
    px(9, 10, 12, 10, "#5d8aa8");
    px(10, 11, 3, 2, "#a9d0ea");
  } else if (r < 0.38) {
    // Sfiato
    px(14, 14, 5, 5, "#333");
    px(15, 15, 3, 3, "#111");
  }
};

const drawGrass = (tx: number, ty: number, px: Px): void => {
  px(0, 0, TILE, TILE, "#3f7d3a");
  for (let i = 0; i < 14; i++) {
    const x = Math.floor(hash(tx, ty, i) * 31);
    const y = Math.floor(hash(ty, tx, i + 50) * 31);
    px(x, y, 1, 2, i % 5 === 0 ? "#e8e05a" : "#2f6a2b");
  }
  if (hash(tx, ty, 99) < 0.12) {
    // Albero
    px(8, 8, 16, 16, "#1f4f1c");
    px(10, 10, 12, 12, "#2d6b28");
    px(12, 11, 4, 3, "#3f8a39");
  }
};

const drawWater = (tx: number, ty: number, px: Px): void => {
  px(0, 0, TILE, TILE, "#1f4e79");
  for (let i = 0; i < 5; i++)
    px(Math.floor(hash(tx, ty, i) * 26), Math.floor(hash(ty, tx, i) * 31), 6, 1, "#3a73a8");
};

const drawPhone = (map: CityMap, tx: number, ty: number, px: Px): void => {
  drawSidewalk(map, tx, ty, px);
  // Cabina telefonica vista dall'alto: ombra, telaio, vetri, tetto a padiglione
  px(9, 9, 18, 18, "rgba(0,0,0,0.35)");
  px(6, 6, 20, 20, "#5e0f0f");
  px(7, 7, 18, 18, "#b3201d");
  // Vetri sui quattro lati
  px(9, 7, 14, 2, "#9fd3e6");
  px(9, 23, 14, 2, "#9fd3e6");
  px(7, 9, 2, 14, "#9fd3e6");
  px(23, 9, 2, 14, "#9fd3e6");
  // Tetto con falde (bordo chiaro in alto a sinistra, scuro in basso a destra)
  px(10, 10, 12, 12, "#d6312b");
  px(10, 10, 12, 1, "#ef6a5f");
  px(10, 10, 1, 12, "#ef6a5f");
  px(10, 21, 12, 1, "#7d1512");
  px(21, 10, 1, 12, "#7d1512");
  // Insegna "TEL" sul lato alto e lampada (spenta) al centro del tetto
  px(11, 3, 10, 4, "#f5f5f5");
  px(12, 4, 1, 2, "#222");
  px(15, 4, 1, 2, "#222");
  px(18, 4, 1, 2, "#222");
  px(14, 14, 4, 4, "#5a4a1a");
};

/** Asfalto del parcheggio con le strisce bianche degli stalli (una tile = uno stallo) */
const drawParking = (map: CityMap, tx: number, ty: number, px: Px): void => {
  const covered = tileAt(map, tx, ty) === Tile.ParkingCovered;
  px(0, 0, TILE, TILE, covered ? "#4a4842" : "#3d3d42");
  for (let i = 0; i < 6; i++)
    px(Math.floor(hash(tx, ty, i) * 31), Math.floor(hash(ty, tx, i) * 31), 1, 1, "#4c4c52");
  const same = (dx: number, dy: number): boolean =>
    tileAt(map, tx + dx, ty + dy) === tileAt(map, tx, ty);
  // Stalli: linee sui lati verso altri stalli, bordo giallo verso l'esterno
  if (same(-1, 0)) px(0, 3, 1, TILE - 6, "#e8e8e8");
  if (same(1, 0)) px(TILE - 1, 3, 1, TILE - 6, "#e8e8e8");
  if (!same(0, -1) && tileAt(map, tx, ty - 1) === Tile.Building) px(0, 0, TILE, 2, "#e1b12c");
  if (!same(0, 1) && tileAt(map, tx, ty + 1) === Tile.Building) px(0, TILE - 2, TILE, 2, "#e1b12c");
};

const drawSpray = (tx: number, ty: number, px: Px): void => {
  px(0, 0, TILE, TILE, "#4a4a4a");
  for (let i = 0; i < TILE; i += 8) px(i, (tx + ty) % 2 === 0 ? 0 : 30, 4, 2, "#e1b12c");
  px(4, 4, 24, 24, "#555");
};

/** Disegna l'intera città su un unico canvas, una volta sola */
export const renderMap = (map: CityMap): HTMLCanvasElement => {
  const c = document.createElement("canvas");
  c.width = MAP_W * TILE;
  c.height = MAP_H * TILE;
  const g = c.getContext("2d");
  if (!g) throw new Error("Canvas 2D non disponibile");
  for (let ty = 0; ty < MAP_H; ty++) {
    for (let tx = 0; tx < MAP_W; tx++) {
      const ox = tx * TILE;
      const oy = ty * TILE;
      const px: Px = (x, y, w, h, col) => {
        g.fillStyle = col;
        g.fillRect(ox + x, oy + y, w, h);
      };
      const t = tileAt(map, tx, ty);
      if (t === Tile.Road) drawRoad(map, tx, ty, px);
      else if (t === Tile.Sidewalk) drawSidewalk(map, tx, ty, px);
      else if (t === Tile.Building) drawBuilding(map, tx, ty, px);
      else if (t === Tile.Grass) drawGrass(tx, ty, px);
      else if (t === Tile.Water) drawWater(tx, ty, px);
      else if (t === Tile.Phone) drawPhone(map, tx, ty, px);
      else if (t === Tile.Parking || t === Tile.ParkingCovered) drawParking(map, tx, ty, px);
      else drawSpray(tx, ty, px);
    }
  }
  g.fillStyle = "#e1b12c";
  g.font = "bold 9px monospace";
  g.fillText("VERNICIA", SPRAY_SHOP.x * TILE + 10, SPRAY_SHOP.y * TILE + 36);
  return c;
};
