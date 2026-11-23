import { createCar } from "../entities/car";
import { MAX_STAMINA } from "../entities/player";
import { loseIdentity } from "../systems/wantedSystem";
import { SHOPS, type ShopKind, tileCenter } from "../world/cityMap";
import { type DealerConfig, type GameState, stars } from "./state";

export interface ShopItem {
  label: string;
  price: number;
  /** Applica l'acquisto; ritorna un messaggio d'errore se non ha senso comprarlo ora.
   * `free` = opzione da scegliere, il prezzo è solo indicativo e non viene addebitato. */
  apply: (s: GameState) => string | null;
  free?: boolean;
}

const MAX_HEALTH = 100;
const CAR_BASE_PRICE = 400;
const OPTIONS = { engine: 300, armor: 400, brakes: 200 } as const;
const OPTION_LABELS = {
  engine: "Motore potenziato",
  armor: "Blindatura",
  brakes: "Freni potenziati",
};

export const JACKETS = [
  { name: "rossa", color: "#c0392b" },
  { name: "blu", color: "#2e86c1" },
  { name: "gialla", color: "#f1c40f" },
  { name: "nera", color: "#222222" },
  { name: "bianca", color: "#ecf0f1" },
];

export const CAR_COLORS = [
  { name: "Rosso", color: "#c0392b" },
  { name: "Nero", color: "#1e1e1e" },
  { name: "Argento", color: "#bdc3c7" },
  { name: "Verde", color: "#27ae60" },
  { name: "Viola", color: "#8e44ad" },
];

const heal = (amount: number) => (s: GameState) => {
  if (s.player.health >= MAX_HEALTH) return "Sei già in piena salute";
  s.player.health = Math.min(MAX_HEALTH, s.player.health + amount);
  return null;
};

const weapon = (kind: "pistol" | "smg", rounds: number) => (s: GameState) => {
  s.player.ammo[kind] += rounds;
  s.player.weapon = kind;
  return null;
};

/** Nuova giacca: se la polizia ti cerca senza vederti, non ti riconosce più */
const jacket = (color: string) => (s: GameState) => {
  if (s.player.shirt === color) return "La stai già indossando";
  s.player.shirt = color;
  loseIdentity(s);
  return null;
};

const dealerPrice = (d: DealerConfig): number =>
  CAR_BASE_PRICE +
  (d.engine ? OPTIONS.engine : 0) +
  (d.armor ? OPTIONS.armor : 0) +
  (d.brakes ? OPTIONS.brakes : 0);

/** L'auto comprata aspetta parcheggiata davanti al concessionario */
const deliverCar = (s: GameState, d: DealerConfig): null => {
  const shop = SHOPS.find((x) => x.kind === "cars");
  if (!shop) return null;
  const car = createCar(tileCenter(shop.outside), 0);
  car.color = CAR_COLORS[d.color].color;
  car.upgrades = { engine: d.engine, armor: d.armor, brakes: d.brakes };
  car.owned = true;
  s.cars.push(car);
  return null;
};

const dealerItems = (s: GameState): ShopItem[] => {
  const d = s.shop?.dealer;
  if (!d) return [];
  const toggle = (key: keyof typeof OPTIONS): ShopItem => ({
    label: `${OPTION_LABELS[key]}: ${d[key] ? "SÌ" : "no"} (+$${OPTIONS[key]})`,
    price: 0,
    free: true,
    apply: () => {
      d[key] = !d[key];
      return null;
    },
  });
  return [
    {
      label: `Colore: ${CAR_COLORS[d.color].name} (cambia)`,
      price: 0,
      free: true,
      apply: () => {
        d.color = (d.color + 1) % CAR_COLORS.length;
        return null;
      },
    },
    toggle("engine"),
    toggle("armor"),
    toggle("brakes"),
    { label: "COMPRA L'AUTO", price: dealerPrice(d), apply: (st) => deliverCar(st, d) },
  ];
};

export const SHOP_TITLES: Record<ShopKind, string> = {
  guns: "ARMERIA",
  food: "ALIMENTARI",
  clothes: "VESTITI",
  cars: "CONCESSIONARIO",
  hospital: "OSPEDALE",
};

/** Merce del negozio in cui si trova il giocatore (il concessionario dipende dalle scelte) */
export const shopItems = (s: GameState, kind: ShopKind): ShopItem[] => {
  if (kind === "guns")
    return [
      { label: "Pistola (+30 colpi)", price: 200, apply: weapon("pistol", 30) },
      { label: "Mitraglietta (+120 colpi)", price: 600, apply: weapon("smg", 120) },
    ];
  if (kind === "food")
    return [
      { label: "Acqua (+10 salute)", price: 5, apply: heal(10) },
      { label: "Panino (+25 salute)", price: 20, apply: heal(25) },
      { label: "Pizza (+60 salute)", price: 45, apply: heal(60) },
      {
        label: "Bibita energetica (corsa al massimo)",
        price: 15,
        apply: (st) => {
          if (st.player.stamina >= MAX_STAMINA) return "Hai già fiato da vendere";
          st.player.stamina = MAX_STAMINA;
          st.player.exhausted = false;
          return null;
        },
      },
    ];
  if (kind === "hospital")
    return [{ label: "♥ Cuore (salute al 100%)", price: 0, apply: heal(MAX_HEALTH) }];
  if (kind === "clothes")
    return JACKETS.map((j) => ({ label: `Giacca ${j.name}`, price: 50, apply: jacket(j.color) }));
  return dealerItems(s);
};

/** Avviso dopo un acquisto riuscito */
export const purchaseNotice = (s: GameState, kind: ShopKind, item: ShopItem): string => {
  if (kind === "cars" && !item.free) return "Auto consegnata: ti aspetta qui fuori!";
  if (kind === "clothes" && stars(s) > 0 && !s.seen) return "Irriconoscibile: la polizia ti perde";
  return item.free ? "Scelta aggiornata" : `Acquistato: ${item.label}`;
};
