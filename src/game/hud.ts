import type { WeaponKind } from "../entities/types";
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
}

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
});
