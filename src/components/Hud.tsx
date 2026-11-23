import type { HudData } from "../game/hud";
import { WEAPON_NAMES } from "../systems/weaponSystem";
import { MissionPopup } from "./MissionPopup";

interface Props {
  hud: HudData;
}

export function Hud({ hud }: Props) {
  const ammo = hud.weapon === "fists" ? "" : ` (${hud.ammo})`;
  return (
    <div className="hud">
      <div className="hud-top-left">
        <div className="hud-money">${hud.money.toLocaleString("it-IT")}</div>
        <div>Moltiplicatore x{hud.multiplier}</div>
        <div>Vite: {"♥".repeat(Math.max(0, hud.lives))}</div>
      </div>
      <div className="hud-top-right">
        <div className="hud-stars">
          {[1, 2, 3, 4].map((n) => (
            <span key={n} className={n <= hud.stars ? "star on" : "star"}>
              ★
            </span>
          ))}
        </div>
        <div>Salute: {hud.health}</div>
        {hud.carHealth !== null && <div>Auto: {hud.carHealth}</div>}
        <div>
          {WEAPON_NAMES[hud.weapon]}
          {ammo}
        </div>
      </div>
      {hud.missionTitle && (
        <div className="hud-mission">
          {hud.missionTitle} — <b>{hud.missionTime}s</b>
        </div>
      )}
      <MissionPopup message={hud.message} />
      {hud.downReason && !hud.gameOver && (
        <div className="hud-down">{hud.downReason === "wasted" ? "SEI MORTO" : "ARRESTATO"}</div>
      )}
    </div>
  );
}
