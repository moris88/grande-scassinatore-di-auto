import type { Vec2 } from "../engine/math";

export type VehicleKind = "car" | "taxi" | "sport" | "suv" | "van" | "truck" | "bus" | "ambulance";

export interface VehicleSpec {
  /** Lunghezza e larghezza in pixel (anche dello sprite) */
  len: number;
  wid: number;
  /** Massa relativa negli urti tra veicoli */
  mass: number;
  maxSpeed: number;
  /** Moltiplicatori di accelerazione e frenata rispetto alla berlina */
  accel: number;
  brake: number;
  /** Moltiplicatore dei danni subiti (< 1 = blindatura di serie) */
  armor: number;
  /** Velocità di crociera dell'IA */
  cruise: number;
  health: number;
}

export const VEHICLES: Record<VehicleKind, VehicleSpec> = {
  car: {
    len: 28,
    wid: 14,
    mass: 1,
    maxSpeed: 280,
    accel: 1,
    brake: 1,
    armor: 1,
    cruise: 95,
    health: 100,
  },
  taxi: {
    len: 28,
    wid: 14,
    mass: 1,
    maxSpeed: 270,
    accel: 1,
    brake: 1,
    armor: 1,
    cruise: 100,
    health: 100,
  },
  sport: {
    len: 30,
    wid: 13,
    mass: 0.9,
    maxSpeed: 340,
    accel: 1.35,
    brake: 1.3,
    armor: 1.3,
    cruise: 115,
    health: 80,
  },
  suv: {
    len: 30,
    wid: 16,
    mass: 1.5,
    maxSpeed: 240,
    accel: 0.85,
    brake: 0.9,
    armor: 0.7,
    cruise: 90,
    health: 140,
  },
  van: {
    len: 32,
    wid: 15,
    mass: 1.6,
    maxSpeed: 220,
    accel: 0.75,
    brake: 0.85,
    armor: 0.85,
    cruise: 80,
    health: 130,
  },
  ambulance: {
    len: 32,
    wid: 15,
    mass: 1.4,
    maxSpeed: 260,
    accel: 1.1,
    brake: 1.1,
    armor: 0.8,
    cruise: 110,
    health: 130,
  },
  truck: {
    len: 40,
    wid: 16,
    mass: 2.5,
    maxSpeed: 160,
    accel: 0.5,
    brake: 0.6,
    armor: 0.6,
    cruise: 58,
    health: 180,
  },
  bus: {
    len: 44,
    wid: 16,
    mass: 3,
    maxSpeed: 150,
    accel: 0.45,
    brake: 0.6,
    armor: 0.6,
    cruise: 52,
    health: 200,
  },
};

/** Composizione del traffico civile (pesi relativi) */
export const TRAFFIC_MIX: [VehicleKind, number][] = [
  ["car", 35],
  ["taxi", 10],
  ["sport", 10],
  ["suv", 12],
  ["van", 10],
  ["truck", 12],
  ["bus", 11],
];

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
