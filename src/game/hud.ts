import type { WeaponKind } from "../entities/types";
import { CATALOG } from "./shopSystem";
import { type GameState, stars } from "./state";

export interface HudData {
  money: number;
  multiplier: number;
  lives: number;
  stars: number;
  health: number;
  carHealth: number | null;
  weapon: WeaponKind;
  ammo: number;
  missionTitle: string | null;
  missionTime: number | null;
  message: string | null;
  /** Banner grande in corso (missione compiuta / polizia seminata), null se non c'è */
  banner: { kind: "success" | "escaped"; detail: string } | null;
  /** Secondi di ricerca rimasti se la polizia ti ha perso di vista, null se ti vede o non ti cerca */
  searchLeft: number | null;
  downReason: "wasted" | "busted" | null;
  gameOver: boolean;
  /** Barra della corsa 0..100 (null in auto) e se è esaurita */
  stamina: number | null;
  exhausted: boolean;
  /** Negozio aperto: titolo, merce e ultimo avviso */
  shop: ShopHud | null;
}

export interface ShopHud {
  title: string;
  notice: string;
  items: { label: string; price: number; affordable: boolean }[];
}

const shopHud = (s: GameState): ShopHud | null => {
  if (!s.shop) return null;
  const { title, items } = CATALOG[s.shop.kind];
  return {
    title,
    notice: s.shop.notice,
    items: items.map((i) => ({ label: i.label, price: i.price, affordable: s.money >= i.price })),
  };
};

export const makeHud = (s: GameState): HudData => ({
  money: s.money,
  multiplier: s.multiplier,
  lives: s.lives,
  stars: stars(s),
  health: Math.max(0, Math.round(s.player.health)),
  carHealth: s.player.car ? Math.max(0, Math.round(s.player.car.health)) : null,
  weapon: s.player.weapon,
  ammo: s.player.ammo[s.player.weapon],
  missionTitle: s.mission?.title ?? null,
  missionTime: s.mission ? Math.ceil(s.mission.timeLeft) : null,
  message: s.message?.text ?? null,
  banner: s.banner ? { kind: s.banner.kind, detail: s.banner.detail } : null,
  searchLeft: stars(s) > 0 && !s.seen ? Math.ceil(s.searchTime) : null,
  downReason: s.downReason,
  gameOver: s.gameOver,
  stamina: s.player.car ? null : Math.round(s.player.stamina),
  exhausted: s.player.exhausted,
  shop: shopHud(s),
});
