export const STEP = 1 / 60;

/** Avvia un loop a timestep fisso. Ritorna la funzione di stop */
export const startLoop = (update: (dt: number) => void, render: () => void): (() => void) => {
  let last = performance.now();
  let acc = 0;
  let raf = 0;
  const frame = (now: number): void => {
    acc += Math.min(0.25, (now - last) / 1000);
    last = now;
    while (acc >= STEP) {
      update(STEP);
      acc -= STEP;
    }
    render();
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
};
