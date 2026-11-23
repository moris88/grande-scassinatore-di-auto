/** Sprite pixel art originali, disegnati pixel per pixel su canvas offscreen */

export const CAR_SPRITE_W = 28;
export const CAR_SPRITE_H = 14;
export const PED_SPRITE = 10;

const SKIN = "#e0ac69";
const HAIR = "#3b2a1a";

/** Schiarisce (f > 1) o scurisce (f < 1) un colore esadecimale */
export const shade = (hex: string, f: number): string => {
  const n = Number.parseInt(hex.slice(1), 16);
  const ch = (v: number): number => Math.max(0, Math.min(255, Math.round(v * f)));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `rgb(${r},${g},${b})`;
};

const makeCanvas = (w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D non disponibile");
  return [c, ctx];
};

const cache = new Map<string, HTMLCanvasElement>();

const cached = (key: string, draw: () => HTMLCanvasElement): HTMLCanvasElement => {
  let c = cache.get(key);
  if (!c) {
    c = draw();
    cache.set(key, c);
  }
  return c;
};

/** Auto vista dall'alto, muso verso destra */
export const carSprite = (color: string, police: boolean, wreck: boolean): HTMLCanvasElement =>
  cached(`car:${color}:${police}:${wreck}`, () => {
    const [c, g] = makeCanvas(CAR_SPRITE_W, CAR_SPRITE_H);
    const body = wreck ? "#2a2a2a" : color;
    const px = (x: number, y: number, w: number, h: number, col: string): void => {
      g.fillStyle = col;
      g.fillRect(x, y, w, h);
    };
    // Gomme
    for (const [x, y] of [
      [4, 0],
      [19, 0],
      [4, 12],
      [19, 12],
    ])
      px(x, y, 5, 2, "#111");
    px(1, 1, 26, 12, "#151515");
    px(2, 2, 24, 10, body);
    px(2, 2, 24, 1, shade(body, 1.3));
    px(2, 11, 24, 1, shade(body, 0.6));
    px(25, 2, 1, 10, shade(body, 0.8));
    // Tetto e vetri
    px(9, 3, 8, 8, police && !wreck ? "#ecf0f1" : shade(body, 1.12));
    px(6, 3, 3, 8, "#22303d");
    px(17, 3, 4, 8, "#5d8aa8");
    px(18, 4, 1, 2, "#a9d0ea");
    if (!wreck) {
      px(26, 3, 1, 2, "#fff6a0");
      px(26, 9, 1, 2, "#fff6a0");
      px(1, 3, 1, 2, "#d01010");
      px(1, 9, 1, 2, "#d01010");
    } else {
      // Ammaccature e bruciature
      px(12, 5, 3, 2, "#111");
      px(20, 8, 2, 2, "#3a2a1a");
      px(4, 4, 2, 3, "#111");
    }
    if (police && !wreck) {
      px(12, 4, 2, 3, "#c0392b");
      px(12, 7, 2, 3, "#2e6bd1");
    }
    return c;
  });

/** Pedone visto dall'alto rivolto a destra; frame 0/1 per la camminata */
export const pedSprite = (shirt: string, frame: number): HTMLCanvasElement =>
  cached(`ped:${shirt}:${frame}`, () => {
    const [c, g] = makeCanvas(PED_SPRITE, PED_SPRITE);
    const px = (x: number, y: number, w: number, h: number, col: string): void => {
      g.fillStyle = col;
      g.fillRect(x, y, w, h);
    };
    // Piedi
    const fwd = frame === 0 ? [7, 2] : [7, 6];
    const back = frame === 0 ? [1, 6] : [1, 2];
    px(fwd[0], fwd[1], 2, 2, "#222");
    px(back[0], back[1], 2, 2, "#222");
    // Spalle, braccia, testa
    px(3, 1, 4, 8, shirt);
    px(3, 1, 1, 8, shade(shirt, 0.7));
    px(5, 0, 2, 1, SKIN);
    px(5, 9, 2, 1, SKIN);
    px(4, 3, 3, 4, HAIR);
    px(6, 4, 1, 2, SKIN);
    return c;
  });

/** Pedone a terra */
export const deadPedSprite = (shirt: string): HTMLCanvasElement =>
  cached(`dead:${shirt}`, () => {
    const [c, g] = makeCanvas(16, 16);
    g.fillStyle = "#7a0a0a";
    g.fillRect(3, 4, 10, 8);
    g.fillRect(5, 2, 6, 12);
    g.fillStyle = shirt;
    g.fillRect(5, 6, 6, 4);
    g.fillStyle = SKIN;
    g.fillRect(11, 7, 2, 2);
    g.fillRect(3, 5, 2, 1);
    g.fillRect(3, 10, 2, 1);
    return c;
  });

/** Cassa delle armi */
export const pickupSprite = (weapon: "pistol" | "smg"): HTMLCanvasElement =>
  cached(`pickup:${weapon}`, () => {
    const [c, g] = makeCanvas(12, 12);
    g.fillStyle = "#5a3d1e";
    g.fillRect(0, 0, 12, 12);
    g.fillStyle = "#8b5e34";
    g.fillRect(1, 1, 10, 10);
    g.fillStyle = "#222";
    if (weapon === "pistol") {
      g.fillRect(3, 4, 6, 2);
      g.fillRect(3, 6, 2, 3);
    } else {
      g.fillRect(2, 4, 8, 2);
      g.fillRect(4, 6, 2, 3);
      g.fillRect(7, 6, 1, 2);
    }
    return c;
  });
