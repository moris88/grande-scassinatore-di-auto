import { dist } from "../engine/math";
import { healthRatio } from "../entities/car";
import type { Car } from "../entities/types";
import type { VehicleKind } from "../entities/vehicles";
import { SHOPS, tileAtWorld, tileCenter } from "../world/cityMap";
import { Tile } from "../world/tiles";
import { type GameState, playSound, showMessage } from "./state";

/** Valore di un veicolo intatto, per tipo (la volante vale come un SUV) */
const VALUES: Record<VehicleKind, number> = {
  car: 400,
  taxi: 350,
  sport: 900,
  suv: 700,
  van: 450,
  truck: 600,
  bus: 500,
  ambulance: 600,
  firetruck: 700,
  tow: 450,
};
const POLICE_VALUE = 700;
/** Distanza dal centro della tile davanti al concessionario per consegnare l'auto */
const DEALER_RANGE = 26;

/** Prezzo di vendita: valore del modello ridotto in proporzione ai danni */
export const salePrice = (car: Car): number =>
  Math.round(((car.police ? POLICE_VALUE : VALUES[car.kind]) * healthRatio(car)) / 10) * 10;

const atSalePoint = (s: GameState, car: Car): boolean => {
  if (tileAtWorld(s.map, car.pos) === Tile.SprayShop) return true;
  const dealer = SHOPS.find((x) => x.kind === "cars");
  return dealer !== undefined && dist(car.pos, tileCenter(dealer.outside)) < DEALER_RANGE;
};

/** Auto lasciata in un garage o davanti al concessionario: venduta e tolta di mezzo */
export const sellCar = (s: GameState, car: Car): void => {
  if (car.missionTag || car.dead || car.health <= 0 || !atSalePoint(s, car)) return;
  const price = salePrice(car);
  const dents = Math.round((1 - healthRatio(car)) * 100);
  s.money += price;
  s.cars = s.cars.filter((c) => c !== car);
  playSound(s, "success");
  showMessage(s, `Auto venduta: +$${price}${dents > 0 ? ` (danni -${dents}%)` : ""}`, 3);
};
