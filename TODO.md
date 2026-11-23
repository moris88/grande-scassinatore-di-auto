# TODO — Mini GTA top-down (stile 1997)

Stack: Vite + React + TypeScript, Canvas 2D, Biome, Vitest. Grafica pixel art originale, mappa fissa, niente audio.

Legenda: `[ ]` da fare · `[~]` in corso · `[x]` fatto

## Fase 1 — Setup progetto
- [x] `git init` sul branch `feature/gioco-base`
- [x] Scaffold Vite + React + TypeScript (strict)
- [x] Configurazione Biome
- [x] Configurazione Vitest
- [x] Script npm: `dev`, `build`, `lint`, `format`, `test`
- [x] Primo commit (`6f3962c`)

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
- [x] Test verdi (58 test, incluse simulazioni headless del gioco)
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
- [x] inserire treni, camion, autobus nel traffico (lotto B: camion e autobus con misure, massa, velocità e resistenza propri; lotto D: binario in superficie sulla riga 19 da ovest a est, 6 passaggi a livello con sbarre e luci lampeggianti, treno di 4 carrozze ogni 25–40 s a direzioni alternate con tromba, distrugge i veicoli e uccide chi è sui binari, il traffico si ferma al passaggio chiuso)
- [x] inserire le ambulanze per i pedoni che vengono investiti o uccisi (lotto B: l'ambulanza arriva a sirene accese seguendo il percorso sulle corsie, ignora i semafori, si ferma 3 s e rianima i pedoni a terra vicini)
- [x] inserire elicotteri per il traffico aereo (lotto C: 2 elicotteri civili che attraversano la zona visibile, disegnati sopra a tutto con ombra a terra e rotore animato; solo grafici)
- [x] rivedere i telefoni per le missioni (lotto A: cabina rossa con vetri, tetto a padiglione e insegna TEL; con missione disponibile la lampada sul tetto si accende con alone pulsante)
- [x] se non ho armi da fuoco, il personaggio deve poter dare i pugni e uccidere i nemici corpo a corpo (lotto A: jab alternato destro/sinistro con sprite dedicato, 2 pugni stendono un pedone, spinta all'indietro, suono d'impatto)
- [x] inserire animazioni che entra in macchina e esce dalla macchina, (possibilità di scivolare sopra la macchina ed entrare in auto) (lotto C: con E si cammina alla portiera del guidatore; dal lato opposto si scivola sul cofano; l'autista si blocca mentre ti avvicini; scendendo si esce dalla portiera libera; comandi bloccati durante l'animazione; raggio di entrata adattato a camion e autobus)
- [x] possibilità di entrare nei palazzi, per missioni di negozi e uffici (lotto E1: porte con tenda a strisce e insegna, E dal marciapiede davanti, interno a schermata separata col mondo fermo; al posto degli uffici, su richiesta, ospedale nel lotto G)
- [x] possibilità di vedere agenti della polizia all'interno della città e che se sono inseguito che escono dalle autoi per inseguire il giocatore (lotto B: 3 agenti di pattuglia, più agenti con più stelle; scendono dalla volante quando è vicina e lenta, corrono, sparano da 2 stelle, arrestano)
- [x] Bug relativi alle auto in coda, come il blocco del traffico o il comportamento irregolare nelle curve (vedi immagine Screenshot 2026-11-23 200115.png) (lotto A: le curve a 90° agli angoli non hanno più semaforo né linea d'arresto, solo gli incroci a T e a croce; vedi anche il fix delle curve)
- [x] Introdurre missioni dove sei tu colui che deve essere inseguito o catturato dalla mafia, con possibilità di fuga e nascondigli (lotto F: quarta missione delle cabine; 3 auto nere della mafia, magenta sulla minimappa, ti vedono come la polizia e ti inseguono sparando, se ti perdono vanno all'ultimo punto noto; vinci resistendo 60 s o raggiungendo il rifugio (parcheggio coperto più lontano, $2500 base); nei parcheggi coperti ti perdono; se ti restano addosso mentre sei fermo ti catturano e perdi una vita)
- [x] Inserire il negozio di armi, con possibilità di acquistare armi e munizioni (le armi devono essere presenti solo nei negozi di armi, non in giro per la città) (lotto E1: armeria a nord, pistola +30 colpi $200, mitraglietta +120 colpi $600; casse armi rimosse dalla città)
- [x] Inserire il negozio di vestiti, con possibilità di cambiare abbigliamento del personaggio (lotto E2: 5 giacche colorate a $50; se ti cercano senza vederti la polizia ti perde, ricerca a 3 s; i vestiti restano dopo la morte)
- [x] Inserire il negozio di veicoli, con possibilità di acquistare e personalizzare auto (lotto E2: auto base $400, 5 colori, motore +30% velocità $300, blindatura danni dimezzati $400, freni +50% $200; l'auto viene consegnata davanti al concessionario)
- [x] Inserire il negozio di alimentari, con possibilità di acquistare cibo e bevande (per ripristinare salute o energia) (lotto E1: acqua, panino e pizza curano, la bibita energetica ricarica la corsa; barra della corsa con Shift: corsa a 160, si svuota in 4 s, vuota si cammina finché non torna al 30%)
- [x] Il gioco si chiama "Grande Scassinatore di Auto", inseriscilo nel menu iniziale (lotto A: titolo grande nel menu e nella scheda del browser)
- [x] Aggiungi i parcheggi, dove sono parcheggiate le auto (lotto B: 3 piazzali, di cui 2 coperti, e 2 file di stalli lungo i marciapiedi; auto vuote rubabili senza reato, gli stalli si ripopolano fuori dalla vista)
- [x] Se scappi dalla polizia, introdurre un sistema di inseguimento con possibilità di nascondersi o cambiare veicolo, se dopo un tot di tempo che la polizia non ti trova azzerare l'inseguimento, (mostrare un messaggio di fine inseguimento, e le stelline accumulate più sono più agenti ti inseguono, aumentano se continui a commettere crimini) (lotto B: la polizia deve vederti davvero, gli edifici bloccano la vista; se ti perde va all'ultimo punto noto e parte la ricerca di 10 s per stella, con le stelle che lampeggiano e il conto alla rovescia; nei parcheggi coperti e in carrozzeria la ricerca scorre al doppio; cambiare veicolo senza essere visto la riduce a 3 s; alla fine azzera le stelle col banner "HAI SEMINATO LA POLIZIA!")
- [x] Inserisci la schermata di quando vieni ucciso e quando passi una missione con successo (lotto A: banner a tutto schermo che si ingrandisce con rimbalzo; rosso per morte/arresto, verde per missione compiuta con ricompensa e moltiplicatore)- [x] Ospedale: rinasci qui dopo la morte, dentro c'è il cuore che riporta la salute al 100% (lotto G: porta con insegna rossa OSPEDALE dietro il punto di rinascita; cuore gratuito)
- [x] Caserma della polizia: dopo l'arresto ricompari qui (lotto G: porta con insegna blu POLIZIA dietro il punto di ricomparsa; non si entra)
- [x] Precedenza ai mezzi con i lampeggianti (lotto G: le auto entro 220 px da un'ambulanza in servizio o da una volante in inseguimento accostano a destra e rallentano; i mezzi con le sirene le superano a sinistra senza fermarsi)
- [x] Camion e autobus lenti rispetto alle auto (lotto G: crociera 58 e 52 contro 95, velocità massima 160 e 150 contro 280, accelerano e frenano poco)
- [x] Più tipologie di veicoli con grafica e prestazioni diverse (lotto G: berlina, taxi giallo con insegna, sportiva con strisce e alettone, SUV con portapacchi, furgone, oltre a camion, autobus e ambulanza; ognuno con velocità, accelerazione, frenata e blindatura di serie propri)
- [x] Garage per cambiare colore all'auto e sfuggire alla polizia (lotto G: 2 garage GARAGE; colore nuovo a caso una volta per ingresso, $100, o $500 da ricercato che azzera l'inseguimento)
- [x] Velocità a piedi troppo alta (lotto G: camminata 95 → 55, corsa 160 → 95, agenti a piedi 100 → 75; le auto restano molto più veloci)

- [x] le ambulanze quando ci sono pedoni feriti o morti (lotto B: l'ambulanza arriva a sirene accese seguendo il percorso sulle corsie, ignora i semafori, si ferma 3 s e rianima i pedoni a terra vicini) altrimenti si comportano da normali auto senza lampeggianti accesi. (fatto: ambulanze anche nel traffico normale a lampeggianti spenti; alla chiamata parte quella libera più vicina; corretto il bug per cui i mezzi con un percorso giravano a vuoto)
- [x] implementare i vigili del fuoco che intervengono in caso di incendi (lotto B: il camion dei pompieri arriva a sirene accese seguendo il percorso sulle corsie, ignora i semafori, si ferma 3 s e spegne il fuoco; altrimenti si comporta da normale auto senza lampeggianti accesi), inserire l'animazione del fuoco e l'effetto di spegnimento quando il pompiere spara l'acqua su di esso. Inoltre inserisci i carro attrezzi che toglie le auto incidentate/incendiate.  (fatto: i rottami esplosi restano in fiamme con fiamme animate e fumo, bruciano chi passa e si spengono da soli in ~60 s; il camion dei pompieri arriva a sirene accese, getto d'acqua visibile e vapore, spegne in ~3 s; il carro attrezzi giallo, senza lampeggianti, aggancia il rottame in 2 s e se lo porta via appeso dietro)
- [ ] quando porto le auto al garage o al concessionario, implementare il sistema di consegna e pagamento (lotto B: l'auto viene parcheggiata nel garage o davanti al concessionario, il giocatore riceve il pagamento corrispondente; se l'auto è danneggiata, il pagamento viene ridotto)
- [ ] implementare il sistema di danni ai veicoli (lotto B: le auto subiscono danni visibili e funzionali in base agli urti, con riduzione delle prestazioni e possibilità di riparazione nei garage)
- [ ] ridurre il numero degli elicotteri e introdurre (con lo stesso tempo di comparsa) l'aereo che attraversa la città seguendo un percorso prestabilito (lotto B: l'aereo compare ai bordi della mappa e vola sopra la città, visibile dai giocatori; non interagisce con il traffico aereo o terrestre)
- [ ] inserire il suono dei passi del giocatore (lotto B: il suono varia in base al tipo di superficie su cui cammina il personaggio, ad esempio asfalto, erba, pavimento interno)
- [ ] implementare il sistema di suoni ambientali (lotto B: includere suoni di traffico, sirene, passi dei pedoni, animali e altri effetti sonori per rendere la città più viva)
- [ ] implementare il sistema di dialoghi con i pedoni (lotto B: i pedoni reagiscono alle azioni del giocatore con frasi e comportamenti diversi, ad esempio saluti, insulti o richieste di aiuto)
- [ ] implementare il sistema di reazioni dei pedoni agli eventi della città (lotto B: i pedoni reagiscono a incidenti, crimini, sirene e altri eventi con comportamenti realistici, come scappare, chiamare la polizia o fermarsi a guardare)

- [ ] sistema gli angoli della mappa, dove ci sono gli incroci senza semaforo inserisci le curve (non sono degli incroci)
- [x] Migliorare la grafica dei palazzi, renderli 3D (prospettiva dall'alto: tetto sollevato verso la camera, pareti ombreggiate per lato con finestre per piano e qualche luce accesa, 3 altezze per isolato; coprono chi passa dietro; le porte dei negozi restano incassate)
