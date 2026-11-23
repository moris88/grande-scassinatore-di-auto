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
    } else if (kind === "truck") drawTruck(px, len, wid, color);
    else if (kind === "bus") drawBus(px, len, wid, color);
    else drawAmbulance(px, len, wid);
    return c;
  });
};
