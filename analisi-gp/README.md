# Analisi GP — sezione di monoposto.ai

Sezione di analisi telemetrica per l'ultima stagione di Formula 1: telemetria
comparativa tra due piloti, strategie gomme e confronto tempi sul giro, GP
per GP. Dati da [FastF1](https://github.com/theOehrly/Fast-F1) (telemetria e
sessioni) e [Jolpica-F1](https://github.com/jolpica/jolpica-f1) (classifiche
— tramite il client integrato in FastF1, `fastf1.ergast`, non un pacchetto a
parte: "jolpica-f1" non esiste come pacchetto pip installabile).

## ⚠️ Aggiornamento: solo manuale, non automatico

I server di F1 (`livetiming.formula1.com`, la fonte usata da FastF1 per
telemetria e tempi sul giro) **bloccano attivamente le richieste dagli
indirizzi IP dei servizi cloud/hosting** — GitHub Actions, Google Colab, VPS
in genere — con un errore 403, indipendentemente dal codice usato. È un
blocco lato server di F1, documentato pubblicamente da più utenti FastF1 e
non aggirabile con nessuna modifica allo script. Per questo **non c'è un
workflow GitHub Actions**: girerebbe regolarmente a vuoto, fallendo sempre e
generando solo email di errore inutili.

L'aggiornamento va quindi lanciato **a mano, dal tuo computer** (una
connessione residenziale normale funziona correttamente) — vedi sotto.

## Struttura

```
analisi-gp/
  scripts/
    update_data.py       lo script che scarica e prepara i dati
    requirements.txt
frontend/public/analisi-gp/
  index.html, style.css, app.js    la dashboard statica
  data/                            JSON generati da update_data.py — Vite
                                    copia questa intera cartella così com'è
                                    nella build finale del sito
```

## Come aggiornare i dati (dal tuo computer)

```bash
# La prima volta soltanto
pip install -r analisi-gp/scripts/requirements.txt

# Ultimo GP disputato dell'anno corrente
F1_DATA_DIR=frontend/public/analisi-gp/data python analisi-gp/scripts/update_data.py

# Un anno/round specifico
F1_DATA_DIR=frontend/public/analisi-gp/data python analisi-gp/scripts/update_data.py --year 2026 --round 15

# Tutti i GP già disputati della stagione (prima esecuzione, o per
# ripopolare l'intero storico)
F1_DATA_DIR=frontend/public/analisi-gp/data python analisi-gp/scripts/update_data.py --all
```

Poi fai commit e push dei JSON generati come faresti con qualunque altra
modifica:

```bash
git add frontend/public/analisi-gp/data
git commit -m "Aggiorna dati F1"
git push
```

Una volta pushato, il sito si aggiorna da solo (la pubblicazione del sito
resta automatica, è solo la *raccolta* dei dati a dover partire da un tuo
computer). Ripeti questo giro ogni volta che vuoi aggiungere un GP — non
c'è una cadenza obbligata, dipende solo da quando trovi il tempo di
lanciarlo.

**Cache**: la cartella `analisi-gp/cache/` (cache di FastF1) si crea da
sola al primo avvio e resta sul tuo computer tra un lancio e l'altro
dello script — non va versionata nel repository (già esclusa in
`.gitignore`), evita di riscaricare da zero i dati già ottenuti in
precedenza.

## Verifica in locale prima di pushare (facoltativo)

```bash
cd frontend/public/analisi-gp && python3 -m http.server 8000
# poi apri http://127.0.0.1:8000/
```

(Necessario un piccolo server locale: il browser blocca il `fetch()` dei
JSON se apri `index.html` direttamente da disco con `file://`.)

## Estendere i dati esportati

- **Un nuovo canale di telemetria** (es. RPM, marcia): aggiungi una riga al
  dizionario `CANALI_TELEMETRIA` in `update_data.py` e la colonna
  corrispondente nel dizionario ritornato da `estrai_telemetria_giro()`; poi
  aggiungi la voce corrispondente in `CANALI_TELEMETRIA` (array) in
  `app.js` per farla comparire come pannello nel grafico telemetria.
- **Weekend Sprint**: lo script oggi carica Qualifica ('Q') e Gara ('R');
  un weekend Sprint ha sessioni aggiuntive (Sprint, Sprint Qualifying/Shootout)
  non ancora estratte — `carica_sessione()` accetta già qualunque
  identificatore FastF1 valido, andrebbe solo aggiunta la chiamata e i
  relativi file di output.

## Se in futuro vuoi riprovare l'automazione

Se un giorno F1 cambia politica, o vuoi comunque un aggiornamento
automatico, l'unica strada che risulta funzionare è un runner GitHub
Actions **self-hosted** (un tuo computer/server sempre acceso, registrato
come runner del repository, così le richieste partono dal tuo indirizzo IP
residenziale invece che da quello di GitHub) — non un workflow sulle
macchine cloud condivise di GitHub, che restano bloccate allo stesso modo.
