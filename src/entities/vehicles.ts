import type { Vec2 } from "../engine/math";

export type VehicleKind = "car" | "truck" | "bus" | "ambulance";

export interface VehicleSpec {
  /** Lunghezza e larghezza in pixel (anche dello sprite) */
  len: number;
  wid: number;
  /** Massa relativa negli urti tra veicoli */
  mass: number;
  maxSpeed: number;
  /** Velocità di crociera dell'IA */
  cruise: number;
  health: number;
}

export const VEHICLES: Record<VehicleKind, VehicleSpec> = {
  car: { len: 28, wid: 14, mass: 1, maxSpeed: 280, cruise: 95, health: 100 },
  ambulance: { len: 32, wid: 15, mass: 1.4, maxSpeed: 260, cruise: 110, health: 130 },
  truck: { len: 40, wid: 16, mass: 2.5, maxSpeed: 200, cruise: 75, health: 180 },
  bus: { len: 48, wid: 16, mass: 3, maxSpeed: 190, cruise: 70, health: 200 },
};

/** Cerchi di collisione distribuiti lungo il veicolo (uno per le auto, più per i mezzi lunghi) */
export const collisionCircles = (
  kind: VehicleKind,
  pos: Vec2,
  angle: number,
): { c: Vec2; r: number }[] => {
  const spec = VEHICLES[kind];
  const r = spec.wid * 0.75;
  const n = Math.max(1, Math.round(spec.len / (r * 2.4)));
  const step = n === 1 ? 0 : (spec.len - r * 2) / (n - 1);
  const start = -(step * (n - 1)) / 2;
  return Array.from({ length: n }, (_, i) => ({
    c: {
      x: pos.x + Math.cos(angle) * (start + step * i),
      y: pos.y + Math.sin(angle) * (start + step * i),
    },
    r,
  }));
};
