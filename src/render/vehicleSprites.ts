import { VEHICLES, type VehicleKind } from "../entities/vehicles";
import { cached, carSprite, makeCanvas, shade } from "./sprites";

type Px = (x: number, y: number, w: number, h: number, col: string) => void;

/** Ruote, telaio e carrozzeria di base comuni ai mezzi grandi (muso verso destra) */
const chassis = (px: Px, len: number, wid: number, body: string): void => {
  for (const x of [5, len - 12]) {
    px(x, 0, 6, 2, "#111");
    px(x, wid - 2, 6, 2, "#111");
  }
  px(1, 1, len - 2, wid - 2, "#151515");
  px(2, 2, len - 4, wid - 4, body);
  px(2, 2, len - 4, 1, shade(body, 1.3));
  px(2, wid - 3, len - 4, 1, shade(body, 0.6));
  px(len - 2, 3, 1, 2, "#fff6a0");
  px(len - 2, wid - 5, 1, 2, "#fff6a0");
  px(1, 3, 1, 2, "#d01010");
  px(1, wid - 5, 1, 2, "#d01010");
};

const drawTruck = (px: Px, len: number, wid: number, color: string): void => {
  chassis(px, len, wid, "#b9b9b9");
  // Cassone con nervature, cabina colorata col parabrezza
  for (let x = 4; x < len - 12; x += 4) px(x, 3, 1, wid - 6, "#9a9a9a");
  px(len - 11, 2, 9, wid - 4, color);
  px(len - 5, 3, 2, wid - 6, "#5d8aa8");
  px(len - 12, 2, 1, wid - 4, "#222");
};

const drawBus = (px: Px, len: number, wid: number, color: string): void => {
  chassis(px, len, wid, color);
  // Tetto chiaro con finestrini lungo i due lati e parabrezza
  px(4, 4, len - 10, wid - 8, shade(color, 1.2));
  for (let x = 5; x < len - 8; x += 5) {
    px(x, 2, 3, 1, "#5d8aa8");
    px(x, wid - 3, 3, 1, "#5d8aa8");
  }
  px(len - 5, 3, 2, wid - 6, "#5d8aa8");
  px(10, 6, 4, 4, "#888");
};

const drawAmbulance = (px: Px, len: number, wid: number): void => {
  chassis(px, len, wid, "#f4f4f4");
  // Striscia rossa, croce sul tetto, barra luci e parabrezza
  px(2, 6, len - 12, 3, "#d63031");
  px(8, 4, 8, 7, "#f4f4f4");
  px(11, 4, 2, 7, "#d63031");
  px(9, 6, 6, 3, "#d63031");
  px(len - 11, 3, 2, wid - 6, "#3a6fd8");
  px(len - 7, 3, 3, wid - 6, "#5d8aa8");
};

/** Sprite del veicolo in base al tipo (le auto usano lo sprite classico) */
export const vehicleSprite = (
  kind: VehicleKind,
  color: string,
  police: boolean,
  wreck: boolean,
): HTMLCanvasElement => {
  if (kind === "car") return carSprite(color, police, wreck);
  return cached(`veh:${kind}:${color}:${wreck}`, () => {
    const { len, wid } = VEHICLES[kind];
    const [c, g] = makeCanvas(len, wid);
    const px: Px = (x, y, w, h, col) => {
      g.fillStyle = col;
      g.fillRect(x, y, w, h);
    };
    if (wreck) {
      chassis(px, len, wid, "#2a2a2a");
      px(len / 3, 4, 4, 3, "#111");
      px(len / 2, wid - 7, 5, 3, "#3a2a1a");
    } else DRAWERS[kind](px, len, wid, color);
    return c;
  });
};

/** Taxi: berlina gialla con insegna a scacchi sul tetto */
const drawTaxi = (px: Px, len: number, wid: number, color: string): void => {
  chassis(px, len, wid, color);
  px(9, 3, 9, wid - 6, shade(color, 1.1));
  px(6, 3, 3, wid - 6, "#22303d");
  px(18, 3, 4, wid - 6, "#5d8aa8");
  for (let i = 0; i < 4; i++) px(11 + i * 2, 5 + (i % 2) * 2, 2, 2, "#111");
  px(11, 5, 8, 4, "rgba(255,255,255,0.15)");
};

/** Sportiva: bassa, cofano lungo, abitacolo arretrato, strisce da corsa e alettone */
const drawSport = (px: Px, len: number, wid: number, color: string): void => {
  chassis(px, len, wid, color);
  px(2, 5, len - 4, 1, "#f5f5f5");
  px(2, wid - 6, len - 4, 1, "#f5f5f5");
  px(6, 3, 7, wid - 6, "#22303d");
  px(13, 3, 3, wid - 6, "#5d8aa8");
  px(1, 1, 3, wid - 2, shade(color, 0.5));
};

/** SUV: squadrato e largo, portapacchi sul tetto e ruota di scorta dietro */
const drawSuv = (px: Px, len: number, wid: number, color: string): void => {
  chassis(px, len, wid, color);
  px(6, 3, 16, wid - 6, shade(color, 1.15));
  for (let x = 8; x < 21; x += 4) px(x, 4, 1, wid - 8, "#333");
  px(22, 3, 4, wid - 6, "#5d8aa8");
  px(0, wid / 2 - 3, 2, 6, "#111");
};

/** Furgone: cassone lungo con muso corto e riga della porta scorrevole */
const drawVan = (px: Px, len: number, wid: number, color: string): void => {
  chassis(px, len, wid, color);
  px(3, 3, len - 10, wid - 6, shade(color, 1.1));
  px(14, 2, 1, wid - 4, shade(color, 0.6));
  px(len - 7, 3, 4, wid - 6, "#5d8aa8");
};

const DRAWERS: Record<
  Exclude<VehicleKind, "car">,
  (px: Px, len: number, wid: number, color: string) => void
> = {
  taxi: drawTaxi,
  sport: drawSport,
  suv: drawSuv,
  van: drawVan,
  truck: drawTruck,
  bus: drawBus,
  ambulance: (px, len, wid) => drawAmbulance(px, len, wid),
};
