# Analisi GP — sezione di monoposto.ai

Telemetria comparativa tra due piloti, strategie gomme e ritmo gara, Gran
Premio per Gran Premio. È una pagina vera del sito (menu → **Analisi**, indirizzo
`/analisi`) e legge dei file JSON già pronti: nessun server da mantenere.

## Come funziona (in breve)

**Si aggiorna da sola.** Ogni **lunedì e mercoledì alle 08:00 UTC** un
processo automatico su GitHub (`.github/workflows/f1-update.yml`) controlla se
ci sono Gran Premi nuovi, scarica i dati, li salva nel repository e il sito si
ripubblica da solo. Se non c'è nulla di nuovo non cambia niente. Il mercoledì
è un secondo tentativo, utile se lunedì i dati non erano ancora pronti.

Non serve fare nulla, se non **una volta sola** per riempire subito la
stagione (vedi sotto).

## La prima volta: riempire la stagione

1. Su GitHub apri il repository → scheda **Actions**.
2. A sinistra scegli **Aggiornamento dati Analisi GP**.
3. Pulsante **Run workflow** → lascia i campi vuoti → **Run workflow**.
4. Attendi (circa un'ora per una stagione intera). Se il tempo massimo
   finisce prima, non è un problema: alla prossima esecuzione riprende da
   dove si era fermato.

Da lì in poi è automatico.

## Se qualcosa non va

- **La pagina dice "I dati non sono ancora disponibili"**: l'aggiornamento non
  ha ancora salvato nessun GP. Lancia il passo "La prima volta" e controlla
  l'esito in **Actions**.
- **L'esecuzione risulta rossa (errore) su GitHub**: apri l'esecuzione, poi il
  passo "Scarica e prepara i dati" e leggi le ultime righe. Le più comuni:
  - *`Richiesta fallita dopo 5 tentativi ... 403`* → il servizio di dati ha
    bloccato le richieste (con FastF1 succedeva sempre; con OpenF1 non
    dovrebbe). Mandami l'errore.
  - *`GP N rimandato: ...`* → non è un errore: i dati di quel GP non sono
    ancora pubblicati, verrà ritentato da solo alla prossima esecuzione.
- **Un GP non compare mai**: cerca nel log "rimandato": il motivo è scritto lì
  (es. gara annullata, o assente su OpenF1).

Un'esecuzione con dati "rimandati" non è rossa: solo gli errori veri lo sono, e
in quel caso GitHub ti scrive per email.

## Da dove arrivano i dati

| Cosa | Fonte |
|---|---|
| Tempi sui giri, mescole/stint, telemetria (velocità, acceleratore, freno, DRS) | [OpenF1](https://openf1.org) — gratuita, senza chiave per lo storico |
| Calendario, classifica finale, punti, classifica mondiale | [Jolpica-F1](https://github.com/jolpica/jolpica-f1) (successore di Ergast) |

Entrambe sono progetti non ufficiali, non affiliati a Formula 1.

**Perché non più FastF1.** FastF1 legge i server "live timing" di F1, che
rifiutano (403) le richieste da servizi cloud come GitHub Actions o Render:
verificato sia da GitHub Actions sia dal backend su Render. OpenF1 non ha il
blocco, quindi l'aggiornamento può essere automatico. Lo script non usa
nessuna libreria esterna (solo la libreria standard di Python).

## Limiti da conoscere

- **Solo dal 2023 in poi** (limite di OpenF1). Per la storia più antica il sito
  ha le altre sezioni.
- **Distanza in pista calcolata, non misurata.** OpenF1 non fornisce la
  distanza: si ricava integrando la velocità e poi si allinea tra i piloti della
  stessa sessione, così le curve si sovrappongono. Le curve possono risultare
  sfasate di qualche decina di metri.
- **Giro più veloce = il più veloce cronometrato.** In Qualifica può essere un
  giro poi cancellato per track limits.
- **Un giro per pilota** per la telemetria (il più veloce), non tutti i giri:
  così due piloti qualsiasi sono confrontabili e i file restano leggeri.
- **Compagni di squadra**: hanno lo stesso colore, quindi il secondo pilota
  scelto è disegnato tratteggiato.
- OpenF1 pubblica i dati storici con qualche ora di ritardo: un GP appena
  finito può comparire il giorno dopo.

## Uso manuale (facoltativo, per sviluppatori)

Non serve installare nulla:

```bash
python3 analisi-gp/scripts/update_data.py                # GP mancanti dell'anno in corso
python3 analisi-gp/scripts/update_data.py --year 2025    # un'altra stagione (>= 2023)
python3 analisi-gp/scripts/update_data.py --round 15     # solo un round
python3 analisi-gp/scripts/update_data.py --rigenera     # rielabora anche i GP già presenti
```

I file vengono scritti in `frontend/public/analisi-gp/data/` (si cambia con la
variabile d'ambiente `F1_DATA_DIR`). Per vederli nella pagina, avvia il sito
come sempre (`cd frontend && npm run dev`) e apri `/analisi`.

## Struttura

```
analisi-gp/scripts/update_data.py     lo script (solo libreria standard)
frontend/public/analisi-gp/data/      i JSON generati — il sito li serve così come sono
frontend/src/views/AnalisiView.jsx    la pagina /analisi (selettori e grafici)
frontend/src/utils/analisiGrafici.js  costruzione dei tre grafici
frontend/src/components/PlotlyChart.jsx  contenitore dei grafici (Plotly si scarica solo qui)
frontend/src/App.jsx                  rotta /analisi e voce "Analisi" nel menu
.github/workflows/f1-update.yml       l'aggiornamento automatico
```

## Estendere

- **Un nuovo canale di telemetria** (es. RPM o marcia; OpenF1 li fornisce):
  aggiungilo in `traccia_giro()` di `update_data.py` e nell'array
  `CANALI_TELEMETRIA` di `frontend/src/utils/analisiGrafici.js`.
- **Weekend Sprint**: oggi si usano Qualifica e Gara. La sessione "Sprint" si
  può aggiungere con la stessa logica di `elabora_sessione()`.
