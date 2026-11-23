interface Props {
  title: string;
  best: number;
  score?: number;
  newRecord?: boolean;
  /** Titolo grande del gioco (menu iniziale) */
  big?: boolean;
  onResume?: () => void;
  onRestart: () => void;
}

const money = (n: number): string => `$${n.toLocaleString("it-IT")}`;

export function PauseMenu({ title, big, best, score, newRecord, onResume, onRestart }: Props) {
  return (
    <div className="overlay">
      <div className="panel">
        <h1 className={big ? "game-title" : undefined}>{big ? title.toUpperCase() : title}</h1>
        {score !== undefined && <p className="score">Punteggio: {money(score)}</p>}
        {newRecord && <p className="record-new">NUOVO RECORD!</p>}
        <p className="record">Record: {money(best)}</p>
        {onResume && (
          <button type="button" onClick={onResume}>
            Riprendi
          </button>
        )}
        <button type="button" onClick={onRestart}>
          Nuova partita
        </button>
        <div className="controls">
          <p>Frecce / WASD: muoviti e guida · Shift: corri</p>
          <p>E / Invio: sali o scendi dall'auto, entra nei negozi (porte con la tenda)</p>
          <p>Spazio: spara (a piedi) / freno a mano (in auto)</p>
          <p>Q: cambia arma · M: audio on/off · Esc: pausa</p>
          <p>
            Cabine ☎ rosse con la luce accesa: missioni · Garage: cambia colore all'auto ($100, da
            ricercato $500 e la polizia ti perde) · Ospedale: cuore per la salute ($500)
          </p>
        </div>
      </div>
    </div>
  );
}
