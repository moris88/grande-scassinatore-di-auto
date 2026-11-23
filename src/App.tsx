import { useCallback, useEffect, useState } from "react";
import { GameCanvas } from "./components/GameCanvas";
import { Hud } from "./components/Hud";
import { PauseMenu } from "./components/PauseMenu";
import { loadBest, saveBest } from "./game/highScore";
import type { HudData } from "./game/hud";

const GAME_TITLE = "Grande Scassinatore di Auto";

export function App() {
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const [hud, setHud] = useState<HudData | null>(null);
  const [best, setBest] = useState(loadBest);

  const gameOver = hud?.gameOver ?? false;
  const money = hud?.money ?? 0;
  useEffect(() => {
    if (gameOver) setBest(saveBest(money));
  }, [gameOver, money]);

  const restart = useCallback(() => {
    setGameKey((k) => k + 1);
    setHud(null);
    setPaused(false);
    setStarted(true);
  }, []);
  const togglePause = useCallback(() => setPaused((p) => !p), []);

  if (!started) return <PauseMenu title={GAME_TITLE} big best={best} onRestart={restart} />;

  return (
    <>
      <GameCanvas key={gameKey} paused={paused} onHud={setHud} onTogglePause={togglePause} />
      {hud && <Hud hud={hud} />}
      {gameOver && (
        <PauseMenu
          title="GAME OVER"
          best={best}
          score={money}
          newRecord={money > 0 && money >= best}
          onRestart={restart}
        />
      )}
      {paused && !gameOver && (
        <PauseMenu title="PAUSA" best={best} onResume={togglePause} onRestart={restart} />
      )}
    </>
  );
}
