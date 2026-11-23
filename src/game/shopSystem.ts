import type { Input } from "../engine/input";
import { angleTo, dist } from "../engine/math";
import { SHOPS, type ShopKind, tileCenter } from "../world/cityMap";
import { purchaseNotice, shopItems } from "./shopCatalog";
import type { GameState } from "./state";

/** Distanza dal centro della tile davanti alla porta per poter entrare */
const DOOR_RANGE = 22;

/** Negozio la cui porta è raggiungibile dal giocatore a piedi (null se nessuno) */
export const shopAtDoor = (s: GameState): ShopKind | null => {
  if (s.player.car) return null;
  const sh = SHOPS.find((x) => dist(tileCenter(x.outside), s.player.pos) < DOOR_RANGE);
  return sh ? sh.kind : null;
};

export const enterShop = (s: GameState, kind: ShopKind): void => {
  s.shop = {
    kind,
    notice: "Benvenuto! Scegli con i tasti numerici",
    dealer: { color: 0, engine: false, armor: false, brakes: false },
  };
};

/** Si esce sul marciapiede davanti alla porta, voltati verso la strada */
const exitShop = (s: GameState): void => {
  const sh = SHOPS.find((x) => x.kind === s.shop?.kind);
  s.shop = null;
  if (!sh) return;
  const out = tileCenter(sh.outside);
  s.player.pos = out;
  s.player.angle = angleTo(tileCenter(sh.door), out);
};

export const buyItem = (s: GameState, index: number): void => {
  const shop = s.shop;
  if (!shop) return;
  const item = shopItems(s, shop.kind)[index];
  if (!item) return;
  if (!item.free && s.money < item.price) {
    shop.notice = "Non hai abbastanza soldi";
    return;
  }
  const error = item.apply(s);
  if (error) {
    shop.notice = error;
    return;
  }
  if (!item.free) s.money -= item.price;
  shop.notice = purchaseNotice(s, shop.kind, item);
};

/** Dentro il negozio il mondo è fermo: tasti 1-9 per comprare, E o Esc per uscire */
export const updateShop = (s: GameState, input: Input): void => {
  if (input.wasPressed("KeyE", "Enter", "Escape")) {
    exitShop(s);
    return;
  }
  for (let i = 0; i < 9; i++) if (input.wasPressed(`Digit${i + 1}`)) buyItem(s, i);
};
