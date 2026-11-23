import type { Input } from "../engine/input";
import { angleTo, dist } from "../engine/math";
import { MAX_STAMINA } from "../entities/player";
import { SHOPS, type ShopKind, tileCenter } from "../world/cityMap";
import type { GameState } from "./state";

const MAX_HEALTH = 100;
/** Distanza dal centro della tile davanti alla porta per poter entrare */
const DOOR_RANGE = 22;

interface ShopItem {
  label: string;
  price: number;
  /** Applica l'acquisto; ritorna un messaggio d'errore se non ha senso comprarlo ora */
  apply: (s: GameState) => string | null;
}

const heal =
  (amount: number) =>
  (s: GameState): string | null => {
    if (s.player.health >= MAX_HEALTH) return "Sei già in piena salute";
    s.player.health = Math.min(MAX_HEALTH, s.player.health + amount);
    return null;
  };

const weapon =
  (kind: "pistol" | "smg", rounds: number) =>
  (s: GameState): string | null => {
    s.player.ammo[kind] += rounds;
    s.player.weapon = kind;
    return null;
  };

export const CATALOG: Record<ShopKind, { title: string; items: ShopItem[] }> = {
  guns: {
    title: "ARMERIA",
    items: [
      { label: "Pistola (+30 colpi)", price: 200, apply: weapon("pistol", 30) },
      { label: "Mitraglietta (+120 colpi)", price: 600, apply: weapon("smg", 120) },
    ],
  },
  food: {
    title: "ALIMENTARI",
    items: [
      { label: "Acqua (+10 salute)", price: 5, apply: heal(10) },
      { label: "Panino (+25 salute)", price: 20, apply: heal(25) },
      { label: "Pizza (+60 salute)", price: 45, apply: heal(60) },
      {
        label: "Bibita energetica (corsa al massimo)",
        price: 15,
        apply: (s) => {
          if (s.player.stamina >= MAX_STAMINA) return "Hai già fiato da vendere";
          s.player.stamina = MAX_STAMINA;
          s.player.exhausted = false;
          return null;
        },
      },
    ],
  },
};

/** Negozio la cui porta è raggiungibile dal giocatore a piedi (null se nessuno) */
export const shopAtDoor = (s: GameState): ShopKind | null => {
  if (s.player.car) return null;
  const sh = SHOPS.find((x) => dist(tileCenter(x.outside), s.player.pos) < DOOR_RANGE);
  return sh ? sh.kind : null;
};

export const enterShop = (s: GameState, kind: ShopKind): void => {
  s.shop = { kind, notice: "Benvenuto! Scegli con i tasti numerici" };
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
  if (!s.shop) return;
  const item = CATALOG[s.shop.kind].items[index];
  if (!item) return;
  if (s.money < item.price) {
    s.shop.notice = "Non hai abbastanza soldi";
    return;
  }
  const error = item.apply(s);
  if (error) {
    s.shop.notice = error;
    return;
  }
  s.money -= item.price;
  s.shop.notice = `Acquistato: ${item.label}`;
};

/** Dentro il negozio il mondo è fermo: tasti 1-9 per comprare, E o Esc per uscire */
export const updateShop = (s: GameState, input: Input): void => {
  if (input.wasPressed("KeyE", "Enter", "Escape")) {
    exitShop(s);
    return;
  }
  for (let i = 0; i < 9; i++) if (input.wasPressed(`Digit${i + 1}`)) buyItem(s, i);
};
