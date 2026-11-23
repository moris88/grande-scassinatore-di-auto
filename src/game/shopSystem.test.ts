import { describe, expect, it } from "vitest";
import { Input } from "../engine/input";
import { MAX_STAMINA, updatePlayerOnFoot } from "../entities/player";
import { SHOPS, tileAt, tileCenter } from "../world/cityMap";
import { Tile } from "../world/tiles";
import { createGame, updateGame } from "./game";
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
