import { type Vec2, pick } from "../engine/math";
import type { Pedestrian } from "./types";

const SHIRT_COLORS = ["#e74c3c", "#3498db", "#f39c12", "#16a085", "#9b59b6", "#bdc3c7", "#e67e22"];

let nextId = 1;

export const createPed = (pos: Vec2): Pedestrian => ({
  id: nextId++,
  pos: { ...pos },
  angle: Math.random() * Math.PI * 2,
  speed: 35 + Math.random() * 20,
  color: pick(SHIRT_COLORS),
  state: "walk",
  target: null,
  fleeTime: 0,
  walkPhase: Math.random() * 10,
  missionTarget: false,
  deadTime: 0,
  health: 100,
});
