import { describe, expect, it } from "vitest";
import { Input } from "../engine/input";
import { createCar } from "../entities/car";
import { MAX_STAMINA, updatePlayerOnFoot } from "../entities/player";
import { updateWanted } from "../systems/wantedSystem";
import {
  POLICE_DOOR,
  POLICE_STATION,
  SHOPS,
  SPRAY_SHOPS,
  tileAt,
  tileCenter,
} from "../world/cityMap";
import { Tile } from "../world/tiles";
import { createGame, updateGame } from "./game";
import { PAINT_TIME, updatePaint } from "./paintJob";
import { CAR_COLORS, JACKETS } from "./shopCatalog";
import { buyItem, enterShop, shopAtDoor } from "./shopSystem";

/** Input finto con alcuni tasti tenuti premuti */
class FakeInput extends Input {
  constructor(private keys: string[]) {
    super();
  }
  override isDown(...codes: string[]): boolean {
    return codes.some((c) => this.keys.includes(c));
  }
}

describe("negozi", () => {
  it("le porte sono sulla mappa e si entra dal marciapiede davanti", () => {
    const s = createGame();
    for (const sh of SHOPS) {
      expect(tileAt(s.map, sh.door.x, sh.door.y)).toBe(Tile.Door);
      expect(tileAt(s.map, sh.outside.x, sh.outside.y)).toBe(Tile.Sidewalk);
      s.player.pos = tileCenter(sh.outside);
      expect(shopAtDoor(s)).toBe(sh.kind);
    }
  });

  it("in armeria si compra un'arma solo con abbastanza soldi", () => {
    const s = createGame();
    enterShop(s, "guns");
    buyItem(s, 0);
    expect(s.player.ammo.pistol).toBe(0);
    expect(s.shop?.notice).toBe("Non hai abbastanza soldi");
    s.money = 250;
    buyItem(s, 0);
    expect(s.player.ammo.pistol).toBe(30);
    expect(s.player.weapon).toBe("pistol");
    expect(s.money).toBe(50);
  });

  it("agli alimentari il cibo cura, ma non si paga se si è già in salute", () => {
    const s = createGame();
    s.money = 100;
    enterShop(s, "food");
    buyItem(s, 1);
    expect(s.money).toBe(100);
    s.player.health = 50;
    buyItem(s, 1);
    expect(s.player.health).toBe(75);
    expect(s.money).toBe(80);
  });

  it("dentro il negozio il mondo è fermo", () => {
    const s = createGame();
    enterShop(s, "food");
    const t = s.time;
    for (let i = 0; i < 60; i++) updateGame(s, new Input(), 1 / 60);
    expect(s.time).toBe(t);
  });

  it("una giacca nuova cambia colore e, se non ti vedono, la polizia ti perde", () => {
    const s = createGame();
    s.money = 100;
    s.heat = 2.5;
    s.searchTime = 20;
    s.seen = false;
    enterShop(s, "clothes");
    buyItem(s, 0);
    expect(s.player.shirt).toBe(JACKETS[0].color);
    expect(s.searchTime).toBeLessThanOrEqual(3);
    expect(s.money).toBe(50);
    buyItem(s, 0);
    expect(s.shop?.notice).toBe("La stai già indossando");
    expect(s.money).toBe(50);
  });

  it("al concessionario si scelgono gli optional e l'auto viene consegnata fuori", () => {
    const s = createGame();
    s.money = 2000;
    enterShop(s, "cars");
    buyItem(s, 0); // colore successivo
    buyItem(s, 1); // motore
    buyItem(s, 2); // blindatura
    expect(s.money).toBe(2000); // le scelte non si pagano
    const before = s.cars.length;
    buyItem(s, 4); // compra: 400 + 300 + 400
    expect(s.money).toBe(900);
    const car = s.cars[before];
    expect(car.color).toBe(CAR_COLORS[1].color);
    expect(car.upgrades).toEqual({ engine: true, armor: true, brakes: false });
    expect(car.driver).toBe("none");
    expect(car.owned).toBe(true);
  });

  it("le armi non si trovano più in giro per la città", () => {
    const s = createGame();
    expect("pickups" in s).toBe(false);
  });
});

describe("corsa", () => {
  it("correre consuma la barra; vuota si torna a camminare finché non si ricarica", () => {
    const s = createGame();
    const p = s.player;
    const running = new FakeInput(["ShiftLeft", "ArrowUp"]);
    // La barra (100) si svuota in 4 s di corsa
    for (let i = 0; i < 60 * 5 && !p.exhausted; i++) updatePlayerOnFoot(p, running, 1 / 60, s.map);
    expect(p.exhausted).toBe(true);
    expect(p.stamina).toBe(0);
    // Dopo 1 s è a 15: ancora sotto la soglia (30), quindi niente corsa
    for (let i = 0; i < 60; i++) updatePlayerOnFoot(p, running, 1 / 60, s.map);
    expect(p.exhausted).toBe(true);
    const idle = new FakeInput([]);
    for (let i = 0; i < 60 * 2; i++) updatePlayerOnFoot(p, idle, 1 / 60, s.map);
    expect(p.exhausted).toBe(false);
    for (let i = 0; i < 60 * 10; i++) updatePlayerOnFoot(p, idle, 1 / 60, s.map);
    expect(p.stamina).toBe(MAX_STAMINA);
  });
});

describe("ospedale, caserma e garage", () => {
  it("il cuore dell'ospedale riporta la salute al 100% gratis", () => {
    const s = createGame();
    s.player.health = 20;
    enterShop(s, "hospital");
    buyItem(s, 0);
    expect(s.player.health).toBe(100);
    expect(s.money).toBe(0);
  });

  it("la caserma ha la porta davanti al punto in cui si torna dopo l'arresto", () => {
    const s = createGame();
    expect(tileAt(s.map, POLICE_DOOR.x, POLICE_DOOR.y)).toBe(Tile.Door);
    expect(
      Math.abs(POLICE_DOOR.y - POLICE_STATION.y) + Math.abs(POLICE_DOOR.x - POLICE_STATION.x),
    ).toBe(1);
  });

  it("il garage riverniscia una volta per ingresso e da ricercato fa perdere la polizia", () => {
    const s = createGame();
    s.cars = s.cars.filter((c) => !c.police);
    const garage = SPRAY_SHOPS[0];
    const car = createCar(tileCenter({ x: garage.x, y: garage.y }), 0);
    car.driver = "player";
    s.player.car = car;
    s.money = 1000;
    s.heat = 2.5;
    s.searchTime = 30; // inseguimento in corso
    const before = car.color;
    updateWanted(s, 1 / 60);
    // Verniciatura in corso: il colore nuovo arriva a fine lavoro
    expect(s.paintJob?.car).toBe(car);
    expect(car.color).toBe(before);
    updatePaint(s, PAINT_TIME);
    expect(car.color).not.toBe(before);
    expect(s.paintJob).toBeNull();
    expect(s.heat).toBe(0);
    expect(s.money).toBe(500);
    updateWanted(s, 1 / 60);
    expect(s.money).toBe(500); // ancora dentro: niente seconda riverniciatura
  });
});
