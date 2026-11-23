import { healthRatio } from "../entities/car";
import type { Car } from "../entities/types";
import { VEHICLES } from "../entities/vehicles";
import { hash } from "./mapRenderer";

/** Soglie di salute (frazione) da cui compare un livello di danni in più */
const STAGES = [0.75, 0.5, 0.25];
const DENTS_PER_STAGE = 3;

/** Ammaccature, graffi e fari rotti sopra lo sprite, sempre più fitti con i danni.
 * Le posizioni dipendono dall'id del veicolo, così restano stabili tra un frame e l'altro. */
export const drawVehicleDamage = (g: CanvasRenderingContext2D, car: Car): void => {
  if (car.dead) return;
  const ratio = healthRatio(car);
  const stage = STAGES.filter((t) => ratio < t).length;
  if (stage === 0) return;
  const { len, wid } = VEHICLES[car.kind];
  g.save();
  g.translate(Math.round(car.pos.x), Math.round(car.pos.y));
  g.rotate(car.angle);
  for (let i = 0; i < stage * DENTS_PER_STAGE; i++) {
    const x = -len / 2 + 2 + hash(car.id, i, 1) * (len - 6);
    const y = -wid / 2 + 2 + hash(car.id, i, 2) * (wid - 6);
    g.fillStyle = i % 3 === 0 ? "rgba(220,220,220,0.7)" : "rgba(0,0,0,0.55)";
    g.fillRect(Math.round(x), Math.round(y), i % 3 === 0 ? 3 : 2, i % 3 === 0 ? 1 : 2);
  }
  // Dal secondo livello un faro rotto, dal terzo il cofano accartocciato
  if (stage >= 2) {
    g.fillStyle = "#222";
    g.fillRect(len / 2 - 2, -wid / 2 + 3, 2, 2);
  }
  if (stage >= 3) {
    g.fillStyle = "rgba(0,0,0,0.45)";
    g.fillRect(len / 2 - 6, -wid / 2 + 2, 4, wid - 4);
  }
  g.restore();
};
