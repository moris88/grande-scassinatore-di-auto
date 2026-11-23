const KEY = "miniGta97.record";

/** Legge il record salvato nel browser (0 se assente o non accessibile) */
export const loadBest = (): number => {
  try {
    const v = Number(localStorage.getItem(KEY));
    return Number.isFinite(v) ? v : 0;
  } catch {
    return 0;
  }
};

/** Salva il punteggio se supera il record. Ritorna il record aggiornato */
export const saveBest = (score: number): number => {
  const best = loadBest();
  if (score <= best) return best;
  try {
    localStorage.setItem(KEY, String(score));
  } catch {
    // Storage non disponibile (es. navigazione privata): il record resta solo in memoria
  }
  return score;
};
