import { beforeEach, describe, expect, it } from "vitest";
import { loadBest, saveBest } from "./highScore";

describe("record", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    globalThis.localStorage = {
      getItem: (k) => store.get(k) ?? null,
      setItem: (k, v) => void store.set(k, v),
      removeItem: (k) => void store.delete(k),
      clear: () => store.clear(),
      key: () => null,
      length: 0,
    };
  });

  it("salva solo se il punteggio supera il record", () => {
    expect(loadBest()).toBe(0);
    expect(saveBest(500)).toBe(500);
    expect(saveBest(200)).toBe(500);
    expect(loadBest()).toBe(500);
  });
});
