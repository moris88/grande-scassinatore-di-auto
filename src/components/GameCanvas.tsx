import { useEffect, useRef } from "react";
import { GameAudio } from "../engine/audio";
import { startLoop } from "../engine/gameLoop";
import { Input } from "../engine/input";
import { dist } from "../engine/math";
import { forwardSpeed } from "../entities/car";
import { ambientLevels } from "../game/audioLevels";
import { createGame, updateGame } from "../game/game";
import { type HudData, makeHud } from "../game/hud";
import { type GameState, stars } from "../game/state";
import { renderMap } from "../render/mapRenderer";
import { renderGame } from "../render/renderer";

const SIREN_RANGE = 500;

interface Props {
  paused: boolean;
  onHud: (hud: HudData) => void;
  onTogglePause: () => void;
}

/** Intensità della sirena: 1 accanto alla volante più vicina, 0 oltre il raggio */
const sirenLevel = (s: GameState): number => {
  if (stars(s) === 0) return 0;
  const pos = s.player.car ? s.player.car.pos : s.player.pos;
  let best = SIREN_RANGE;
  for (const c of s.cars) if (c.police && !c.dead) best = Math.min(best, dist(c.pos, pos));
  return 1 - best / SIREN_RANGE;
};

export function GameCanvas({ paused, onHud, onTogglePause }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const callbacks = useRef({ onHud, onTogglePause });
  callbacks.current = { onHud, onTogglePause };

  useEffect(() => {
    const canvas = canvasRef.current;
    const g = canvas?.getContext("2d");
    if (!canvas || !g) return;
    const resize = (): void => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const state = createGame();
    const mapCanvas = renderMap(state.map);
    const input = new Input();
    input.attach();
    const audio = new GameAudio();
    const unlock = (): void => audio.resume();
    window.addEventListener("keydown", unlock);
    let frames = 0;

    const stop = startLoop(
      (dt) => {
        // Nel negozio Esc serve a uscire, non a mettere in pausa
        if (input.wasPressed("Escape") && !state.shop) callbacks.current.onTogglePause();
        if (input.wasPressed("KeyM")) audio.toggleMute();
        if (!pausedRef.current) updateGame(state, input, dt);
        input.endFrame();
      },
      () => {
        renderGame(g, state, mapCanvas);
        for (const e of state.sounds) audio.play(e);
        state.sounds.length = 0;
        // In pausa, a fine partita e dentro i negozi la città tace
        if (pausedRef.current || state.gameOver || state.shop) audio.quiet();
        else
          audio.update({
            carSpeed: state.player.car ? forwardSpeed(state.player.car) : null,
            siren: sirenLevel(state),
            time: state.time,
            ambient: ambientLevels(state),
          });
        if (frames++ % 6 === 0) callbacks.current.onHud(makeHud(state));
      },
    );
    return () => {
      stop();
      input.detach();
      audio.close();
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="game-canvas" />;
}
