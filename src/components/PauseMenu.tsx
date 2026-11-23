interface Props {
  title: string;
  best: number;
  score?: number;
  newRecord?: boolean;
  onResume?: () => void;
  onRestart: () => void;
}

const money = (n: number): string => `$${n.toLocaleString("it-IT")}`;

export function PauseMenu({ title, best, score, newRecord, onResume, onRestart }: Props) {
  return (
    <div className="overlay">
      <div className="panel">
        <h1>{title}</h1>
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
          <p>Frecce / WASD: muoviti e guida</p>
          <p>E / Invio: sali o scendi dall'auto</p>
          <p>Spazio: spara (a piedi) / freno a mano (in auto)</p>
          <p>Q: cambia arma · M: audio on/off · Esc: pausa</p>
          <p>Cabine ☎ gialle: missioni · Garage "VERNICIA": azzera il ricercato ($500)</p>
        </div>
      </div>
    </div>
  );
}
