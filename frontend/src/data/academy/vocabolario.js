/**
 * vocabolario.js — il Vocabolario dell'Academy: termini della Formula 1
 * (italiani e inglesi) con significato ed esempio d'uso.
 *
 * Dati tecnici del regolamento 2026 verificati il 6/10/2026 su comunicati FIA
 * e testate specializzate (peso minimo 768 kg, passo 3.400 mm, larghezza
 * 1.900 mm, MGU-K 350 kW, motore termico ~400 kW, MGU-H eliminato, recupero
 * ~8,5 MJ/giro, aerodinamica attiva, Overtake Mode e Boost). Quando cambia il
 * regolamento, aggiornare qui le voci che citano il 2026.
 * Per aggiungere un termine: un oggetto in VOCABOLARIO, con un id unico.
 */
export const CATEGORIE_VOCABOLARIO = ["Regolamento e gara", "Bandiere e sicurezza", "Box e strategia", "Gomme", "Pista e guida", "Power unit", "Aerodinamica", "Telaio e assetto", "Freni", "Gergo e radio"];

export const VOCABOLARIO = [
  {
    "id": "pole-position",
    "termine": "Pole position",
    "inglese": "Pole",
    "categoria": "Regolamento e gara",
    "definizione": "Prima posizione sulla griglia di partenza, conquistata con il miglior tempo in qualifica.",
    "esempio": "Ha firmato la pole con due decimi di margine."
  },
  {
    "id": "griglia-di-partenza",
    "termine": "Griglia di partenza",
    "inglese": "Starting grid",
    "categoria": "Regolamento e gara",
    "definizione": "Lo schieramento delle auto prima del via, su due file sfalsate, nell'ordine stabilito dalla qualifica e dalle penalità.",
    "esempio": "Partirà dalla quarta fila della griglia."
  },
  {
    "id": "giro-di-formazione",
    "termine": "Giro di formazione",
    "inglese": "Formation lap",
    "categoria": "Regolamento e gara",
    "definizione": "Il giro lento che precede la partenza: serve a scaldare gomme e freni e a riportare le auto in griglia.",
    "esempio": "Durante il giro di formazione zigzaga per scaldare le gomme."
  },
  {
    "id": "partenza-da-fermo",
    "termine": "Partenza da fermo",
    "inglese": "Standing start",
    "categoria": "Regolamento e gara",
    "definizione": "Il via dato con le auto ferme sulla griglia, allo spegnimento dei cinque semafori rossi.",
    "esempio": "Dopo la bandiera rossa si riparte con una partenza da fermo."
  },
  {
    "id": "partenza-lanciata",
    "termine": "Partenza lanciata",
    "inglese": "Rolling start",
    "categoria": "Regolamento e gara",
    "definizione": "Ripartenza con le auto già in movimento, dietro la safety car, usata quando le condizioni non permettono un via da fermo.",
    "esempio": "Con la pioggia battente la direzione gara sceglie la partenza lanciata."
  },
  {
    "id": "semafori-di-partenza",
    "termine": "Semafori di partenza",
    "inglese": "Start lights",
    "categoria": "Regolamento e gara",
    "definizione": "I cinque semafori rossi che si accendono uno alla volta; il via è dato quando si spengono tutti insieme.",
    "esempio": "Lights out and away we go!"
  },
  {
    "id": "partenza-anticipata",
    "termine": "Partenza anticipata",
    "inglese": "Jump start",
    "categoria": "Regolamento e gara",
    "definizione": "Muovere l'auto prima dello spegnimento dei semafori. È punita con una penalità in tempo.",
    "esempio": "Penalità di cinque secondi per partenza anticipata."
  },
  {
    "id": "qualifica",
    "termine": "Qualifica",
    "inglese": "Qualifying",
    "categoria": "Regolamento e gara",
    "definizione": "La sessione che decide la griglia, divisa in tre parti a eliminazione: Q1, Q2 e Q3.",
    "esempio": "È uscito in Q2 per sei millesimi."
  },
  {
    "id": "q1-q2-q3",
    "termine": "Q1, Q2, Q3",
    "inglese": null,
    "categoria": "Regolamento e gara",
    "definizione": "Le tre fasi della qualifica. Con 22 auto (dal 2026) le sei più lente escono in Q1, altre sei in Q2; le ultime dieci si giocano la pole in Q3.",
    "esempio": "In Q3 ha fatto il giro perfetto."
  },
  {
    "id": "regola-del-107",
    "termine": "Regola del 107%",
    "inglese": "107% rule",
    "categoria": "Regolamento e gara",
    "definizione": "Per essere ammessi alla gara bisogna girare in qualifica entro il 107% del miglior tempo di Q1. I commissari possono fare eccezioni.",
    "esempio": "Fuori dal 107%, ma ammesso dai commissari."
  },
  {
    "id": "sprint",
    "termine": "Sprint",
    "inglese": "Sprint race",
    "categoria": "Regolamento e gara",
    "definizione": "Gara breve (circa 100 km) disputata il sabato in alcuni weekend, con una propria qualifica e punti ai primi otto.",
    "esempio": "Ha vinto la Sprint ma domenica parte sesto."
  },
  {
    "id": "sprint-qualifying",
    "termine": "Sprint Qualifying",
    "inglese": "Sprint Shootout",
    "categoria": "Regolamento e gara",
    "definizione": "La qualifica che decide la griglia della Sprint, più breve di quella del Gran Premio.",
    "esempio": "Ha sbagliato l'ultimo giro della Sprint Qualifying."
  },
  {
    "id": "prove-libere",
    "termine": "Prove libere",
    "inglese": "Free Practice (FP1, FP2, FP3)",
    "categoria": "Regolamento e gara",
    "definizione": "Le sessioni di allenamento del venerdì e del sabato, usate per mettere a punto l'auto. Nei weekend Sprint ce n'è una sola.",
    "esempio": "In FP2 hanno provato il passo gara."
  },
  {
    "id": "punti",
    "termine": "Punti",
    "inglese": "Points",
    "categoria": "Regolamento e gara",
    "definizione": "Ai primi dieci del Gran Premio: 25, 18, 15, 12, 10, 8, 6, 4, 2, 1. Dal 2025 non c'è più il punto per il giro più veloce.",
    "esempio": "Sesto posto, otto punti preziosi."
  },
  {
    "id": "campionato-costruttori",
    "termine": "Campionato Costruttori",
    "inglese": "Constructors' Championship",
    "categoria": "Regolamento e gara",
    "definizione": "La classifica delle squadre, che somma i punti di entrambi i piloti. Decide anche la ripartizione dei premi tra i team.",
    "esempio": "Due podi che valgono il secondo posto tra i Costruttori."
  },
  {
    "id": "campionato-piloti",
    "termine": "Campionato Piloti",
    "inglese": "Drivers' Championship",
    "categoria": "Regolamento e gara",
    "definizione": "La classifica individuale dei piloti: chi ha più punti a fine stagione è campione del mondo.",
    "esempio": "Con tre gare da correre è a 40 punti dal leader."
  },
  {
    "id": "doppietta",
    "termine": "Doppietta",
    "inglese": "One-two",
    "categoria": "Regolamento e gara",
    "definizione": "Primo e secondo posto conquistati dai due piloti della stessa squadra.",
    "esempio": "Prima doppietta della stagione per il team."
  },
  {
    "id": "podio",
    "termine": "Podio",
    "inglese": "Podium",
    "categoria": "Regolamento e gara",
    "definizione": "I primi tre classificati, e la pedana su cui ricevono i trofei.",
    "esempio": "Il suo primo podio in carriera."
  },
  {
    "id": "hat-trick",
    "termine": "Hat-trick",
    "inglese": null,
    "categoria": "Regolamento e gara",
    "definizione": "Pole position, vittoria e giro più veloce nello stesso Gran Premio.",
    "esempio": "Hat-trick perfetto a Silverstone."
  },
  {
    "id": "grand-chelem",
    "termine": "Grand Chelem",
    "inglese": "Grand Slam",
    "categoria": "Regolamento e gara",
    "definizione": "Pole, vittoria, giro più veloce e comando della gara dal primo all'ultimo giro: il weekend perfetto.",
    "esempio": "Un Grand Chelem è rarissimo: ce ne sono stati poche decine in tutta la storia."
  },
  {
    "id": "giro-piu-veloce",
    "termine": "Giro più veloce",
    "inglese": "Fastest lap",
    "categoria": "Regolamento e gara",
    "definizione": "Il miglior tempo sul giro fatto registrare in gara. Dal 2025 non assegna più punti.",
    "esempio": "Si è fermato a fine gara per tentare il giro più veloce."
  },
  {
    "id": "doppiato",
    "termine": "Doppiato",
    "inglese": "Lapped",
    "categoria": "Regolamento e gara",
    "definizione": "Pilota superato dal leader e quindi in ritardo di uno o più giri.",
    "esempio": "Ha chiuso undicesimo, doppiato."
  },
  {
    "id": "bandiera-a-scacchi",
    "termine": "Bandiera a scacchi",
    "inglese": "Chequered flag",
    "categoria": "Regolamento e gara",
    "definizione": "La bandiera bianca e nera che segnala la fine della sessione o della gara.",
    "esempio": "Ha tagliato il traguardo sotto la bandiera a scacchi con un secondo di vantaggio."
  },
  {
    "id": "ritirato",
    "termine": "Ritirato",
    "inglese": "DNF (Did Not Finish)",
    "categoria": "Regolamento e gara",
    "definizione": "Pilota che non ha terminato la gara per guasto, incidente o altro.",
    "esempio": "Secondo ritiro di fila per un problema all'impianto idraulico."
  },
  {
    "id": "dns",
    "termine": "DNS",
    "inglese": "Did Not Start",
    "categoria": "Regolamento e gara",
    "definizione": "Pilota che si è iscritto alla gara ma non ha preso il via.",
    "esempio": "Problema sul giro di formazione: DNS."
  },
  {
    "id": "squalificato",
    "termine": "Squalificato",
    "inglese": "DSQ",
    "categoria": "Regolamento e gara",
    "definizione": "Pilota escluso dalla classifica, per esempio per un'irregolarità tecnica dell'auto scoperta nelle verifiche.",
    "esempio": "Squalificato a fine gara: il fondo era troppo consumato."
  },
  {
    "id": "non-classificato",
    "termine": "Non classificato",
    "inglese": "NC",
    "categoria": "Regolamento e gara",
    "definizione": "Pilota ancora in gara alla fine ma che non ha percorso abbastanza distanza (il 90% di quella del vincitore) per entrare in classifica.",
    "esempio": "Ai box per mezz'ora: arrivato, ma non classificato."
  },
  {
    "id": "parco-chiuso",
    "termine": "Parco chiuso",
    "inglese": "Parc fermé",
    "categoria": "Regolamento e gara",
    "definizione": "Regime in cui le auto non possono essere modificate se non per piccoli interventi permessi: va dall'inizio della qualifica alla gara.",
    "esempio": "Hanno cambiato l'assetto in parco chiuso: partono dalla corsia dei box."
  },
  {
    "id": "verifiche-tecniche",
    "termine": "Verifiche tecniche",
    "inglese": "Scrutineering",
    "categoria": "Regolamento e gara",
    "definizione": "I controlli dei tecnici FIA su peso, misure e componenti delle auto, prima e dopo le sessioni.",
    "esempio": "Superate le verifiche tecniche, la vittoria è confermata."
  },
  {
    "id": "peso-minimo",
    "termine": "Peso minimo",
    "inglese": "Minimum weight",
    "categoria": "Regolamento e gara",
    "definizione": "Il peso sotto cui l'auto non può scendere, pilota compreso. Dal 2026 è di 768 kg, 30 kg in meno della generazione precedente.",
    "esempio": "Sono sopra il peso minimo: ogni chilo in più costa tempo."
  },
  {
    "id": "zavorra",
    "termine": "Zavorra",
    "inglese": "Ballast",
    "categoria": "Regolamento e gara",
    "definizione": "Pesi aggiunti all'auto per raggiungere il peso minimo, sistemati dove migliorano il bilanciamento.",
    "esempio": "Un'auto sotto il peso può piazzare la zavorra dove vuole."
  },
  {
    "id": "commissari-sportivi",
    "termine": "Commissari sportivi",
    "inglese": "Stewards",
    "categoria": "Regolamento e gara",
    "definizione": "I giudici di gara: esaminano gli episodi e decidono le penalità.",
    "esempio": "L'episodio è sotto investigazione dei commissari."
  },
  {
    "id": "direttore-di-gara",
    "termine": "Direttore di gara",
    "inglese": "Race Director",
    "categoria": "Regolamento e gara",
    "definizione": "Il responsabile FIA dello svolgimento della gara: decide bandiere, safety car e sospensioni.",
    "esempio": "Il direttore di gara ha esposto la bandiera rossa."
  },
  {
    "id": "penalita-in-tempo",
    "termine": "Penalità in tempo",
    "inglese": "Time penalty",
    "categoria": "Regolamento e gara",
    "definizione": "Secondi aggiunti al tempo del pilota (5 o 10), da scontare a un pit stop o sommati a fine gara.",
    "esempio": "Cinque secondi per aver lasciato la pista guadagnando un vantaggio."
  },
  {
    "id": "drive-through",
    "termine": "Drive-through",
    "inglese": null,
    "categoria": "Regolamento e gara",
    "definizione": "Penalità che obbliga il pilota a passare nella corsia dei box al limite di velocità, senza fermarsi.",
    "esempio": "Drive-through per eccesso di velocità in pit lane."
  },
  {
    "id": "stop-and-go",
    "termine": "Stop-and-go",
    "inglese": null,
    "categoria": "Regolamento e gara",
    "definizione": "Penalità più severa: il pilota deve entrare ai box e restare fermo per un tempo stabilito (di solito 10 secondi) senza che si lavori sull'auto.",
    "esempio": "Stop-and-go di dieci secondi: gara compromessa."
  },
  {
    "id": "penalita-in-griglia",
    "termine": "Penalità in griglia",
    "inglese": "Grid penalty",
    "categoria": "Regolamento e gara",
    "definizione": "Arretramento di posizioni sulla griglia, per esempio per aver superato il numero di componenti della power unit concessi.",
    "esempio": "Dieci posizioni di penalità per un nuovo motore."
  },
  {
    "id": "reprimenda",
    "termine": "Reprimenda",
    "inglese": "Reprimand",
    "categoria": "Regolamento e gara",
    "definizione": "Richiamo ufficiale dei commissari. Accumularne troppe nella stagione porta a una penalità in griglia.",
    "esempio": "Se la cava con una reprimenda."
  },
  {
    "id": "punti-penalita",
    "termine": "Punti penalità",
    "inglese": "Penalty points",
    "categoria": "Regolamento e gara",
    "definizione": "Punti sulla superlicenza assegnati per infrazioni di guida: 12 in dodici mesi significano una gara di squalifica.",
    "esempio": "Con due punti in più rischia di saltare una gara."
  },
  {
    "id": "superlicenza",
    "termine": "Superlicenza",
    "inglese": "Super Licence",
    "categoria": "Regolamento e gara",
    "definizione": "La licenza FIA obbligatoria per correre in F1. Si ottiene accumulando punti nelle categorie minori (40 negli ultimi tre anni).",
    "esempio": "Gli mancano i punti per la superlicenza."
  },
  {
    "id": "limiti-della-pista",
    "termine": "Limiti della pista",
    "inglese": "Track limits",
    "categoria": "Regolamento e gara",
    "definizione": "La pista finisce dove finiscono le linee bianche: uscirne con tutte e quattro le ruote fa cancellare il giro o, in gara, porta a penalità.",
    "esempio": "Tempo cancellato per i limiti della pista in curva 4."
  },
  {
    "id": "budget-cap",
    "termine": "Budget cap",
    "inglese": "Cost cap",
    "categoria": "Regolamento e gara",
    "definizione": "Il tetto di spesa annuale imposto alle squadre dal 2021, per contenere i costi e avvicinare i valori in campo.",
    "esempio": "Hanno sforato il budget cap: multa e meno tempo in galleria del vento."
  },
  {
    "id": "patto-della-concordia",
    "termine": "Patto della Concordia",
    "inglese": "Concorde Agreement",
    "categoria": "Regolamento e gara",
    "definizione": "L'accordo tra FIA, Formula 1 e squadre che regola diritti, ricavi e governance del campionato.",
    "esempio": "Il nuovo Patto della Concordia garantisce l'ingresso di un undicesimo team."
  },
  {
    "id": "pilota-di-riserva",
    "termine": "Pilota di riserva",
    "inglese": "Reserve driver",
    "categoria": "Regolamento e gara",
    "definizione": "Il pilota pronto a sostituire un titolare indisponibile; spesso lavora al simulatore.",
    "esempio": "Debutto improvviso del pilota di riserva."
  },
  {
    "id": "rookie",
    "termine": "Rookie",
    "inglese": "Esordiente",
    "categoria": "Regolamento e gara",
    "definizione": "Pilota alla prima stagione in Formula 1.",
    "esempio": "Il miglior rookie dell'anno."
  },
  {
    "id": "bandiera-gialla",
    "termine": "Bandiera gialla",
    "inglese": "Yellow flag",
    "categoria": "Bandiere e sicurezza",
    "definizione": "Pericolo vicino alla pista: bisogna rallentare ed è vietato sorpassare. Due bandiere gialle agitate indicano un pericolo grave.",
    "esempio": "Ha migliorato il tempo in regime di doppia gialla: giro cancellato."
  },
  {
    "id": "bandiera-verde",
    "termine": "Bandiera verde",
    "inglese": "Green flag",
    "categoria": "Bandiere e sicurezza",
    "definizione": "Fine del pericolo: si può tornare a velocità piena.",
    "esempio": "Bandiera verde, si riparte."
  },
  {
    "id": "bandiera-rossa",
    "termine": "Bandiera rossa",
    "inglese": "Red flag",
    "categoria": "Bandiere e sicurezza",
    "definizione": "Sessione sospesa: tutti rientrano lentamente nella corsia dei box.",
    "esempio": "Bandiera rossa per le barriere da riparare."
  },
  {
    "id": "bandiera-blu",
    "termine": "Bandiera blu",
    "inglese": "Blue flag",
    "categoria": "Bandiere e sicurezza",
    "definizione": "Mostrata a chi sta per essere doppiato: deve lasciar passare l'auto più veloce.",
    "esempio": "Ha ignorato tre bandiere blu: penalità."
  },
  {
    "id": "bandiera-bianca",
    "termine": "Bandiera bianca",
    "inglese": "White flag",
    "categoria": "Bandiere e sicurezza",
    "definizione": "Avverte che in pista c'è un mezzo lento, per esempio un'auto di servizio.",
    "esempio": "Bandiera bianca: trattore in uscita di curva."
  },
  {
    "id": "bandiera-nera",
    "termine": "Bandiera nera",
    "inglese": "Black flag",
    "categoria": "Bandiere e sicurezza",
    "definizione": "Squalifica: il pilota deve rientrare ai box immediatamente.",
    "esempio": "La bandiera nera in F1 è rarissima."
  },
  {
    "id": "bandiera-nera-con-disco-arancione",
    "termine": "Bandiera nera con disco arancione",
    "inglese": "Meatball flag",
    "categoria": "Bandiere e sicurezza",
    "definizione": "Il pilota deve rientrare ai box per un problema tecnico pericoloso, come un pezzo che si sta staccando.",
    "esempio": "Ala anteriore penzolante: arriva la bandiera col disco arancione."
  },
  {
    "id": "bandiera-bianca-e-nera",
    "termine": "Bandiera bianca e nera",
    "inglese": "Black and white flag",
    "categoria": "Bandiere e sicurezza",
    "definizione": "Avvertimento per comportamento antisportivo: è l'ultimo richiamo prima di una penalità.",
    "esempio": "Bandiera bianca e nera per i troppi limiti superati."
  },
  {
    "id": "bandiera-a-strisce-gialle-e-rosse",
    "termine": "Bandiera a strisce gialle e rosse",
    "inglese": "Slippery surface flag",
    "categoria": "Bandiere e sicurezza",
    "definizione": "Avverte che l'asfalto è scivoloso, per olio, detriti o pioggia.",
    "esempio": "Bandiera a strisce: c'è olio in curva 9."
  },
  {
    "id": "safety-car",
    "termine": "Safety car",
    "inglese": "SC",
    "categoria": "Bandiere e sicurezza",
    "definizione": "L'auto di sicurezza che entra in pista e fa da guida al gruppo a velocità ridotta, quando serve neutralizzare la gara.",
    "esempio": "Safety car in pista: tutti ai box per gomme nuove."
  },
  {
    "id": "virtual-safety-car",
    "termine": "Virtual safety car",
    "inglese": "VSC",
    "categoria": "Bandiere e sicurezza",
    "definizione": "Neutralizzazione senza auto in pista: ogni pilota deve rispettare un tempo minimo per settore, come se seguisse una safety car.",
    "esempio": "Si è fermato durante la VSC risparmiando metà tempo."
  },
  {
    "id": "medical-car",
    "termine": "Medical car",
    "inglese": null,
    "categoria": "Bandiere e sicurezza",
    "definizione": "L'auto medica che segue il primo giro e interviene in caso di incidente.",
    "esempio": "La medical car è arrivata in pochi secondi."
  },
  {
    "id": "halo",
    "termine": "Halo",
    "inglese": null,
    "categoria": "Bandiere e sicurezza",
    "definizione": "L'arco di titanio sopra l'abitacolo che protegge la testa del pilota, obbligatorio dal 2018.",
    "esempio": "L'halo gli ha salvato la vita."
  },
  {
    "id": "hans",
    "termine": "HANS",
    "inglese": "Head and Neck Support",
    "categoria": "Bandiere e sicurezza",
    "definizione": "Il collare in carbonio, collegato al casco, che limita i movimenti di testa e collo negli urti.",
    "esempio": "Senza HANS quell'impatto sarebbe stato fatale."
  },
  {
    "id": "cellula-di-sopravvivenza",
    "termine": "Cellula di sopravvivenza",
    "inglese": "Survival cell",
    "categoria": "Bandiere e sicurezza",
    "definizione": "La parte della monoscocca attorno al pilota, progettata per non deformarsi negli incidenti.",
    "esempio": "La cellula di sopravvivenza è rimasta intatta."
  },
  {
    "id": "via-di-fuga",
    "termine": "Via di fuga",
    "inglese": "Run-off area",
    "categoria": "Bandiere e sicurezza",
    "definizione": "Lo spazio oltre il bordo pista dove un'auto che esce può rallentare: asfalto, ghiaia o erba.",
    "esempio": "Ha usato la via di fuga per evitare il contatto."
  },
  {
    "id": "ghiaia",
    "termine": "Ghiaia",
    "inglese": "Gravel trap",
    "categoria": "Bandiere e sicurezza",
    "definizione": "Letto di ghiaia oltre la curva che frena le auto uscite di pista.",
    "esempio": "Insabbiato nella ghiaia, gara finita."
  },
  {
    "id": "barriere",
    "termine": "Barriere",
    "inglese": "Barriers",
    "categoria": "Bandiere e sicurezza",
    "definizione": "Protezioni a bordo pista: guard-rail, muri e barriere ad assorbimento d'urto (come le TecPro).",
    "esempio": "Le barriere hanno assorbito bene l'urto."
  },
  {
    "id": "commissari-di-percorso",
    "termine": "Commissari di percorso",
    "inglese": "Marshals",
    "categoria": "Bandiere e sicurezza",
    "definizione": "I volontari a bordo pista che espongono le bandiere e rimuovono auto e detriti.",
    "esempio": "Applausi ai marshal per il lavoro sotto la pioggia."
  },
  {
    "id": "pellicola-della-visiera",
    "termine": "Pellicola della visiera",
    "inglese": "Tear-off",
    "categoria": "Bandiere e sicurezza",
    "definizione": "Le pellicole trasparenti sovrapposte sulla visiera, che il pilota strappa quando si sporcano.",
    "esempio": "Ha buttato via un tear-off in curva 1: è finito nella presa d'aria di chi seguiva."
  },
  {
    "id": "box",
    "termine": "Box",
    "inglese": "Pit",
    "categoria": "Box e strategia",
    "definizione": "Lo spazio della squadra lungo la corsia dei box, dove si cambiano le gomme e si lavora sull'auto. «Box, box» è l'ordine di rientrare.",
    "esempio": "Box, box, box: gomme dure."
  },
  {
    "id": "corsia-dei-box",
    "termine": "Corsia dei box",
    "inglese": "Pit lane",
    "categoria": "Box e strategia",
    "definizione": "La strada parallela al rettilineo dove si trovano i box, con limite di velocità (di solito 80 km/h).",
    "esempio": "Eccesso di velocità in corsia dei box."
  },
  {
    "id": "pit-stop",
    "termine": "Pit stop",
    "inglese": null,
    "categoria": "Box e strategia",
    "definizione": "La sosta ai box per cambiare le gomme (e, se serve, l'ala anteriore). Un cambio gomme ben fatto dura circa due secondi.",
    "esempio": "Pit stop da 2,1 secondi."
  },
  {
    "id": "limitatore",
    "termine": "Limitatore",
    "inglese": "Pit limiter",
    "categoria": "Box e strategia",
    "definizione": "Il dispositivo che il pilota attiva entrando in corsia dei box per non superare il limite di velocità.",
    "esempio": "Ha attivato il limitatore in ritardo."
  },
  {
    "id": "muretto-box",
    "termine": "Muretto box",
    "inglese": "Pit wall",
    "categoria": "Box e strategia",
    "definizione": "La postazione dove ingegneri e responsabili seguono la gara e decidono la strategia.",
    "esempio": "Al muretto hanno visto la pioggia arrivare prima di tutti."
  },
  {
    "id": "strategia",
    "termine": "Strategia",
    "inglese": "Strategy",
    "categoria": "Box e strategia",
    "definizione": "Il piano di gara: quante soste fare, quando e con quali gomme.",
    "esempio": "Una strategia a una sosta."
  },
  {
    "id": "stint",
    "termine": "Stint",
    "inglese": null,
    "categoria": "Box e strategia",
    "definizione": "Il tratto di gara percorso con lo stesso treno di gomme, tra due soste.",
    "esempio": "Uno stint lunghissimo con le dure."
  },
  {
    "id": "finestra-di-pit-stop",
    "termine": "Finestra di pit stop",
    "inglese": "Pit window",
    "categoria": "Box e strategia",
    "definizione": "L'intervallo di giri in cui conviene fermarsi.",
    "esempio": "Si apre la finestra per la sosta."
  },
  {
    "id": "undercut",
    "termine": "Undercut",
    "inglese": null,
    "categoria": "Box e strategia",
    "definizione": "Fermarsi prima dell'avversario e sfruttare le gomme nuove per guadagnare tempo e scavalcarlo quando si ferma lui.",
    "esempio": "L'undercut ha funzionato: davanti dopo le soste."
  },
  {
    "id": "overcut",
    "termine": "Overcut",
    "inglese": null,
    "categoria": "Box e strategia",
    "definizione": "Fermarsi dopo l'avversario, contando di girare più forte in pista libera mentre lui scalda le gomme nuove.",
    "esempio": "Ha guadagnato la posizione con l'overcut."
  },
  {
    "id": "sosta-gratuita",
    "termine": "Sosta gratuita",
    "inglese": "Free pit stop",
    "categoria": "Box e strategia",
    "definizione": "Una sosta che costa poco tempo perché fatta in regime di safety car o con un grande vantaggio su chi segue.",
    "esempio": "Con la safety car arriva una sosta quasi gratuita."
  },
  {
    "id": "doppia-sosta",
    "termine": "Doppia sosta",
    "inglese": "Double stack",
    "categoria": "Box e strategia",
    "definizione": "I due piloti della stessa squadra che si fermano nello stesso giro, uno dopo l'altro.",
    "esempio": "Doppia sosta perfetta, nessuno ha perso tempo."
  },
  {
    "id": "delta",
    "termine": "Delta",
    "inglese": null,
    "categoria": "Box e strategia",
    "definizione": "La differenza di tempo rispetto a un riferimento (un altro pilota o il proprio tempo obiettivo).",
    "esempio": "Tieni il delta della VSC positivo."
  },
  {
    "id": "distacco",
    "termine": "Distacco",
    "inglese": "Gap",
    "categoria": "Box e strategia",
    "definizione": "La distanza in secondi da chi precede o da chi segue.",
    "esempio": "Il distacco è sceso sotto il secondo."
  },
  {
    "id": "passo",
    "termine": "Passo",
    "inglese": "Pace",
    "categoria": "Box e strategia",
    "definizione": "Il ritmo che un pilota riesce a tenere giro dopo giro.",
    "esempio": "Ha il passo per vincere."
  },
  {
    "id": "passo-gara",
    "termine": "Passo gara",
    "inglese": "Race pace",
    "categoria": "Box e strategia",
    "definizione": "Il ritmo con il carico di carburante e le gomme da gara, diverso dal giro secco di qualifica.",
    "esempio": "Veloce in qualifica, ma il passo gara è un'altra cosa."
  },
  {
    "id": "giro-secco",
    "termine": "Giro secco",
    "inglese": "One-lap pace",
    "categoria": "Box e strategia",
    "definizione": "La velocità su un solo giro, con poco carburante e gomme fresche, come in qualifica.",
    "esempio": "Imbattibile sul giro secco."
  },
  {
    "id": "gestione",
    "termine": "Gestione",
    "inglese": "Management",
    "categoria": "Box e strategia",
    "definizione": "Guidare sotto il limite per risparmiare gomme, freni, carburante o energia elettrica.",
    "esempio": "Sta gestendo: ha margine."
  },
  {
    "id": "lift-and-coast",
    "termine": "Lift and coast",
    "inglese": null,
    "categoria": "Box e strategia",
    "definizione": "Alzare il piede dall'acceleratore prima della frenata, lasciando scorrere l'auto, per risparmiare carburante o energia.",
    "esempio": "Il team gli chiede lift and coast nel tratto veloce."
  },
  {
    "id": "ordini-di-scuderia",
    "termine": "Ordini di scuderia",
    "inglese": "Team orders",
    "categoria": "Box e strategia",
    "definizione": "Istruzioni della squadra ai piloti, per esempio di scambiarsi la posizione.",
    "esempio": "Ordine di scuderia: lascia passare il compagno."
  },
  {
    "id": "ingegnere-di-pista",
    "termine": "Ingegnere di pista",
    "inglese": "Race engineer",
    "categoria": "Box e strategia",
    "definizione": "L'ingegnere che parla con il pilota via radio e coordina il lavoro sulla sua auto.",
    "esempio": "L'ingegnere di pista lo avvisa della pioggia."
  },
  {
    "id": "team-principal",
    "termine": "Team principal",
    "inglese": null,
    "categoria": "Box e strategia",
    "definizione": "Il responsabile della squadra, che ne guida la parte sportiva e spesso quella gestionale.",
    "esempio": "Il team principal difende il suo pilota."
  },
  {
    "id": "radio-di-squadra",
    "termine": "Radio di squadra",
    "inglese": "Team radio",
    "categoria": "Box e strategia",
    "definizione": "Le comunicazioni tra pilota e muretto, in parte trasmesse in televisione.",
    "esempio": "Il team radio dopo la vittoria è da brividi."
  },
  {
    "id": "telemetria",
    "termine": "Telemetria",
    "inglese": "Telemetry",
    "categoria": "Box e strategia",
    "definizione": "I dati dei sensori dell'auto inviati in tempo reale ai box: velocità, temperature, pressioni.",
    "esempio": "La telemetria mostra un problema ai freni."
  },
  {
    "id": "settore",
    "termine": "Settore",
    "inglese": "Sector",
    "categoria": "Box e strategia",
    "definizione": "Ognuna delle tre parti in cui è diviso il giro per la cronometria.",
    "esempio": "Più veloce di tutti nel secondo settore."
  },
  {
    "id": "settore-viola",
    "termine": "Settore viola",
    "inglese": "Purple sector",
    "categoria": "Box e strategia",
    "definizione": "Il tempo più veloce in assoluto in quel settore, indicato in viola nelle grafiche. Il verde indica il miglior tempo personale.",
    "esempio": "Viola nel primo settore, ma rallenta nel terzo."
  },
  {
    "id": "speed-trap",
    "termine": "Speed trap",
    "inglese": null,
    "categoria": "Box e strategia",
    "definizione": "Il punto della pista dove si misura la velocità massima delle auto.",
    "esempio": "Il più veloce allo speed trap: 345 km/h."
  },
  {
    "id": "simulatore",
    "termine": "Simulatore",
    "inglese": "Simulator",
    "categoria": "Box e strategia",
    "definizione": "Il simulatore della squadra, usato per preparare i weekend e sviluppare l'assetto.",
    "esempio": "Ha passato la notte al simulatore."
  },
  {
    "id": "galleria-del-vento",
    "termine": "Galleria del vento",
    "inglese": "Wind tunnel",
    "categoria": "Box e strategia",
    "definizione": "La struttura dove si provano modelli in scala per studiare l'aerodinamica. Le ore permesse sono limitate dal regolamento.",
    "esempio": "Chi è ultimo nei Costruttori ha più ore di galleria del vento."
  },
  {
    "id": "cfd",
    "termine": "CFD",
    "inglese": "Computational Fluid Dynamics",
    "categoria": "Box e strategia",
    "definizione": "La simulazione al computer del flusso d'aria attorno all'auto.",
    "esempio": "Hanno disegnato il nuovo fondo con la CFD."
  },
  {
    "id": "mescola",
    "termine": "Mescola",
    "inglese": "Compound",
    "categoria": "Gomme",
    "definizione": "La composizione della gomma, da più dura a più morbida. Pirelli ne ha sei per l'asciutto (da C1 a C6) e ne porta tre per weekend.",
    "esempio": "Hanno portato le tre mescole più morbide per Monaco."
  },
  {
    "id": "gomma-dura",
    "termine": "Gomma dura",
    "inglese": "Hard",
    "categoria": "Gomme",
    "definizione": "La più resistente delle tre portate nel weekend, con banda bianca: meno veloce, dura di più.",
    "esempio": "Lungo stint con la dura."
  },
  {
    "id": "gomma-media",
    "termine": "Gomma media",
    "inglese": "Medium",
    "categoria": "Gomme",
    "definizione": "La mescola intermedia del weekend, con banda gialla.",
    "esempio": "Partenza con le medie."
  },
  {
    "id": "gomma-morbida",
    "termine": "Gomma morbida",
    "inglese": "Soft",
    "categoria": "Gomme",
    "definizione": "La più veloce e la meno resistente del weekend, con banda rossa.",
    "esempio": "Morbide per il giro di qualifica."
  },
  {
    "id": "intermedia",
    "termine": "Intermedia",
    "inglese": "Intermediate",
    "categoria": "Gomme",
    "definizione": "Gomma con banda verde e scolpitura leggera, per pista umida o con poca acqua.",
    "esempio": "Tutti sulle intermedie: la pista si asciuga."
  },
  {
    "id": "gomma-da-bagnato",
    "termine": "Gomma da bagnato",
    "inglese": "Full wet",
    "categoria": "Gomme",
    "definizione": "Gomma con banda blu e scolpitura profonda, che smaltisce molta acqua.",
    "esempio": "Con la pioggia forte servono le full wet."
  },
  {
    "id": "slick",
    "termine": "Slick",
    "inglese": null,
    "categoria": "Gomme",
    "definizione": "Gomma liscia, senza scolpitura, usata sull'asciutto: più gomma a terra, più aderenza.",
    "esempio": "Il primo a rischiare le slick."
  },
  {
    "id": "degrado",
    "termine": "Degrado",
    "inglese": "Degradation",
    "categoria": "Gomme",
    "definizione": "Il calo di prestazione della gomma con l'usura e la temperatura.",
    "esempio": "Degrado alto: saranno due soste."
  },
  {
    "id": "crollo-della-gomma",
    "termine": "Crollo della gomma",
    "inglese": "Cliff",
    "categoria": "Gomme",
    "definizione": "Il momento in cui una gomma consumata perde aderenza di colpo.",
    "esempio": "È arrivato il cliff: perde due secondi al giro."
  },
  {
    "id": "graining",
    "termine": "Graining",
    "inglese": null,
    "categoria": "Gomme",
    "definizione": "Piccoli granuli di gomma che si staccano e si incollano al battistrada, riducendo l'aderenza. Succede soprattutto con pista fredda.",
    "esempio": "Graining sull'anteriore sinistra."
  },
  {
    "id": "blistering",
    "termine": "Blistering",
    "inglese": null,
    "categoria": "Gomme",
    "definizione": "Bolle sul battistrada causate dal surriscaldamento della gomma.",
    "esempio": "Blistering sulle posteriori dopo dieci giri."
  },
  {
    "id": "spiattellamento",
    "termine": "Spiattellamento",
    "inglese": "Flat spot",
    "categoria": "Gomme",
    "definizione": "Zona piatta sulla gomma dovuta a un bloccaggio in frenata, che provoca vibrazioni.",
    "esempio": "Spiattellamento dopo il bloccaggio: vibra tutto."
  },
  {
    "id": "bloccaggio",
    "termine": "Bloccaggio",
    "inglese": "Lock-up",
    "categoria": "Gomme",
    "definizione": "La ruota che smette di girare in frenata e striscia sull'asfalto, spesso con fumo.",
    "esempio": "Bloccaggio all'anteriore destra: lungo alla chicane."
  },
  {
    "id": "detriti-di-gomma",
    "termine": "Detriti di gomma",
    "inglese": "Marbles / pick-up",
    "categoria": "Gomme",
    "definizione": "I pezzetti di gomma che si accumulano fuori traiettoria e possono attaccarsi alle gomme di chi ci passa sopra.",
    "esempio": "Fuori traiettoria è pieno di marbles."
  },
  {
    "id": "termocoperte",
    "termine": "Termocoperte",
    "inglese": "Tyre blankets",
    "categoria": "Gomme",
    "definizione": "Coperte elettriche che scaldano le gomme prima di montarle.",
    "esempio": "Le gomme escono dalle termocoperte già in temperatura."
  },
  {
    "id": "finestra-di-temperatura",
    "termine": "Finestra di temperatura",
    "inglese": "Operating window",
    "categoria": "Gomme",
    "definizione": "L'intervallo di temperatura in cui la gomma dà il massimo dell'aderenza.",
    "esempio": "Non riesce a portare le gomme nella finestra."
  },
  {
    "id": "treno-di-gomme",
    "termine": "Treno di gomme",
    "inglese": "Set",
    "categoria": "Gomme",
    "definizione": "Quattro gomme montate insieme. Ogni pilota ha un numero limitato di treni per weekend.",
    "esempio": "Ha risparmiato un treno di morbide per la gara."
  },
  {
    "id": "regola-delle-due-mescole",
    "termine": "Regola delle due mescole",
    "inglese": "Two-compound rule",
    "categoria": "Gomme",
    "definizione": "In una gara asciutta ogni pilota deve usare almeno due mescole diverse da asciutto.",
    "esempio": "Ha rispettato la regola delle due mescole all'ultimo giro."
  },
  {
    "id": "pirelli",
    "termine": "Pirelli",
    "inglese": null,
    "categoria": "Gomme",
    "definizione": "Il fornitore unico delle gomme di Formula 1 dal 2011.",
    "esempio": "Pirelli porta le mescole più dure per Suzuka."
  },
  {
    "id": "traiettoria",
    "termine": "Traiettoria",
    "inglese": "Racing line",
    "categoria": "Pista e guida",
    "definizione": "La linea più veloce per percorrere il circuito.",
    "esempio": "È uscito dalla traiettoria per difendersi."
  },
  {
    "id": "corda",
    "termine": "Corda",
    "inglese": "Apex",
    "categoria": "Pista e guida",
    "definizione": "Il punto interno della curva a cui l'auto si avvicina di più.",
    "esempio": "Ha mancato la corda."
  },
  {
    "id": "punto-di-frenata",
    "termine": "Punto di frenata",
    "inglese": "Braking point",
    "categoria": "Pista e guida",
    "definizione": "Dove il pilota comincia a frenare prima di una curva.",
    "esempio": "Ha ritardato il punto di frenata di dieci metri."
  },
  {
    "id": "staccata",
    "termine": "Staccata",
    "inglese": "Late braking",
    "categoria": "Pista e guida",
    "definizione": "La frenata violenta prima di una curva; «staccare» significa frenare il più tardi possibile.",
    "esempio": "Sorpasso in staccata alla prima variante."
  },
  {
    "id": "trail-braking",
    "termine": "Trail braking",
    "inglese": null,
    "categoria": "Pista e guida",
    "definizione": "Continuare a frenare, sempre meno, mentre si inserisce l'auto in curva.",
    "esempio": "Maestro del trail braking."
  },
  {
    "id": "sottosterzo",
    "termine": "Sottosterzo",
    "inglese": "Understeer",
    "categoria": "Pista e guida",
    "definizione": "L'auto non gira abbastanza: l'anteriore scivola e la macchina allarga.",
    "esempio": "Sottosterzo in ingresso nelle curve lente."
  },
  {
    "id": "sovrasterzo",
    "termine": "Sovrasterzo",
    "inglese": "Oversteer",
    "categoria": "Pista e guida",
    "definizione": "Il posteriore perde aderenza e l'auto tende a girarsi.",
    "esempio": "Sovrasterzo in uscita: ha dovuto correggere."
  },
  {
    "id": "trazione",
    "termine": "Trazione",
    "inglese": "Traction",
    "categoria": "Pista e guida",
    "definizione": "La capacità di scaricare a terra la potenza in accelerazione senza far slittare le ruote.",
    "esempio": "Problemi di trazione in uscita dai tornanti."
  },
  {
    "id": "cordolo",
    "termine": "Cordolo",
    "inglese": "Kerb",
    "categoria": "Pista e guida",
    "definizione": "Il bordo rialzato, dipinto a strisce, all'interno e all'esterno delle curve.",
    "esempio": "Ha preso il cordolo troppo forte e si è alzato."
  },
  {
    "id": "chicane",
    "termine": "Chicane",
    "inglese": "Variante",
    "categoria": "Pista e guida",
    "definizione": "Sequenza di curve strette a destra e a sinistra, spesso costruita per rallentare le auto.",
    "esempio": "Ha tagliato la chicane."
  },
  {
    "id": "tornante",
    "termine": "Tornante",
    "inglese": "Hairpin",
    "categoria": "Pista e guida",
    "definizione": "Curva molto stretta, di circa 180 gradi, che si fa a bassa velocità.",
    "esempio": "Il tornante di Monaco si fa nelle marce più basse, a meno di 60 km/h."
  },
  {
    "id": "esse",
    "termine": "Esse",
    "inglese": "Esses",
    "categoria": "Pista e guida",
    "definizione": "Sequenza di curve veloci alternate, come le «S» di Suzuka.",
    "esempio": "Nelle esse si vede chi ha carico aerodinamico."
  },
  {
    "id": "rettilineo",
    "termine": "Rettilineo",
    "inglese": "Straight",
    "categoria": "Pista e guida",
    "definizione": "Tratto dritto dove si raggiunge la velocità massima.",
    "esempio": "Lo ha passato sul rettilineo."
  },
  {
    "id": "rettilineo-dei-box",
    "termine": "Rettilineo dei box",
    "inglese": "Main straight",
    "categoria": "Pista e guida",
    "definizione": "Il rettilineo davanti ai box, con la linea del traguardo.",
    "esempio": "Ha vinto per un decimo sul rettilineo dei box."
  },
  {
    "id": "scia",
    "termine": "Scia",
    "inglese": "Slipstream / tow",
    "categoria": "Pista e guida",
    "definizione": "La zona di aria più calma dietro un'auto: chi la segue da vicino incontra meno resistenza e va più forte in rettilineo.",
    "esempio": "Sfrutta la scia e passa prima della frenata."
  },
  {
    "id": "aria-sporca",
    "termine": "Aria sporca",
    "inglese": "Dirty air",
    "categoria": "Pista e guida",
    "definizione": "L'aria turbolenta dietro un'auto, che toglie carico aerodinamico a chi segue da vicino in curva.",
    "esempio": "Nell'aria sporca le gomme anteriori si surriscaldano."
  },
  {
    "id": "sorpasso",
    "termine": "Sorpasso",
    "inglese": "Overtake",
    "categoria": "Pista e guida",
    "definizione": "Passare un'auto che precede.",
    "esempio": "Sorpasso all'esterno, bellissimo."
  },
  {
    "id": "difesa",
    "termine": "Difesa",
    "inglese": "Defending",
    "categoria": "Pista e guida",
    "definizione": "Proteggere la posizione chiudendo la traiettoria prima della frenata. È permesso un solo cambio di direzione.",
    "esempio": "Ha cambiato direzione due volte: difesa irregolare."
  },
  {
    "id": "contatto",
    "termine": "Contatto",
    "inglese": "Contact",
    "categoria": "Pista e guida",
    "definizione": "Due auto che si toccano. I commissari decidono se qualcuno ne è responsabile.",
    "esempio": "Contatto alla prima curva, nessuna penalità."
  },
  {
    "id": "testacoda",
    "termine": "Testacoda",
    "inglese": "Spin",
    "categoria": "Pista e guida",
    "definizione": "L'auto che si gira su sé stessa.",
    "esempio": "Testacoda alla Parabolica, ma riparte."
  },
  {
    "id": "lungo",
    "termine": "Lungo",
    "inglese": "Run wide / Going long",
    "categoria": "Pista e guida",
    "definizione": "Arrivare troppo veloci in curva e uscire dalla traiettoria.",
    "esempio": "È andato lungo in staccata."
  },
  {
    "id": "attardato",
    "termine": "Attardato",
    "inglese": "Backmarker",
    "categoria": "Pista e guida",
    "definizione": "Un'auto in coda al gruppo che i più veloci devono doppiare.",
    "esempio": "Ha perso tempo dietro ai doppiati."
  },
  {
    "id": "gruppo",
    "termine": "Gruppo",
    "inglese": "Pack / Field",
    "categoria": "Pista e guida",
    "definizione": "L'insieme delle auto in gara.",
    "esempio": "Il gruppo si compatta dietro la safety car."
  },
  {
    "id": "pista-gommata",
    "termine": "Pista gommata",
    "inglese": "Rubbered-in track",
    "categoria": "Pista e guida",
    "definizione": "Pista che, giro dopo giro, si copre di gomma e diventa più aderente.",
    "esempio": "La pista migliora man mano che si gomma."
  },
  {
    "id": "giro-di-lancio",
    "termine": "Giro di lancio",
    "inglese": "Out lap",
    "categoria": "Pista e guida",
    "definizione": "Il giro in cui il pilota esce dai box e prepara le gomme prima di un giro veloce.",
    "esempio": "Giro di lancio lento per non rovinare le gomme."
  },
  {
    "id": "giro-di-rientro",
    "termine": "Giro di rientro",
    "inglese": "In lap",
    "categoria": "Pista e guida",
    "definizione": "Il giro che si conclude con l'ingresso ai box.",
    "esempio": "Un giro di rientro velocissimo per l'undercut."
  },
  {
    "id": "giro-di-raffreddamento",
    "termine": "Giro di raffreddamento",
    "inglese": "Cool-down lap",
    "categoria": "Pista e guida",
    "definizione": "Il giro lento dopo la bandiera a scacchi.",
    "esempio": "Nel giro di raffreddamento saluta i tifosi."
  },
  {
    "id": "circuito-cittadino",
    "termine": "Circuito cittadino",
    "inglese": "Street circuit",
    "categoria": "Pista e guida",
    "definizione": "Pista ricavata nelle strade di una città, chiusa per l'evento.",
    "esempio": "Sui cittadini non si perdona nulla."
  },
  {
    "id": "circuito-permanente",
    "termine": "Circuito permanente",
    "inglese": "Permanent circuit",
    "categoria": "Pista e guida",
    "definizione": "Autodromo costruito per le corse.",
    "esempio": "Monza è un circuito permanente."
  },
  {
    "id": "power-unit",
    "termine": "Power unit",
    "inglese": "PU",
    "categoria": "Power unit",
    "definizione": "Il «motore» della F1 moderna: un motore termico V6 turbo più un sistema ibrido elettrico. Dal 2026 la potenza è divisa circa a metà tra termico ed elettrico.",
    "esempio": "Nuova power unit per lui in questo weekend."
  },
  {
    "id": "motore-termico",
    "termine": "Motore termico",
    "inglese": "ICE (Internal Combustion Engine)",
    "categoria": "Power unit",
    "definizione": "Il V6 di 1,6 litri turbocompresso. Dal 2026 eroga circa 400 kW (circa 540 CV), meno di prima, per lasciare spazio all'elettrico.",
    "esempio": "Il termico da solo non basta più: conta l'elettrico."
  },
  {
    "id": "turbocompressore",
    "termine": "Turbocompressore",
    "inglese": "Turbocharger (TC)",
    "categoria": "Power unit",
    "definizione": "Una turbina mossa dai gas di scarico che comprime l'aria in ingresso al motore, per bruciare più carburante e avere più potenza.",
    "esempio": "Rottura del turbo nel giro di lancio."
  },
  {
    "id": "mgu-k",
    "termine": "MGU-K",
    "inglese": "Motor Generator Unit – Kinetic",
    "categoria": "Power unit",
    "definizione": "Il motore-generatore elettrico collegato alla trasmissione: in frenata recupera energia, in accelerazione la restituisce. Dal 2026 arriva a 350 kW, prima 120.",
    "esempio": "La MGU-K da 350 kW cambia il modo di guidare."
  },
  {
    "id": "mgu-h",
    "termine": "MGU-H",
    "inglese": "Motor Generator Unit – Heat",
    "categoria": "Power unit",
    "definizione": "Il generatore collegato al turbo che recuperava energia dai gas di scarico, usato dal 2014 al 2025. Eliminato dal 2026 perché costoso e poco utile alle auto di serie.",
    "esempio": "Senza MGU-H il turbo è più difficile da gestire."
  },
  {
    "id": "batteria",
    "termine": "Batteria",
    "inglese": "Energy Store (ES)",
    "categoria": "Power unit",
    "definizione": "Il pacco di batterie che immagazzina l'energia recuperata e la restituisce alla MGU-K.",
    "esempio": "Batteria scarica alla fine del rettilineo."
  },
  {
    "id": "centralina",
    "termine": "Centralina",
    "inglese": "Control Electronics (CE)",
    "categoria": "Power unit",
    "definizione": "L'elettronica che gestisce la power unit e il flusso di energia tra batteria e MGU-K.",
    "esempio": "Guasto alla centralina: auto ferma."
  },
  {
    "id": "ers",
    "termine": "ERS",
    "inglese": "Energy Recovery System",
    "categoria": "Power unit",
    "definizione": "L'insieme dei componenti che recuperano, immagazzinano e restituiscono energia elettrica (MGU-K, batteria, centralina).",
    "esempio": "L'ERS non ricarica: perde potenza."
  },
  {
    "id": "recupero-di-energia",
    "termine": "Recupero di energia",
    "inglese": "Harvesting / Recharge",
    "categoria": "Power unit",
    "definizione": "La fase in cui la MGU-K trasforma energia di frenata in elettricità. Dal 2026 si possono recuperare circa 8,5 MJ per giro, circa il doppio di prima.",
    "esempio": "Sta ricaricando molto in frenata."
  },
  {
    "id": "boost",
    "termine": "Boost",
    "inglese": "Boost Mode",
    "categoria": "Power unit",
    "definizione": "Dal 2026, la spinta elettrica massima che il pilota può chiedere quando vuole, per attaccare o difendersi.",
    "esempio": "Ha usato il boost all'uscita della curva."
  },
  {
    "id": "overtake-mode",
    "termine": "Overtake Mode",
    "inglese": null,
    "categoria": "Power unit",
    "definizione": "Dal 2026, l'energia elettrica in più concessa a chi è entro un secondo dall'auto davanti: sostituisce di fatto il DRS come aiuto al sorpasso.",
    "esempio": "È entro il secondo: può usare l'Overtake Mode."
  },
  {
    "id": "clipping",
    "termine": "Clipping",
    "inglese": null,
    "categoria": "Power unit",
    "definizione": "Il calo di velocità in fondo al rettilineo quando la batteria smette di fornire spinta elettrica.",
    "esempio": "In fondo al rettilineo fa clipping."
  },
  {
    "id": "carburante-sostenibile",
    "termine": "Carburante sostenibile",
    "inglese": "Sustainable fuel",
    "categoria": "Power unit",
    "definizione": "Dal 2026 la F1 usa carburante 100% sostenibile, prodotto senza fonti fossili. Il regolamento limita l'energia del carburante consumata all'ora, non più la massa.",
    "esempio": "Il carburante sostenibile è una delle sfide del 2026."
  },
  {
    "id": "flussometro",
    "termine": "Flussometro",
    "inglese": "Fuel flow meter",
    "categoria": "Power unit",
    "definizione": "Il sensore FIA che misura il carburante consumato per controllare il rispetto del limite.",
    "esempio": "Il flussometro segna un valore oltre il limite."
  },
  {
    "id": "componenti-della-power-unit",
    "termine": "Componenti della power unit",
    "inglese": "PU elements",
    "categoria": "Power unit",
    "definizione": "Le parti contate dal regolamento (motore termico, turbo, MGU-K, batteria, centralina, scarico): superarne il numero concesso in stagione porta penalità in griglia.",
    "esempio": "È al quarto motore termico: arriva la penalità."
  },
  {
    "id": "mappatura",
    "termine": "Mappatura",
    "inglese": "Engine mode",
    "categoria": "Power unit",
    "definizione": "Le impostazioni della power unit che il pilota cambia dal volante: più potenza, più risparmio, più ricarica.",
    "esempio": "Passa alla mappatura da qualifica."
  },
  {
    "id": "giri-motore",
    "termine": "Giri motore",
    "inglese": "RPM",
    "categoria": "Power unit",
    "definizione": "Quante volte al minuto gira l'albero motore. In F1 il regolamento fissa un limite di 15.000 giri.",
    "esempio": "Picchia contro il limitatore in sesta."
  },
  {
    "id": "cambio",
    "termine": "Cambio",
    "inglese": "Gearbox",
    "categoria": "Power unit",
    "definizione": "La trasmissione a 8 marce più la retromarcia, con cambiate rapidissime e senza interruzione di spinta.",
    "esempio": "Problema al cambio: bloccato in quinta."
  },
  {
    "id": "cambio-seamless",
    "termine": "Cambio seamless",
    "inglese": "Seamless shift",
    "categoria": "Power unit",
    "definizione": "Il cambio che inserisce la marcia successiva prima di liberare la precedente, senza perdere spinta.",
    "esempio": "Con il seamless non si sente la cambiata."
  },
  {
    "id": "palette-del-cambio",
    "termine": "Palette del cambio",
    "inglese": "Paddle shifters",
    "categoria": "Power unit",
    "definizione": "Le levette dietro il volante per salire e scendere di marcia.",
    "esempio": "Ha rotto la paletta del cambio."
  },
  {
    "id": "frizione",
    "termine": "Frizione",
    "inglese": "Clutch",
    "categoria": "Power unit",
    "definizione": "Comandata da una leva sul volante, si usa quasi solo alla partenza.",
    "esempio": "Ha sbagliato il punto di stacco della frizione."
  },
  {
    "id": "antistallo",
    "termine": "Antistallo",
    "inglese": "Anti-stall",
    "categoria": "Power unit",
    "definizione": "Il sistema che apre la frizione per evitare lo spegnimento del motore; alla partenza può far perdere posizioni.",
    "esempio": "È scattato l'antistallo al via."
  },
  {
    "id": "carico-aerodinamico",
    "termine": "Carico aerodinamico",
    "inglese": "Downforce",
    "categoria": "Aerodinamica",
    "definizione": "La forza verso il basso generata da ali e fondo: schiaccia l'auto a terra e permette velocità in curva enormi.",
    "esempio": "Assetto da alto carico per Monaco."
  },
  {
    "id": "resistenza-aerodinamica",
    "termine": "Resistenza aerodinamica",
    "inglese": "Drag",
    "categoria": "Aerodinamica",
    "definizione": "La forza dell'aria che si oppone all'avanzamento dell'auto e ne limita la velocità massima.",
    "esempio": "Ali scariche per avere meno drag a Monza."
  },
  {
    "id": "effetto-suolo",
    "termine": "Effetto suolo",
    "inglese": "Ground effect",
    "categoria": "Aerodinamica",
    "definizione": "Il carico generato dal fondo dell'auto, sagomato in modo da accelerare l'aria sotto la vettura e creare una depressione. Tornato centrale dal 2022.",
    "esempio": "Con l'effetto suolo conta l'altezza da terra."
  },
  {
    "id": "tunnel-venturi",
    "termine": "Tunnel Venturi",
    "inglese": "Venturi tunnels",
    "categoria": "Aerodinamica",
    "definizione": "I canali sotto il fondo che si stringono e poi si allargano, accelerando l'aria per creare carico. Dal 2026 sono più piccoli.",
    "esempio": "Il cuore dell'auto sono i tunnel Venturi."
  },
  {
    "id": "fondo",
    "termine": "Fondo",
    "inglese": "Floor",
    "categoria": "Aerodinamica",
    "definizione": "La parte piatta sotto l'auto, con tunnel e diffusore: genera gran parte del carico aerodinamico.",
    "esempio": "Fondo danneggiato: perde un secondo al giro."
  },
  {
    "id": "diffusore",
    "termine": "Diffusore",
    "inglese": "Diffuser",
    "categoria": "Aerodinamica",
    "definizione": "La parte posteriore del fondo che si allarga verso l'alto, rallentando l'aria in uscita e aumentando il carico.",
    "esempio": "Il diffusore lavora meglio con il posteriore basso."
  },
  {
    "id": "pattino",
    "termine": "Pattino",
    "inglese": "Plank / skid block",
    "categoria": "Aerodinamica",
    "definizione": "La tavola sotto il fondo che si consuma toccando terra: se è troppo consumata a fine gara, scatta la squalifica.",
    "esempio": "Pattino consumato oltre il limite: squalifica."
  },
  {
    "id": "porpoising",
    "termine": "Porpoising",
    "inglese": "Saltellamento",
    "categoria": "Aerodinamica",
    "definizione": "Il rimbalzo dell'auto sui rettilinei, quando il fondo si avvicina troppo a terra, perde carico e risale ciclicamente.",
    "esempio": "Porpoising violento sul rettilineo."
  },
  {
    "id": "ala-anteriore",
    "termine": "Ala anteriore",
    "inglese": "Front wing",
    "categoria": "Aerodinamica",
    "definizione": "L'ala sul muso: genera carico sull'anteriore e indirizza l'aria verso il resto dell'auto. Dal 2026 ha una parte mobile ed è 100 mm più stretta.",
    "esempio": "Ala anteriore rotta dopo il contatto."
  },
  {
    "id": "ala-posteriore",
    "termine": "Ala posteriore",
    "inglese": "Rear wing",
    "categoria": "Aerodinamica",
    "definizione": "L'ala in coda: genera carico sul posteriore. Dal 2026 è a tre elementi, con parte mobile.",
    "esempio": "Ala posteriore più scarica per il rettilineo lungo."
  },
  {
    "id": "flap",
    "termine": "Flap",
    "inglese": null,
    "categoria": "Aerodinamica",
    "definizione": "Gli elementi mobili o regolabili delle ali. Ai box si regola l'angolo dell'ala anteriore per bilanciare l'auto.",
    "esempio": "Due giri di flap in più all'anteriore."
  },
  {
    "id": "paratia",
    "termine": "Paratia",
    "inglese": "Endplate",
    "categoria": "Aerodinamica",
    "definizione": "La parete verticale all'estremità delle ali, che separa e guida i flussi d'aria.",
    "esempio": "Paratia danneggiata dal cordolo."
  },
  {
    "id": "beam-wing",
    "termine": "Beam wing",
    "inglese": null,
    "categoria": "Aerodinamica",
    "definizione": "La piccola ala bassa sotto quella posteriore. Eliminata dal regolamento 2026.",
    "esempio": "Senza beam wing il posteriore è più semplice."
  },
  {
    "id": "aerodinamica-attiva",
    "termine": "Aerodinamica attiva",
    "inglese": "Active aero",
    "categoria": "Aerodinamica",
    "definizione": "Dal 2026 ali anteriore e posteriore cambiano assetto: la modalità «curva» (Corner Mode) dà carico, quella «rettilineo» (Straight Mode) riduce la resistenza.",
    "esempio": "Nel lungo rettilineo passa alla modalità a bassa resistenza."
  },
  {
    "id": "corner-mode",
    "termine": "Corner Mode",
    "inglese": "Modalità curva",
    "categoria": "Aerodinamica",
    "definizione": "La configurazione delle ali ad alto carico, usata in curva. Nelle prime bozze del regolamento si chiamava Z-Mode.",
    "esempio": "Le ali tornano in Corner Mode prima della frenata."
  },
  {
    "id": "straight-mode",
    "termine": "Straight Mode",
    "inglese": "Modalità rettilineo",
    "categoria": "Aerodinamica",
    "definizione": "La configurazione delle ali a bassa resistenza, usabile sui rettilinei indicati. Nelle prime bozze si chiamava X-Mode.",
    "esempio": "Straight Mode attivo: velocità di punta più alta."
  },
  {
    "id": "drs",
    "termine": "DRS",
    "inglese": "Drag Reduction System",
    "categoria": "Aerodinamica",
    "definizione": "L'aletta mobile dell'ala posteriore usata dal 2011 al 2025 da chi era entro un secondo dall'auto davanti, per facilitare il sorpasso. Sostituito nel 2026 da aerodinamica attiva e Overtake Mode.",
    "esempio": "Senza DRS sarebbe stato impossibile passarlo."
  },
  {
    "id": "pance",
    "termine": "Pance",
    "inglese": "Sidepods",
    "categoria": "Aerodinamica",
    "definizione": "I volumi ai lati dell'abitacolo che contengono i radiatori.",
    "esempio": "Pance sottilissime sulla nuova auto."
  },
  {
    "id": "airbox",
    "termine": "Airbox",
    "inglese": "Presa d'aria",
    "categoria": "Aerodinamica",
    "definizione": "La presa d'aria sopra la testa del pilota, che alimenta il motore e i radiatori.",
    "esempio": "Un sacchetto di plastica nell'airbox."
  },
  {
    "id": "bilanciamento",
    "termine": "Bilanciamento",
    "inglese": "Balance",
    "categoria": "Aerodinamica",
    "definizione": "La distribuzione del carico e dell'aderenza tra anteriore e posteriore: decide se l'auto sottosterza o sovrasterza.",
    "esempio": "Il bilanciamento cambia con il vento."
  },
  {
    "id": "carico-basso",
    "termine": "Carico basso",
    "inglese": "Low downforce",
    "categoria": "Aerodinamica",
    "definizione": "Assetto con ali scariche, per circuiti veloci come Monza.",
    "esempio": "Specifica a basso carico per Las Vegas."
  },
  {
    "id": "wake",
    "termine": "Wake",
    "inglese": "Scia turbolenta",
    "categoria": "Aerodinamica",
    "definizione": "La turbolenza lasciata dall'auto davanti. Le regole del 2022 e del 2026 cercano di ridurla per facilitare la lotta ravvicinata.",
    "esempio": "Il wake di queste auto è molto meno forte."
  },
  {
    "id": "monoscocca",
    "termine": "Monoscocca",
    "inglese": "Monocoque",
    "categoria": "Telaio e assetto",
    "definizione": "La struttura centrale in fibra di carbonio che contiene il pilota: tutto il resto dell'auto vi è collegato.",
    "esempio": "La monoscocca deve superare i crash test FIA."
  },
  {
    "id": "fibra-di-carbonio",
    "termine": "Fibra di carbonio",
    "inglese": "Carbon fibre",
    "categoria": "Telaio e assetto",
    "definizione": "Il materiale composito leggero e rigidissimo con cui è costruita quasi tutta l'auto.",
    "esempio": "Un fondo in fibra di carbonio pesa pochi chili."
  },
  {
    "id": "passo-interasse",
    "termine": "Passo (interasse)",
    "inglese": "Wheelbase",
    "categoria": "Telaio e assetto",
    "definizione": "La distanza tra gli assi delle ruote anteriori e posteriori. Dal 2026 al massimo 3.400 mm, 200 in meno di prima.",
    "esempio": "Il passo più corto rende l'auto più agile."
  },
  {
    "id": "larghezza",
    "termine": "Larghezza",
    "inglese": "Width",
    "categoria": "Telaio e assetto",
    "definizione": "Dal 2026 l'auto non può superare i 1.900 mm di larghezza (prima 2.000).",
    "esempio": "Auto più strette, più spazio per sorpassare."
  },
  {
    "id": "assetto",
    "termine": "Assetto",
    "inglese": "Setup",
    "categoria": "Telaio e assetto",
    "definizione": "L'insieme delle regolazioni dell'auto (ali, sospensioni, altezze, freni) adattate a pista e pilota.",
    "esempio": "Hanno sbagliato l'assetto: troppo rigida."
  },
  {
    "id": "altezza-da-terra",
    "termine": "Altezza da terra",
    "inglese": "Ride height",
    "categoria": "Telaio e assetto",
    "definizione": "La distanza tra fondo e asfalto: più è bassa, più carico genera il fondo, ma aumenta il rischio di toccare.",
    "esempio": "Altezza da terra alzata per i cordoli di Singapore."
  },
  {
    "id": "rake",
    "termine": "Rake",
    "inglese": "Assetto picchiato",
    "categoria": "Telaio e assetto",
    "definizione": "L'inclinazione dell'auto, con il posteriore più alto dell'anteriore. Molto usato prima del 2022.",
    "esempio": "Con l'effetto suolo il rake conta meno."
  },
  {
    "id": "campanatura",
    "termine": "Campanatura",
    "inglese": "Camber",
    "categoria": "Telaio e assetto",
    "definizione": "L'inclinazione della ruota rispetto alla verticale, vista da davanti. In F1 le ruote sono inclinate verso l'interno.",
    "esempio": "Pirelli impone un limite di campanatura."
  },
  {
    "id": "convergenza",
    "termine": "Convergenza",
    "inglese": "Toe",
    "categoria": "Telaio e assetto",
    "definizione": "L'angolo delle ruote viste dall'alto: verso l'interno (convergenza) o verso l'esterno (divergenza).",
    "esempio": "Un po' più di divergenza all'anteriore per l'inserimento."
  },
  {
    "id": "sospensioni",
    "termine": "Sospensioni",
    "inglese": "Suspension",
    "categoria": "Telaio e assetto",
    "definizione": "Il sistema che collega le ruote al telaio: in F1 bracci in carbonio (triangoli), ammortizzatori e molle.",
    "esempio": "Sospensione rotta dopo il cordolo."
  },
  {
    "id": "push-rod-e-pull-rod",
    "termine": "Push-rod e pull-rod",
    "inglese": null,
    "categoria": "Telaio e assetto",
    "definizione": "Due schemi di sospensione: l'asta che collega ruota e ammortizzatore lavora a compressione (push-rod) o a trazione (pull-rod).",
    "esempio": "Ha scelto il pull-rod all'anteriore."
  },
  {
    "id": "triangoli",
    "termine": "Triangoli",
    "inglese": "Wishbones",
    "categoria": "Telaio e assetto",
    "definizione": "I bracci a forma di triangolo che collegano il portamozzo al telaio.",
    "esempio": "Triangolo superiore piegato."
  },
  {
    "id": "portamozzo",
    "termine": "Portamozzo",
    "inglese": "Upright",
    "categoria": "Telaio e assetto",
    "definizione": "Il pezzo a cui sono fissati ruota, freno e bracci della sospensione.",
    "esempio": "Il portamozzo non ha retto l'urto."
  },
  {
    "id": "rigidita",
    "termine": "Rigidità",
    "inglese": "Stiffness",
    "categoria": "Telaio e assetto",
    "definizione": "Quanto sono dure molle e barre antirollio: un'auto rigida reagisce in fretta ma soffre i cordoli.",
    "esempio": "Più rigida al posteriore per la trazione."
  },
  {
    "id": "barra-antirollio",
    "termine": "Barra antirollio",
    "inglese": "Anti-roll bar",
    "categoria": "Telaio e assetto",
    "definizione": "La barra che limita l'inclinazione laterale dell'auto in curva.",
    "esempio": "Barra antirollio anteriore più morbida."
  },
  {
    "id": "volante",
    "termine": "Volante",
    "inglese": "Steering wheel",
    "categoria": "Telaio e assetto",
    "definizione": "Il volante in carbonio, con display e decine di pulsanti e manopole per controllare l'auto.",
    "esempio": "Ha sbagliato manopola sul volante."
  },
  {
    "id": "crash-test",
    "termine": "Crash test",
    "inglese": null,
    "categoria": "Telaio e assetto",
    "definizione": "Le prove d'urto della FIA che ogni telaio deve superare prima di correre.",
    "esempio": "Il telaio non ha passato il crash test."
  },
  {
    "id": "roll-hoop",
    "termine": "Roll hoop",
    "inglese": "Roll bar",
    "categoria": "Telaio e assetto",
    "definizione": "La struttura sopra la testa del pilota, dietro l'abitacolo, che protegge in caso di ribaltamento.",
    "esempio": "Il roll hoop ha resistito al ribaltamento."
  },
  {
    "id": "freni-carbonio-carbonio",
    "termine": "Freni carbonio-carbonio",
    "inglese": "Carbon-carbon brakes",
    "categoria": "Freni",
    "definizione": "Dischi e pastiglie in carbonio, leggerissimi, che funzionano solo molto caldi e arrivano a circa 1.000 °C.",
    "esempio": "Freni carbonio-carbonio incandescenti a fine rettilineo."
  },
  {
    "id": "brake-by-wire",
    "termine": "Brake-by-wire",
    "inglese": null,
    "categoria": "Freni",
    "definizione": "Il sistema che gestisce elettronicamente la frenata posteriore, combinando i freni con il recupero di energia della MGU-K.",
    "esempio": "Guasto al brake-by-wire: posteriore instabile."
  },
  {
    "id": "ripartizione-di-frenata",
    "termine": "Ripartizione di frenata",
    "inglese": "Brake balance / bias",
    "categoria": "Freni",
    "definizione": "Quanto la frenata è distribuita tra anteriore e posteriore; il pilota la regola dal volante, anche curva per curva.",
    "esempio": "Sposta la ripartizione in avanti di un punto."
  },
  {
    "id": "prese-d-aria-dei-freni",
    "termine": "Prese d'aria dei freni",
    "inglese": "Brake ducts",
    "categoria": "Freni",
    "definizione": "Le prese che raffreddano i freni; sono anche un elemento aerodinamico.",
    "esempio": "Prese dei freni chiuse per scaldare le gomme."
  },
  {
    "id": "surriscaldamento-dei-freni",
    "termine": "Surriscaldamento dei freni",
    "inglese": "Brake overheating",
    "categoria": "Freni",
    "definizione": "Temperature troppo alte che riducono l'efficacia della frenata, tipiche di quando si segue un'altra auto.",
    "esempio": "Freni troppo caldi: deve stare fuori dalla scia."
  },
  {
    "id": "copy",
    "termine": "Copy",
    "inglese": "Ricevuto",
    "categoria": "Gergo e radio",
    "definizione": "«Ricevuto», nelle comunicazioni via radio.",
    "esempio": "Copy, gomme dure."
  },
  {
    "id": "push",
    "termine": "Push",
    "inglese": "Spingi",
    "categoria": "Gergo e radio",
    "definizione": "L'invito a girare più forte possibile.",
    "esempio": "Push now, push!"
  },
  {
    "id": "hammer-time",
    "termine": "Hammer time",
    "inglese": null,
    "categoria": "Gergo e radio",
    "definizione": "Espressione via radio per «ora dai tutto», resa celebre da Mercedes.",
    "esempio": "It's hammer time."
  },
  {
    "id": "plan-b",
    "termine": "Plan B",
    "inglese": "Piano B",
    "categoria": "Gergo e radio",
    "definizione": "La strategia alternativa preparata in anticipo.",
    "esempio": "Passiamo al piano B."
  },
  {
    "id": "multi-21",
    "termine": "Multi 21",
    "inglese": null,
    "categoria": "Gergo e radio",
    "definizione": "Celebre ordine di scuderia del 2013 (Red Bull, Malesia): l'auto 2 doveva restare davanti alla 1. Oggi indica un ordine di squadra ignorato.",
    "esempio": "Un altro caso Multi 21?"
  },
  {
    "id": "sandbagging",
    "termine": "Sandbagging",
    "inglese": "Nascondersi",
    "categoria": "Gergo e radio",
    "definizione": "Non mostrare il vero potenziale nelle prove, per non scoprire le carte.",
    "esempio": "Nei test erano in sandbagging."
  },
  {
    "id": "paddock",
    "termine": "Paddock",
    "inglese": null,
    "categoria": "Gergo e radio",
    "definizione": "L'area riservata dietro i box dove lavorano squadre, ospiti e media.",
    "esempio": "Nel paddock non si parla d'altro."
  },
  {
    "id": "garage",
    "termine": "Garage",
    "inglese": null,
    "categoria": "Gergo e radio",
    "definizione": "Lo spazio della squadra nella corsia dei box, dove l'auto viene preparata.",
    "esempio": "L'auto è in garage con il motore smontato."
  },
  {
    "id": "grid-walk",
    "termine": "Grid walk",
    "inglese": null,
    "categoria": "Gergo e radio",
    "definizione": "La passeggiata dei giornalisti TV sulla griglia prima della partenza.",
    "esempio": "Intervista volante durante il grid walk."
  },
  {
    "id": "silly-season",
    "termine": "Silly season",
    "inglese": null,
    "categoria": "Gergo e radio",
    "definizione": "Il periodo delle voci di mercato sui piloti per la stagione successiva.",
    "esempio": "La silly season è già cominciata."
  },
  {
    "id": "midfield",
    "termine": "Midfield",
    "inglese": "Centro gruppo",
    "categoria": "Gergo e radio",
    "definizione": "Le squadre che lottano nelle posizioni di mezzo, dietro i top team.",
    "esempio": "La lotta in centro gruppo è serratissima."
  },
  {
    "id": "top-team",
    "termine": "Top team",
    "inglese": null,
    "categoria": "Gergo e radio",
    "definizione": "Le squadre che lottano per vittorie e campionati.",
    "esempio": "Un podio da centro gruppo davanti ai top team."
  },
  {
    "id": "privato",
    "termine": "Privato",
    "inglese": "Customer team",
    "categoria": "Gergo e radio",
    "definizione": "Squadra che usa la power unit di un altro costruttore.",
    "esempio": "Il team clienti batte la squadra ufficiale."
  },
  {
    "id": "squadra-ufficiale",
    "termine": "Squadra ufficiale",
    "inglese": "Works team",
    "categoria": "Gergo e radio",
    "definizione": "Squadra che costruisce in casa anche la propria power unit.",
    "esempio": "Tra i team ufficiali è il più lento."
  },
  {
    "id": "upgrade",
    "termine": "Upgrade",
    "inglese": "Aggiornamento",
    "categoria": "Gergo e radio",
    "definizione": "Pezzi nuovi portati in pista per migliorare le prestazioni.",
    "esempio": "Pacchetto di aggiornamenti per il GP di casa."
  },
  {
    "id": "pacchetto",
    "termine": "Pacchetto",
    "inglese": "Package",
    "categoria": "Gergo e radio",
    "definizione": "L'insieme di aggiornamenti tecnici introdotto insieme.",
    "esempio": "Il nuovo pacchetto aerodinamico funziona."
  },
  {
    "id": "tifosi",
    "termine": "Tifosi",
    "inglese": null,
    "categoria": "Gergo e radio",
    "definizione": "I tifosi della Ferrari; in inglese la parola italiana si usa così com'è.",
    "esempio": "Monza è casa dei tifosi."
  },
  {
    "id": "gara-di-casa",
    "termine": "Gara di casa",
    "inglese": "Home race",
    "categoria": "Gergo e radio",
    "definizione": "Il Gran Premio nel paese del pilota o della squadra.",
    "esempio": "Vittoria nella gara di casa."
  },
  {
    "id": "test-pre-stagionali",
    "termine": "Test pre-stagionali",
    "inglese": "Pre-season testing",
    "categoria": "Gergo e radio",
    "definizione": "I pochi giorni di prove collettive prima della prima gara.",
    "esempio": "Nei test è sembrata subito veloce."
  },
  {
    "id": "media-day",
    "termine": "Media day",
    "inglese": null,
    "categoria": "Gergo e radio",
    "definizione": "Il giovedì del weekend, dedicato a interviste e conferenze stampa.",
    "esempio": "Al media day ha smentito le voci."
  },
  {
    "id": "conferenza-stampa",
    "termine": "Conferenza stampa",
    "inglese": "Press conference",
    "categoria": "Gergo e radio",
    "definizione": "Le interviste ufficiali FIA ai piloti, prima del weekend e dopo qualifica e gara.",
    "esempio": "In conferenza stampa ha attaccato i commissari."
  },
  {
    "id": "driver-of-the-day",
    "termine": "Driver of the Day",
    "inglese": "Pilota del giorno",
    "categoria": "Gergo e radio",
    "definizione": "Il premio simbolico votato dai tifosi online durante la gara.",
    "esempio": "Eletto Driver of the Day dopo la rimonta."
  },
  {
    "id": "rimonta",
    "termine": "Rimonta",
    "inglese": "Comeback",
    "categoria": "Gergo e radio",
    "definizione": "Recuperare molte posizioni partendo dal fondo.",
    "esempio": "Dal ventesimo al quinto posto: che rimonta."
  },
  {
    "id": "prima-fila",
    "termine": "Prima fila",
    "inglese": "Front row",
    "categoria": "Gergo e radio",
    "definizione": "Le prime due posizioni della griglia.",
    "esempio": "Prima fila tutta rossa."
  },
  {
    "id": "lotta-ruota-a-ruota",
    "termine": "Lotta ruota a ruota",
    "inglese": "Wheel-to-wheel",
    "categoria": "Gergo e radio",
    "definizione": "Due auto affiancate che si contendono la posizione.",
    "esempio": "Tre curve ruota a ruota."
  }
];
