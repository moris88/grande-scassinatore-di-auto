import { type Vec2, clamp } from "./math";

export interface Camera {
  pos: Vec2;
  zoom: number;
}

const MIN_ZOOM = 1.4;
const MAX_ZOOM = 2.4;

/** Segue il bersaglio; più si va veloci più la camera si allontana e anticipa */
export const updateCamera = (cam: Camera, target: Vec2, vel: Vec2, dt: number): void => {
  const speed = Math.hypot(vel.x, vel.y);
  const wantZoom = clamp(MAX_ZOOM - speed / 200, MIN_ZOOM, MAX_ZOOM);
  cam.zoom += (wantZoom - cam.zoom) * Math.min(1, dt * 1.5);
  const lookX = target.x + vel.x * 0.35;
  const lookY = target.y + vel.y * 0.35;
  const k = Math.min(1, dt * 6);
  cam.pos.x += (lookX - cam.pos.x) * k;
  cam.pos.y += (lookY - cam.pos.y) * k;
};
