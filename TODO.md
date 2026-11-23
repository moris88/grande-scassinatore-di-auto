# TODO — Mini GTA top-down (stile 1997)

Stack: Vite + React + TypeScript, Canvas 2D, Biome, Vitest. Grafica pixel art originale, mappa fissa, niente audio.

Legenda: `[ ]` da fare · `[~]` in corso · `[x]` fatto

## Fase 1 — Setup progetto
- [x] `git init` sul branch `feature/gioco-base`
- [x] Scaffold Vite + React + TypeScript (strict)
- [x] Configurazione Biome
- [x] Configurazione Vitest
- [x] Script npm: `dev`, `build`, `lint`, `format`, `test`
- [ ] Primo commit (in attesa di conferma)

## Fase 2 — Motore, mappa, camminata
- [x] Game loop a timestep fisso (60Hz)
- [x] Gestione input (tastiera)
- [x] Mappa città 64×64 da layout fisso (`world/cityMap.ts`)
- [x] Tile pixel art (strade con mezzeria, marciapiedi, tetti con dettagli, parchi, acqua, cabine, carrozzeria)
- [x] Renderer Canvas con `imageSmoothingEnabled = false`, disegna solo l'area visibile
- [x] Camera che segue il giocatore (anticipa la direzione e fa zoom-out con la velocità)
- [x] Giocatore a piedi + sprite animato
- [x] Collisioni con edifici

## Fase 3 — Auto e guida
- [x] Sprite auto pixel art (civili, volanti, rottami)
- [x] Entrata/uscita dall'auto (`E` / `Invio`), con furto dell'auto all'autista
- [x] Fisica arcade (accelerazione, sterzo, derapata, freno a mano)
- [x] Collisioni auto-edifici e auto-auto
- [x] Danni, fumo, incendio ed esplosione
- [x] Zoom camera in base alla velocità

## Fase 4 — Traffico e pedoni
- [x] Corsie con senso di marcia (traffico a destra)
- [x] IA traffico (segue le corsie, si ferma davanti agli ostacoli, riparte dopo 2 s)
- [x] IA pedoni sui marciapiedi + fuga
- [x] Investimento pedoni
- [x] Spawn/despawn attorno alla camera

## Fase 5 — Armi e polizia
- [x] Pugni, pistola e mitraglietta, cambio arma (`Q`), casse armi
- [x] Proiettili e colpi
- [x] Livello di ricercato (1–4 stelle, raddoppia se c'è una volante vicina)
- [x] Volanti che inseguono (sbloccandosi in retromarcia), sparano da 3 stelle
- [x] Arresto del giocatore
- [x] Calo del livello di ricercato + carrozzeria ($500)

## Fase 6 — Missioni e HUD
- [x] Cabine telefoniche (lampeggiano quando una missione è disponibile)
- [x] Missione: consegna auto
- [x] Missione: checkpoint a tempo
- [x] Missione: elimina bersaglio
- [x] HUD React: soldi, moltiplicatore, vite, stelle, salute, arma, missione, messaggi
- [x] Freccia verso l'obiettivo (disegnata sul canvas)
- [x] Menu iniziale, pausa (`Esc`) e game over

## Verifica finale
- [x] Biome pulito
- [x] Test verdi (18 test, incluse simulazioni headless del gioco)
- [x] `npm run build` senza errori
- [ ] Prova di gioco nel browser (da fare a mano: `npm run dev`)

## Idee per dopo
- [x] Audio sintetizzato WebAudio: motore, sirene, spari, esplosioni, urti, jingle missioni (`M` = muto)
- [x] Semafori agli incroci (ciclo 5 s, giallo 1,2 s; il traffico civile si ferma, la polizia in inseguimento no)
- [x] Minimappa in basso a sinistra (giocatore, volanti, obiettivo, cabine)
- [x] Salvataggio punteggio migliore (localStorage, mostrato in menu e game over)

## Bug da risolvere
Ordine concordato a lotti: A (curve, telefoni, pugni) → B (camion/autobus, ambulanze, agenti a piedi) → C (animazione entrata/uscita auto, elicotteri) → D (treni, binari in superficie) → E (interni dei palazzi su schermata separata + i 4 negozi) → F (missioni di fuga dalla mafia).

Decisioni prese:
- Negozi: interni con schermata separata (lotto E), si entra dalla porta, menu d'acquisto, si paga con i soldi del gioco.
- Vestiti: cambiano solo i colori dello sprite; cambiare colore fa perdere le tracce alla polizia se sei inseguito.
- Veicoli: l'auto comprata compare parcheggiata davanti al negozio; personalizzazione di colore, motore (velocità), blindatura (resistenza agli urti) e freni.
- Alimentari: cibo e bevande ripristinano la salute; in più una barra della corsa (a piedi), che si consuma correndo; quando è vuota si cammina finché non si ricarica.
- Mafia: auto della mafia che inseguono e sparano; si vince sopravvivendo per un tempo o raggiungendo un punto sicuro; nascondigli (vicoli/garage) dove restando fermi qualche secondo ti perdono; se ti prendono perdi una vita.

- [x] Risolvere il problema delle curve per le auto (lotto A: svolta pianificata con una tile d'anticipo, raggio minimo di sterzata ridotto da ~39 a ~21 px sotto i 60 px/s, retromarcia se incastrate fuori strada; campioni fuori strada dal 17% a <0,2%)
- [ ] inserire treni, camion, autobus nel traffico
- [ ] inserire le ambulanze per i pedoni che vengono investiti o uccisi
- [ ] inserire elicotteri per il traffico aereo
- [x] rivedere i telefoni per le missioni (lotto A: cabina rossa con vetri, tetto a padiglione e insegna TEL; con missione disponibile la lampada sul tetto si accende con alone pulsante)
- [x] se non ho armi da fuoco, il personaggio deve poter dare i pugni e uccidere i nemici corpo a corpo (lotto A: jab alternato destro/sinistro con sprite dedicato, 2 pugni stendono un pedone, spinta all'indietro, suono d'impatto)
- [ ] inserire animazioni che entra in macchina e esce dalla macchina, (possibilità di scivolare sopra la macchina ed entrare in auto)
- [ ] possibilità di entrare nei palazzi, per missioni di negozi e uffici
- [ ] possibilità di vedere agenti della polizia all'interno della città e che se sono inseguito che escono dalle autoi per inseguire il giocatore
- [x] Bug relativi alle auto in coda, come il blocco del traffico o il comportamento irregolare nelle curve (vedi immagine Screenshot 2026-11-23 200115.png) (lotto A: le curve a 90° agli angoli non hanno più semaforo né linea d'arresto, solo gli incroci a T e a croce; vedi anche il fix delle curve)
- [ ] Introdurre missioni dove sei tu colui che deve essere inseguito o catturato dalla mafia, con possibilità di fuga e nascondigli
- [ ] Inserire il negozio di armi, con possibilità di acquistare armi e munizioni (le armi devono essere presenti solo nei negozi di armi, non in giro per la città: lotto E rimuove le casse armi dalla mappa)
- [ ] Inserire il negozio di vestiti, con possibilità di cambiare abbigliamento del personaggio
- [ ] Inserire il negozio di veicoli, con possibilità di acquistare e personalizzare auto
- [ ] Inserire il negozio di alimentari, con possibilità di acquistare cibo e bevande (per ripristinare salute o energia)
- [x] Il gioco si chiama "Grande Scassinatore di Auto", inseriscilo nel menu iniziale (lotto A: titolo grande nel menu e nella scheda del browser)
- [ ] Aggiungi i parcheggi, dove sono parcheggiate le auto (lotto B)
- [ ] Se scappi dalla polizia, introdurre un sistema di inseguimento con possibilità di nascondersi o cambiare veicolo, se dopo un tot di tempo che la polizia non ti trova azzerare l'inseguimento, (mostrare un messaggio di fine inseguimento, e le stelline accumulate più sono più agenti ti inseguono, aumentano se continui a commettere crimini) (lotto B, insieme agli agenti a piedi)
- [x] Inserisci la schermata di quando vieni ucciso e quando passi una missione con successo (lotto A: banner a tutto schermo che si ingrandisce con rimbalzo; rosso per morte/arresto, verde per missione compiuta con ricompensa e moltiplicatore)